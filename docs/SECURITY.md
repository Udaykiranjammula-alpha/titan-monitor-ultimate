# Security checklist

- [x] Renderer Node integration disabled; context isolation and Electron sandbox enabled.
- [x] Renderer can call only predefined IPC handlers; inputs are bounded/validated where applicable.
- [x] Browser-created windows denied; navigation constrained to the exact packaged renderer or the local development-server origin.
- [x] Content Security Policy denies remote origins, plugins, frames and form submissions.
- [x] No embedded secrets, remote telemetry, arbitrary renderer shell access, or hidden service.
- [x] Process termination has protected-PID/name guards and requires explicit UI confirmation.
- [x] Report export uses a user-controlled Save dialog, local writes, and HTML data escaping.
- [x] `npm audit` over the complete current dependency tree reports zero advisories.
- [ ] Windows code signing and publisher identity are not configured.
- [ ] Windows IPC/provider review and install/uninstall validation remain required on an actual Windows host.
- [ ] Release artifact malware scanning and a Windows security review remain required before distribution.

Do not run the application elevated unless a documented future sensor provider specifically requires it. No elevated provider integration is included in this build.
