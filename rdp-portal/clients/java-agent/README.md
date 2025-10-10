# RDP Portal Java Agent (Windows)

Purpose: handle `rdp-portal://connect?token=...&base=...` links to start RDP sessions without exposing IPs, send heartbeats, and end sessions.

## Features
- Custom URL protocol handler (`rdp-portal`) launches the agent
- Calls `/api/session/start` with the token
- Writes `.rdp` (UTF-16, CRLF), launches `mstsc.exe`
- Heartbeat every 10s via `/api/session/heartbeat`
- On exit or shutdown, calls `/api/session/end`

## Build
- Requires Java 17+
- Build with Gradle or Maven; package with `jpackage` to an MSI/EXE installer

## Protocol registration (per-user)
Create registry keys:
- `HKCU\Software\Classes\rdp-portal` (Default: `URL: RDP Portal`)
- `HKCU\Software\Classes\rdp-portal\URL Protocol` (empty string value)
- `HKCU\Software\Classes\rdp-portal\shell\open\command` (Default: `"C:\\Program Files\\RdpPortalAgent\\RdpPortalAgent.exe" "%1"`)

## Agent behavior
- Parse the URL, extract `token` and optional `base` (fallback to `PUBLIC_BASE_URL` compiled into the app)
- Use Java HttpClient with timeouts; ScheduledExecutorService for heartbeat
- Write `.rdp` with Windows newlines and UTF-16 encoding
- Track mstsc process and send end on exit; add shutdown hook

## Deploy
- Code sign the installer
- Distribute via GPO/Intune/Winget
- Users click Connect in portal (link becomes `rdp-portal://connect?token=...&base=...`)
