# Changelog

## 0.1.0 — Initial implementation

- Electron 45 / React / TypeScript desktop shell with sandboxed renderer, context isolation, restrictive CSP, typed invoke-only preload API and local-only navigation.
- Host-backed CPU, memory, filesystem, network, process and OS readings via `systeminformation`; each metric retains source/status metadata and unsupported sensors remain N/A.
- Bounded SQLite history, saved preferences, alert rules/events, threshold-duration evaluation, hysteresis/cooldown and monitoring control.
- Performance overview, history charts, process explorer, alerts, diagnostics/reports, settings, and labeled status pages for unintegrated gaming/AI features.
- Local JSON/CSV/HTML report export; reduced current hardware snapshot in JSON/HTML omits host name and executable paths.
- Windows NSIS/portable metadata and generated PNG/ICO app icons. Windows targets remain unbuilt/unverified on this Linux Sandbox.
- Optimized collection by coalescing overlapping snapshot requests, using a slower process-list cache, avoiding duplicate polling, and disabling animations on frequently refreshed data traces.
- Security refresh to Electron 45, Electron Builder 26.15, Vite 8, Vitest 5 and better-sqlite3 13.0.3; complete dependency audit returns zero advisories.
- Strict type checking, ESLint, seven metric/alert tests, production compilation, live Sandbox metric collection, Electron/Xvfb startup and SQLite history smoke checks passed.
- Linux/Xvfb resource sample recorded with limitations in `docs/TESTING.md`. Windows sensors, package, process behavior, notifications and resource performance remain to be tested on Windows.
