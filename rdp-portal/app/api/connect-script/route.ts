import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { createConnectToken } from "@/lib/rdpTokens";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const udsId = searchParams.get("udsId");
  if (!udsId) return NextResponse.json({ error: "Missing udsId" }, { status: 400 });

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uds = await prisma.uds.findUnique({ where: { id: udsId } });
  if (!uds) return NextResponse.json({ error: "UDS not found" }, { status: 404 });

  const token = createConnectToken({ udsId, userId: (session.user as { id?: string } | undefined)?.id ?? "" });

  const { origin } = new URL(req.url);
  const base = process.env.PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || origin;
  const startUrl = `${base}/api/session/start`;
  const endUrl = `${base}/api/session/end`;
  const heartbeatUrl = `${base}/api/session/heartbeat`;

  const ps = `
param(
  [Parameter(Mandatory=$false)][string]$Token = "${token}"
)

$ErrorActionPreference = 'Stop'
$sessionToken = $null
$tempRdp = [System.IO.Path]::GetTempFileName().Replace('.tmp', '.rdp')
 $heartbeatTimer = $null
 $endedSent = $false

 function Send-End {
   param([string]$Tok, [string]$Url)
   if (-not $Tok) { return }
   if ($script:endedSent) { return }
   for ($i=0; $i -lt 3; $i++) {
     try {
       Invoke-RestMethod -Method Post -Uri $Url -Body @{ sessionToken = $Tok } -ContentType "application/x-www-form-urlencoded" | Out-Null
       break
     } catch {
       Start-Sleep -Milliseconds 500
     }
   }
   $script:endedSent = $true
 }

try {
  Write-Host "Do not close this window until the remote session ends." -ForegroundColor Yellow

  $startPayload = @{ token = $Token } | ConvertTo-Json
  $startRes = Invoke-RestMethod -Method Post -Uri "${startUrl}" -Body $startPayload -ContentType "application/json"
  $sessionToken = $startRes.sessionToken
  $rdpContent = $startRes.rdpContent

  Set-Content -Path $tempRdp -Value $rdpContent -Encoding ASCII
  $mstsc = Start-Process -FilePath "mstsc.exe" -ArgumentList $tempRdp -PassThru
  $mstsc.EnableRaisingEvents = $true
  Register-ObjectEvent -InputObject $mstsc -EventName Exited -Action { Send-End $using:sessionToken "${endUrl}" } | Out-Null
  Register-EngineEvent PowerShell.Exiting -Action { Send-End $using:sessionToken "${endUrl}" } | Out-Null
  
  # Heartbeat every 60 seconds while mstsc is running
  $heartbeatScript = {
    Param($Url, $Token)
    try { Invoke-RestMethod -Method Post -Uri $Url -Body (@{ sessionToken = $Token } | ConvertTo-Json) -ContentType "application/json" | Out-Null } catch { }
  }
  $heartbeatTimer = New-Object Timers.Timer
  $heartbeatTimer.Interval = 10000
  $heartbeatTimer.AutoReset = $true
  $heartbeatTimer.add_Elapsed({ $heartbeatScript.Invoke("${heartbeatUrl}", $sessionToken) })
  $heartbeatTimer.Start()
  Wait-Process -Id $mstsc.Id
}
catch {
  Write-Host "An error occurred: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
  if ($heartbeatTimer) { try { $heartbeatTimer.Stop(); $heartbeatTimer.Dispose() } catch { } }
  Send-End $sessionToken "${endUrl}"
  if (Test-Path $tempRdp) { Remove-Item $tempRdp -Force }
  Write-Host "Remote session ended." -ForegroundColor Green
}
`.trim();

  const res = new NextResponse(ps, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="connect.ps1"`,
    },
  });
  return res;
}
