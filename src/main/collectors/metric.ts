import type { Metric, MetricStatus } from '../../shared/types';
export function metric<T extends number | string>(value: T | null, unit: string, source: string, status?: MetricStatus, note?: string): Metric<T> {
  const valid = typeof value === 'string' ? value.trim().length > 0 : typeof value === 'number' && Number.isFinite(value) && value >= 0;
  return { value: valid ? value : null, unit, source, timestamp: Date.now(), status: status ?? (valid ? 'valid' : 'unavailable'), ...(note ? { note } : {}) };
}
export function safePercent(value: number): number | null { return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null; }
export function unsupported(unit: string, source: string, note: string): Metric<number> { return { value: null, unit, source, timestamp: Date.now(), status: 'unsupported', note }; }
