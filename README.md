# TITAN Monitor Ultimate

A local-first Electron desktop monitor built with React, TypeScript, SQLite, and host-backed metrics. It does not include analytics, advertising, remote telemetry, or a report upload flow.

## Environment and Windows status

This project was built and smoke-tested in the task’s **Linux x86_64 Sandbox** using Electron 45.0.0. The Sandbox host returned real CPU, memory, filesystem, process, and network measurements. It exposed no GPU controller. Metrics without a supported provider are shown as unavailable; no sample or random values are presented as live.

The project contains Windows NSIS-installer and portable targets, but a **Windows package was not built or verified** in this Linux environment. Windows notification delivery, Windows sensors, GPU telemetry providers, close-to-tray behavior, process actions, and driver-specific readings need validation on an actual Windows PC. See `FEATURE_STATUS.md` and `docs/HARDWARE_COMPATIBILITY.md` for exact boundaries.

## Requirements and launch

Use Node.js 22 or newer and npm. From the project folder:

```bash
npm ci
npm run dev
```

`npm ci` installs dependencies and rebuilds `better-sqlite3` for the bundled Electron ABI. On Windows, native module rebuilds may require the supported Visual Studio C++ Build Tools if a compatible prebuilt is not available. `npm run dev` builds the Electron main/preload files, starts the local Vite development server, and opens Electron. It is a single-command development launch.

To produce a Windows installer/portable build **on Windows**:

```powershell
npm ci
npm run dist:win
```

Outputs go to `release/`. Installer signing is not configured. The Linux Sandbox cannot certify the Windows native SQLite binary, installer, or hardware providers.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Last verified in the Sandbox: lint passes; strict TypeScript checks pass; 7 unit tests pass; renderer and Electron main build pass; full dependency audit reports 0 vulnerabilities. Electron 45 opened under Xvfb, and SQLite tables plus real host history samples were created. See `docs/TESTING.md` for the environment, smoke checks, and resource-measurement caveats.

## Architecture and privacy

- `src/main/`: Electron main process, systeminformation collector, alert evaluation and SQLite persistence.
- `src/preload/`: typed invoke-only bridge with context isolation.
- `src/renderer/`: React UI for overview, process explorer, history/performance, alerts, CPU benchmark, reports, gaming/AI status, and settings.
- `src/shared/`: IPC data contracts. Metrics carry values, units, source, timestamp, and availability status.
- `tests/`: metric validation and alert-duration/hysteresis tests.

Renderer Node integration is disabled; the renderer is sandboxed and receives only allowlisted IPC functions. Windows process termination requires UI confirmation and main-process guards. History and settings remain in a local SQLite database under Electron `userData`; exports are local Save-dialog writes. Diagnostic JSON/HTML includes a reduced hardware snapshot but excludes the host name and executable paths. Review exports before sharing. See [Windows setup](docs/INSTALL_WINDOWS.md), [Privacy](docs/PRIVACY.md), [Security](docs/SECURITY.md), [Architecture](docs/ARCHITECTURE.md), [hardware compatibility](docs/HARDWARE_COMPATIBILITY.md), and [testing results](docs/TESTING.md).

## Known limits

CPU temperature/power/fan/voltage, GPU utilization/thermals/power, per-process GPU attribution, disk throughput/SMART, FPS/frame time, start-with-Windows, storage benchmarking, and AI runtime tokens/sec are not implemented or not available through the Sandbox provider. Disk capacity does not establish drive health. There is no PDF export or in-app database deletion control. Do not run the app elevated unless a future documented sensor provider requires it.
