export type MetricStatus = 'valid' | 'unsupported' | 'unavailable' | 'stale';
export interface Metric<T = number> { value: T | null; unit: string; source: string; timestamp: number; status: MetricStatus; note?: string }
export interface CpuData { model: Metric<string>; usage: Metric<number>; cores: number; physicalCores: number; perCore: number[]; speed: Metric<number>; temperature: Metric<number> }
export interface MemoryData { total: Metric<number>; used: Metric<number>; available: Metric<number>; percent: Metric<number>; committed: Metric<number> }
export interface GpuData { name: Metric<string>; utilization: Metric<number>; memoryUsed: Metric<number>; memoryTotal: Metric<number>; temperature: Metric<number>; power: Metric<number>; vendor: string }
export interface DiskData { mount: string; name: string; used: Metric<number>; total: Metric<number>; percent: Metric<number>; read: Metric<number>; write: Metric<number> }
export interface ProcessRow { pid: number; name: string; cpu: number; memory: number; path: string | null }
export interface SystemData { hostname: string; os: string; uptime: number; platform: string; collectedAt: number }
export interface Snapshot { cpu: CpuData; memory: MemoryData; gpu: GpuData[]; disks: DiskData[]; processes: ProcessRow[]; system: SystemData; network: { rx: Metric<number>; tx: Metric<number> }; sourceInfo: { platform: string; provider: string; warnings: string[] } }
export interface HistoryPoint { timestamp: number; cpu: number | null; memory: number | null; gpu: number | null }
export interface AlertRule { id: string; metric: 'cpu' | 'memory' | 'gpu' | 'disk'; level: 'warning' | 'critical'; threshold: number; duration: number; enabled: boolean }
export interface AlertEvent { id: number; ruleId: string; metric: string; level: string; value: number; message: string; timestamp: number }
export type ThemeName = 'cyberpunk' | 'professional' | 'holographic';
export interface AppSettings { theme: ThemeName; accent: string; refreshSeconds: number; retentionDays: number; reducedMotion: boolean; density: 'comfortable' | 'compact'; monitoring: boolean }
export interface TitanApi { getSnapshot(): Promise<Snapshot>; getHistory(range: string): Promise<HistoryPoint[]>; getProcesses(): Promise<ProcessRow[]>; getSettings(): Promise<AppSettings>; saveSettings(settings: AppSettings): Promise<AppSettings>; getAlerts(): Promise<AlertEvent[]>; getAlertRules(): Promise<AlertRule[]>; saveAlertRules(rules: AlertRule[]): Promise<AlertRule[]>; testNotification(): Promise<boolean>; exportReport(format: 'json' | 'csv' | 'html'): Promise<{ ok: boolean; path?: string }>; openProcessLocation(pid: number): Promise<{ ok: boolean; error?: string }>; terminateProcess(pid: number): Promise<{ ok: boolean; error?: string }>; appVersion(): Promise<string>; setMonitoring(enabled: boolean): Promise<boolean> }
declare global { interface Window { titan: TitanApi } }
