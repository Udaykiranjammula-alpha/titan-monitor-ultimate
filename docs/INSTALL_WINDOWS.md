# Windows installation and local build

This task produced a source project in the Manus Sandbox, not a signed Windows installer. To create and test a Windows installer on a Windows PC:

1. Extract the supplied source archive to a writable folder.
2. Install Node.js 22 or newer. If native dependency installation requests a compiler, install the supported Visual Studio C++ Build Tools.
3. In PowerShell, open the extracted project and run `npm ci`. The postinstall script rebuilds `better-sqlite3` for the bundled Electron 45 ABI.
4. Run `npm run dev` to open the desktop app during development.
5. Run `npm run dist:win` to create NSIS installer and portable targets in `release/`.
6. Test install, launch, monitor/pause, process view, alert notifications, report export, uninstall, and the absence of automatic startup on a representative Windows device. Confirm every hardware metric against a trusted source before relying on it.

The Windows executable is currently unsigned; Windows SmartScreen may display a publisher warning. Code signing, release artifact scanning, and installer/uninstall testing have not been performed. Do not elevate the app to bypass that warning. Missing GPU and sensor readings are expected in this version because dedicated provider integrations have not been completed. See `HARDWARE_COMPATIBILITY.md` and `FEATURE_STATUS.md`.
