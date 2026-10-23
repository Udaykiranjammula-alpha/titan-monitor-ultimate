# Architecture

The application separates collection, persistence, process/control operations, and rendering. The Electron main process owns OS collectors and SQLite and periodically emits snapshots. The React renderer receives structured, timestamped metrics only through the context-isolated preload API. The preload exposes named invoke methods rather than raw IPC or Node primitives.

```text
systeminformation / OS APIs
            ↓
  main/collectors/system.ts ──→ alert evaluator ──→ Electron notifications
            ↓                         ↓
           main/database/store.ts (SQLite WAL)
            ↓                         ↓
     typed invoke IPC ←── secure preload bridge ←── React UI
```

`src/shared/types.ts` contains the IPC data contract. A metric has its value, unit, source, timestamp, status, and an optional explanation. A null metric means no reading was returned; there are no random or demo readings in the production collector. `unsupported` describes a provider/OS limitation, while `unavailable` covers absent data.

The SQLite database resides in Electron `userData` and holds bounded time-series samples, validated preferences, user-configurable alert rules, and recent alert events. Samples are indexed by timestamp and old rows are pruned based on retention preferences. Process paths are available only for the process view; they are excluded from report payloads.

The main process uses context isolation and Electron's sandboxed preload. Renderer Node integration is disabled. IPC handlers are limited to collector queries, preference/rule persistence, process actions with guards, test notifications, version reporting, monitoring control, and user-selected report export. External windows and arbitrary navigation are denied. The renderer CSP prohibits remote origins.

`systeminformation` supplies currently implemented host metrics. Specialized GPU/sensor providers are deliberately not guessed. The Windows-target build is configured in Electron Builder, but this project has not been run on Windows; Windows-specific provider adapters and package verification are listed as incomplete in `FEATURE_STATUS.md`.
