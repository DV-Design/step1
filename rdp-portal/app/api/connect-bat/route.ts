import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { createConnectToken } from "@/lib/rdpTokens";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const udsId = searchParams.get("udsId");
  if (!udsId) return NextResponse.json({ error: "Missing udsId" }, { status: 400 });

  const uds = await prisma.uds.findUnique({ where: { id: udsId } });
  if (!uds) return NextResponse.json({ error: "UDS not found" }, { status: 404 });

  const token = createConnectToken({ udsId, userId: (session.user as { id?: string } | undefined)?.id ?? "" });

  const { origin } = new URL(req.url);
  const base = process.env.PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || origin;
  const startUrl = `${base}/api/session/start`;
  const endUrl = `${base}/api/session/end`;
  const heartbeatUrl = `${base}/api/session/heartbeat`;

  const bat = `
@echo off
setlocal enabledelayedexpansion
set "TOKEN=${token}"
set "START_URL=${startUrl}"
set "END_URL=${endUrl}"
set "HEARTBEAT_URL=${heartbeatUrl}"
set "TEMP_RDP=%TEMP%\\rdp-!RANDOM!.rdp"
set "SESSION_FILE=%TEMP%\\session-!RANDOM!.tok"
echo Do not close this window until the remote session ends.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$b=Invoke-RestMethod -Method Post -Uri '%START_URL%' -Body (@{ token='%TOKEN%' } | ConvertTo-Json) -ContentType 'application/json';" ^
  "Set-Content -Path '%TEMP_RDP%' -Value $b.rdpContent -Encoding Ascii;" ^
  "Set-Content -Path '%SESSION_FILE%' -Value $b.sessionToken -Encoding Ascii"
if errorlevel 1 (
  echo Failed to start session.
  exit /b 1
)

set /p SESSIONTOKEN=<"%SESSION_FILE%"

rem Start heartbeat in background
start "" cmd /c "%~f0" HB "%SESSIONTOKEN%" "%HEARTBEAT_URL%"

rem Launch RDP and wait
start /wait "" mstsc.exe "%TEMP_RDP%"

rem Send end with retries
for /l %%i in (1,1,3) do (
  curl -s -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "sessionToken=%SESSIONTOKEN%" "%END_URL%" >nul 2>&1 && goto endok
  timeout /t 1 >nul
)
:endok

del /q "%TEMP_RDP%" 2>nul
del /q "%SESSION_FILE%" 2>nul
echo Remote session ended.
exit /b 0

:HB
setlocal
enableextensions
set "SESSIONTOKEN=%2"
set "HBU=%3"
:HB_LOOP
tasklist /fi "imagename eq mstsc.exe" | find /i "mstsc.exe" >nul || goto HB_END
curl -s -X POST -H "Content-Type: application/json" -d "{\"sessionToken\":\"%SESSIONTOKEN%\"}" "%HBU%" >nul 2>&1
timeout /t 10 >nul
goto HB_LOOP
:HB_END
exit /b 0
`.trim();

  return new NextResponse(bat, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="connect.bat"`,
    },
  });
}
