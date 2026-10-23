# Hardware compatibility and metric sources

TITAN reports what the active collector actually returned. Compatibility varies with OS, driver, device, permissions and firmware. Missing support is rendered as `N/A`, `Unsupported`, or `Unavailable`; values are never extrapolated from model names or invented.

| Reading | Current provider | Availability and limitation |
|---|---|---|
| CPU name and core count | systeminformation / host APIs | Supported when returned by host. |
| CPU aggregate and per-core load | systeminformation | Host-specific; sampled at configured interval. |
| CPU clock | systeminformation | N/A if the OS does not expose a usable clock. |
| CPU temperature/package power, voltage, fan sensors | None integrated | Requires a compatible sensor provider; not guaranteed on all boards. |
| RAM total/used/available | systeminformation / OS APIs | Reads host memory counters. |
| GPU adapter identification | systeminformation graphics | Only appears when the host exposes controller inventory. |
| GPU utilization, encoder/decoder, clocks, temperature and power | None integrated | NVML, Windows GPU engine counters or another trusted adapter is needed; current sandbox has no GPU inventory. |
| VRAM capacity/usage | systeminformation graphics when returned | N/A if the driver does not expose it. |
| Filesystem capacity/free space | systeminformation | Volume usage only; it does not diagnose SSD/HDD health. |
| Disk read/write throughput and SMART health | None integrated | Not claimed by this version. |
| Network throughput | systeminformation network stats | N/A if no interface stats are returned. |
| Per-process CPU and resident memory | systeminformation process snapshot | Paths can be permission- or lifetime-limited. Process GPU attribution is not implemented. |
| FPS/frame time, game session capture | None integrated | No game injection or anti-cheat bypass is used. |
| AI runtime tokens/sec/context/latency | None integrated | Such values require runtime APIs; process activity is not treated as inference telemetry. |

The current implementation was exercised in Linux x86_64 Sandbox (Intel Xeon host). This verifies host metrics on that Sandbox only. It does not establish compatibility with a user's Windows PC, motherboard, GPU, drivers or sensors. On a target Windows computer, validate source and timestamp labels against the Performance Monitor and the device's own vendor utilities before relying on a reading.
