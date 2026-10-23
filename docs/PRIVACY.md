# Privacy

TITAN Monitor Ultimate is local-first and contains no analytics, advertising SDK, remote API client, or report-upload flow. Collection occurs in the Electron main process through host APIs. Disabling monitoring stops periodic collection; explicitly requesting a refresh still obtains a one-shot sample. Renderer network access is restricted to local packaged content and the local Vite development server.

The app stores performance history, preferences, alert rules, and alert events in a SQLite file under Electron's `userData` directory. The process explorer can display executable paths if the OS returns them, but export payloads omit these paths. CSV contains metric history. JSON includes preferences, history, alert records, and a reduced current hardware snapshot. HTML renders the same report locally. Diagnostic exports omit the host name, executable paths, and volume mount paths. The app asks the user for a local Save path and does not transmit the file.

Review generated reports before sharing. No in-app database deletion control is available; after closing TITAN, deleting the app's `userData` directory removes history and preferences. No hidden background service or start-with-Windows behavior is installed. The app has no automatic startup hook.
