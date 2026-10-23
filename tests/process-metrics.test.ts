import { describe, expect, it } from 'vitest';
import { normalizeProcessRow } from '../src/main/collectors/system';
import { formatBytes, formatPercent } from '../src/shared/process-format';

describe('Windows process metrics', () => {
  it('uses the provider cpu field and converts resident KiB to bytes', () => {
    const row = normalizeProcessRow({
      pid: 123,
      name: 'sample.exe',
      cpu: 7.25,
      pcpu: 0,
      memRss: 604 * 1024,
      path: null,
    });
    expect(row.cpu).toBe(7.25);
    expect(row.memory).toBe(604 * 1024 * 1024);
  });

  it('keeps malformed process metrics from becoming negative or non-finite', () => {
    const row = normalizeProcessRow({ pid: 1, name: 'sample.exe', cpu: Number.NaN, memRss: -1 });
    expect(row.cpu).toBe(0);
    expect(row.memory).toBe(0);
  });
});

describe('process metric formatting', () => {
  it('labels 604 MiB as MB rather than an impossible TB value', () => {
    expect(formatBytes(604 * 1024 * 1024)).toBe('604.0 MB');
  });

  it('formats small CPU activity to two decimal places', () => {
    expect(formatPercent(0.37)).toBe('0.37%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('does not hide tiny positive activity as zero', () => {
    expect(formatPercent(0.004)).toBe('<0.01%');
  });
});
