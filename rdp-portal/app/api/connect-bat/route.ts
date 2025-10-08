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

powershell -NoProfile -ExecutionPolicy Bypass -Command "$b=Invoke-RestMethod -Method Post -Uri '%START_URL%' -Body (@{ token='%TOKEN%' } | ConvertTo-Json) -ContentType 'application/json'; $rdp=$b.rdpContent -replace '\`n','\`r\`n'; [System.IO.File]::WriteAllText('%TEMP_RDP%',$rdp,[System.Text.Encoding]::ASCII); [System.IO.File]::WriteAllText('%SESSION_FILE%',$b.sessionToken,[System.Text.Encoding]::ASCII)"
if errorlevel 1 (
  echo Failed to start session.
  exit /b 1
)

set /p SESSIONTOKEN=<"%SESSION_FILE%"

rem Start heartbeat in background
powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command ^
  "$tok='%SESSIONTOKEN%'; $url='%HEARTBEAT_URL%'; while (Get-Process mstsc -ErrorAction SilentlyContinue) { try { Invoke-RestMethod -Method Post -Uri $url -Body (@{ sessionToken = $tok } | ConvertTo-Json) -ContentType 'application/json' | Out-Null } catch { }; Start-Sleep -Seconds 10 }" 

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

`.trim();

  return new NextResponse(bat, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="connect.bat"`,
    },
  });
}
