# Release Notes: Sprint 2 (Production Hardening & Telemetry Activation)

## Features & Improvements
- **SSO Identity Flow**: Implemented automatic passkey bypass when AXiM Passport tokens are present in the URL or stored securely.
- **Biometric Linking**: Added ability to register biometric passkeys directly from the SSO authenticated state.
- **Telemetry Heartbeat**: Integrated a live 15-second ping against critical AXiM nodes (Core, Support/ADT, Onyx, Edge) for live operational awareness.
- **PWA Layout Protection**: Fixed iOS Safari safe-area bottom swiping to prevent system overlaps on primary action buttons; applied `100dvh` for steady mobile viewport.
- **Voice Resilience**: Fallback focus to text terminal input natively when browser microphone permissions are dismissed or unavailable.
- **Edge Resilience**: API layer (`/api/remote/*`) functions updated to null-check KV/Supabase environments correctly returning valid `fallback` flags to prevent white-screens. Offline action persistence and syncing implemented fully without exceptions.

## Verification Checklist
- [x] Zero build warnings (`npm run build`).
- [x] Tested graceful offline functionality mapping to `localDemoData.js`.
- [x] Zero backend DB alterations introduced.
- [x] PWA cache explicit bypass logic for API.
