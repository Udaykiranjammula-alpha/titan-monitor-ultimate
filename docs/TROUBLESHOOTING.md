# Troubleshooting

- **Blank dashboard:** ensure dependencies are installed, `npm run build` succeeds, and Electron loads `dist/renderer/index.html`.
- **Sensor says Unsupported:** the current OS/driver/provider did not report that value. It is intentionally not estimated. Run on the target Windows device and install only a trusted compatible sensor provider if needed.
- **GPU model missing:** update the graphics driver and confirm the host OS can enumerate adapters. GPU utilization, thermals and power remain unavailable unless an approved telemetry integration exists.
- **Process path unavailable:** OS permission, process lifetime, or access restrictions can hide executable paths.
- **Windows build from Linux fails:** native SQLite packaging and/or Wine can constrain cross-target builds. Build on Windows (or a configured Windows CI runner) and run `npm run dist:win` there.
- **Database issue:** close the app cleanly; the SQLite database lives in Electron's userData directory as `titan-monitor.sqlite`.
- **Alerts:** thresholds are user-controlled, need sustained readings for the configured duration, and include a cooldown. Missing readings do not trigger an alert.
