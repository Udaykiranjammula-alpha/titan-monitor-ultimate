import { DatabaseSync } from 'node:sqlite';
import { app } from 'electron';
import path from 'node:path';
import type { AlertEvent, AlertRule, AppSettings, HistoryPoint } from '../../shared/types';

const defaults: AppSettings = {
  theme: 'cyberpunk', accent: '#53d9fa', refreshSeconds: 2, retentionDays: 7,
  reducedMotion: false, density: 'comfortable', monitoring: true,
};

const defaultRules: AlertRule[] = [
  { id: 'cpu-warning', metric: 'cpu', level: 'warning', threshold: 80, duration: 10, enabled: true },
  { id: 'cpu-critical', metric: 'cpu', level: 'critical', threshold: 95, duration: 5, enabled: true },
  { id: 'memory-warning', metric: 'memory', level: 'warning', threshold: 85, duration: 10, enabled: true },
  { id: 'gpu-warning', metric: 'gpu', level: 'warning', threshold: 90, duration: 10, enabled: false },
  { id: 'disk-warning', metric: 'disk', level: 'warning', threshold: 90, duration: 0, enabled: true },
];

let db: DatabaseSync;

function inTransaction<T>(operation: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = operation();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function initializeStore(): DatabaseSync {
  if (db) return db;
  const file = path.join(app.getPath('userData'), 'titan-monitor.sqlite');
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS samples (
      timestamp INTEGER PRIMARY KEY, cpu REAL, memory REAL, gpu REAL
    );
    CREATE INDEX IF NOT EXISTS idx_samples_timestamp ON samples(timestamp);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY, metric TEXT, level TEXT, threshold REAL, duration INTEGER, enabled INTEGER
    );
    CREATE TABLE IF NOT EXISTS alert_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ruleId TEXT, metric TEXT, level TEXT,
      value REAL, message TEXT, timestamp INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_alert_events_timestamp ON alert_events(timestamp);
  `);
  if (!getSettingRaw()) saveSettings(defaults);
  const ruleCount = db.prepare('SELECT COUNT(*) AS n FROM alert_rules').get() as { n: number };
  if (ruleCount.n === 0) saveAlertRules(defaultRules);
  return db;
}

function getSettingRaw(): { value: string } | undefined {
  return db.prepare("SELECT value FROM settings WHERE key='app'").get() as { value: string } | undefined;
}

export function saveSettings(settings: AppSettings): AppSettings {
  const clean: AppSettings = {
    theme: ['cyberpunk', 'professional', 'holographic'].includes(settings.theme) ? settings.theme : defaults.theme,
    accent: /^#[0-9a-fA-F]{6}$/.test(settings.accent) ? settings.accent : defaults.accent,
    refreshSeconds: Math.min(10, Math.max(1, Number(settings.refreshSeconds) || 2)),
    retentionDays: Math.min(365, Math.max(1, Number(settings.retentionDays) || 7)),
    reducedMotion: Boolean(settings.reducedMotion),
    density: settings.density === 'compact' ? 'compact' : 'comfortable',
    monitoring: Boolean(settings.monitoring),
  };
  db.prepare("INSERT INTO settings(key,value) VALUES('app',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
    .run(JSON.stringify(clean));
  return clean;
}

export function loadSettings(): AppSettings {
  const row = getSettingRaw();
  if (!row) return defaults;
  try {
    return saveSettings(JSON.parse(row.value) as AppSettings);
  } catch {
    return saveSettings(defaults);
  }
}

export function saveSnapshot(point: HistoryPoint): void {
  db.prepare('INSERT OR REPLACE INTO samples(timestamp,cpu,memory,gpu) VALUES(?,?,?,?)')
    .run(point.timestamp, point.cpu, point.memory, point.gpu);
  db.prepare('DELETE FROM samples WHERE timestamp < ?')
    .run(Date.now() - loadSettings().retentionDays * 86400000);
}

export function getHistory(range: string): HistoryPoint[] {
  const spans: Record<string, number> = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '24h': 86400000 };
  const from = Date.now() - (spans[range] ?? 60000);
  return db.prepare('SELECT timestamp,cpu,memory,gpu FROM samples WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT 5000')
    .all(from) as unknown as HistoryPoint[];
}

export function saveAlertRules(rules: AlertRule[]): AlertRule[] {
  inTransaction(() => {
    db.prepare('DELETE FROM alert_rules').run();
    const insert = db.prepare('INSERT INTO alert_rules VALUES(?,?,?,?,?,?)');
    for (const item of Array.isArray(rules) ? rules : []) {
      if (!item || typeof item !== 'object') continue;
      const rule = item as AlertRule;
      if (typeof rule.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(rule.id)
        || !['cpu', 'memory', 'gpu', 'disk'].includes(rule.metric)
        || !['warning', 'critical'].includes(rule.level)
        || !Number.isFinite(rule.threshold) || !Number.isFinite(rule.duration)) continue;
      insert.run(rule.id, rule.metric, rule.level, Math.max(1, Math.min(100, rule.threshold)),
        Math.max(0, Math.min(3600, rule.duration)), rule.enabled ? 1 : 0);
    }
  });
  return getAlertRules();
}

export function getAlertRules(): AlertRule[] {
  return db.prepare('SELECT id,metric,level,threshold,duration,enabled FROM alert_rules ORDER BY metric,level')
    .all().map((row: any) => ({ ...row, enabled: Boolean(row.enabled) })) as AlertRule[];
}

export function addAlert(event: Omit<AlertEvent, 'id'>): AlertEvent {
  const result = db.prepare('INSERT INTO alert_events(ruleId,metric,level,value,message,timestamp) VALUES(?,?,?,?,?,?)')
    .run(event.ruleId, event.metric, event.level, event.value, event.message, event.timestamp);
  db.prepare('DELETE FROM alert_events WHERE id NOT IN (SELECT id FROM alert_events ORDER BY timestamp DESC LIMIT 500)').run();
  return { ...event, id: Number(result.lastInsertRowid) };
}

export function getAlerts(): AlertEvent[] {
  return db.prepare('SELECT * FROM alert_events ORDER BY timestamp DESC LIMIT 100').all() as unknown as AlertEvent[];
}

export function exportRows() {
  return {
    settings: loadSettings(),
    history: db.prepare('SELECT * FROM samples ORDER BY timestamp ASC LIMIT 50000').all(),
    alerts: getAlerts(),
  };
}
