# Feature status report

Updated 2026-10-23. “Implemented” means present in source and exercised where noted; it does not imply validation on every OS, driver, or device.

| Area | Status | Notes |
|---|---|---|
| Electron/React shell, CSP, context isolation, allowlisted IPC | Implemented | Electron 45.0.0; context-isolated sandboxed renderer; Xvfb startup smoke-tested. |
| CPU model, logical/physical cores, aggregate/per-core load, clock | Partial | Real `systeminformation` host readings. Clock may be N/A. Verified only on the Linux Sandbox host. |
| CPU temperature, package power, fan/voltage sensors | Unavailable | No integrated LibreHardwareMonitor or other board-sensor provider. |
| Memory total, used, available, percentage | Implemented | Returned from host OS APIs. |
| OS commit charge | Unavailable | Not exposed by the current collector; intentionally N/A, not derived from RAM plus swap capacity. |
| GPU model/inventory | Partial | Shown only when the host graphics API returns controllers; the Sandbox returned none. |
| GPU utilization, power, clocks, temperature, process GPU usage | Unavailable | NVML/Windows GPU-counter adapters not integrated. VRAM fields appear only when provider data exists. |
| Storage capacity/free space | Implemented | Host filesystems. Does not report drive health. |
| Storage throughput/SMART health | Unavailable | Not provided by the collector. |
| OS, host name, uptime | Implemented | Host OS APIs. Host name appears in-app; it is omitted from diagnostic exports. |
| Process list, CPU and resident-memory ranking | Partial | Available process details depend on OS permissions. A bounded list is refreshed less often than the core metrics to reduce overhead. No GPU attribution. |
| CPU/RAM/GPU/storage threshold rules, duration, cooldown, event history | Partial | Rule engine, persisted history and test logic implemented. GPU rules do not fire without readings. OS notification delivery needs host verification. |
| History charts, SQLite persistence and retention | Implemented | Configurable time range and retention. Electron smoke testing created the DB and stored real samples. |
| Local JSON/CSV/HTML diagnostics | Implemented | Save dialog, local-only write. JSON/HTML include a reduced current hardware snapshot; host name/process paths are omitted. No PDF. |
| Preferences | Implemented | Theme, accent, refresh interval, retention, density, reduced motion and monitoring saved locally. |
| Tray/minimize-to-tray | Partial | Tray state/menu and Windows close-to-tray path are implemented; actual Windows tray behavior was not tested. |
| Process open location/termination | Partial | Guarded main-process operations and UI confirmation; Windows permissions/behavior remain unverified. |
| CPU/memory synthetic benchmark | Partial | In-app work sample with UI yields; this is not a vendor-grade comparative benchmark. |
| Storage benchmark | Not implemented | No write test until safe temporary-file creation/cleanup is added. |
| Gaming/frame-time/GPU capture | Not implemented | No injection or anti-cheat interaction. |
| AI runtime/inference metrics | Not implemented | No runtime-specific API; generic process usage is not treated as inference telemetry. |
| Start with Windows | Not implemented | No autorun setting or registry/login-item change. |
| Windows installer | Configured, unverified | NSIS and portable targets are in metadata. Build/install/uninstall/signing need a Windows host. |
| Lint, typecheck, tests, production build, dependency audit | Verified | ESLint, strict TypeScript, 7 unit tests, Vite + main build pass; full `npm audit` reports 0 vulnerabilities. |
| Production Electron and SQLite smoke | Verified in Sandbox | Electron 45 opened under Xvfb; SQLite sample rows grew during monitoring. Not a Windows test. |
| Resource use | Measured with caveats | See `docs/TESTING.md`; single short Linux/Xvfb sample is not representative of Windows or a hardware-accelerated desktop. |

No fabricated or random readings are used. Unsupported metrics carry a null value and source/status metadata.
