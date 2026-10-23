# Testing and resource measurements

## Verified in this task Sandbox

Environment: Linux x86_64, Intel Xeon host, Node 22.13, Electron 45.0.0, and Xvfb virtual display. This is a cloud Sandbox, not the user's Windows PC.

`npm run lint` passes. `npm run typecheck` passes for the renderer/shared and Electron main/preload code. `npm test` passes all seven tests (four metric-validation cases and three alert-duration/hysteresis cases). `npm run build` compiles the 570 KB renderer bundle (about 160.5 KB gzipped) and the Electron main/preload code. `npm audit` reports zero advisories across the full installed dependency tree.

The live collector was called against the host and returned real CPU load/model, memory totals, filesystem, process, and network data. No GPU controller was returned; GPU inventory remained empty. Electron 45 was launched under Xvfb in both Vite development and production-file mode. The production smoke log had no startup/native-module error. SQLite initialization created the database tables, and measured sample-row counts increased while monitoring ran (44 to 51 across a 13-second production smoke session).

## Short resource sample (not a Windows benchmark)

A single `ps` sample was taken about 13 seconds after starting the production Electron build under Xvfb. Seven Electron processes were present. The main process was 170,256 KiB RSS and 7.9% CPU (the process-lifetime average reported by `ps` at that instant). The busiest individual child reported 145,984 KiB RSS and 9.4% CPU. Summing all seven RSS values gives 657.3 MiB, but that **overcounts unique physical memory** because subprocesses share mapped Chromium/Electron pages. Xvfb uses software/virtual display rendering; startup, the short measurement window, and shared pages make these values unsuitable as steady-state native-Windows figures.

This short test does not justify a claim that the application has negligible overhead. Measure it on the target PC after several minutes with hardware acceleration, then compare Task Manager process trees with monitoring on/off and at different refresh intervals. The app caches its process list for at least 10 seconds, avoids duplicate renderer polling, and does not animate data traces on every sample, but further Windows profiling may be warranted.

## Not verified

No NSIS installer or Windows portable artifact was produced. Windows-native notifications, Windows tray behavior, Windows process termination/open-location permissions, Windows startup behavior, GPU telemetry, board sensors, and Windows memory/process counters require actual Windows testing. No anti-cheat, game capture, storage-write benchmark, or AI runtime integration was tested because those features are not included.
