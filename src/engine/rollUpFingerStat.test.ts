import { describe, expect, it } from 'vitest';
import { createKeyStat } from './types';
import type { KeyStat } from './types';
import { recordAttempt } from './recordAttempt';
import { rollUpFingerStat } from './rollUpFingerStat';

function withAttempts(key: string, finger: KeyStat['finger'], correctCount: number, wrongCount: number, latencyMs = 100): KeyStat {
  let stat = createKeyStat(key, finger);
  for (let i = 0; i < correctCount; i++) stat = recordAttempt(stat, true, latencyMs);
  for (let i = 0; i < wrongCount; i++) stat = recordAttempt(stat, false, latencyMs);
  return stat;
}

describe('rollUpFingerStat', () => {
  it('returns zeroed-out stats for a finger with no attempts', () => {
    const result = rollUpFingerStat({}, 'L5');
    expect(result).toEqual({ finger: 'L5', xp: 0, level: 1, accuracy: 0, avgLatencyMs: 0 });
  });

  it('rolls up correctly with only one key attempted', () => {
    const keyStats = {
      a: withAttempts('a', 'L5', 8, 2, 100), // 10 attempts, 8 correct
      s: createKeyStat('s', 'L4'), // untouched, different finger anyway
    };
    const result = rollUpFingerStat(keyStats, 'L5');
    expect(result.accuracy).toBeCloseTo(0.8);
    expect(result.avgLatencyMs).toBeCloseTo(100);
    expect(result.xp).toBe(8);
  });

  it('sums across every key owned by the finger, ignoring other fingers', () => {
    const keyStats = {
      a: withAttempts('a', 'L5', 9, 1, 100), // 10 attempts, 9 correct
      q: withAttempts('q', 'L5', 4, 6, 200), // 10 attempts, 4 correct
      s: withAttempts('s', 'L4', 10, 0, 50), // different finger, excluded
    };
    const result = rollUpFingerStat(keyStats, 'L5');
    expect(result.accuracy).toBeCloseTo(13 / 20);
    expect(result.avgLatencyMs).toBeCloseTo((10 * 100 + 10 * 200) / 20);
    expect(result.xp).toBe(13);
  });

  it('treats an untouched key (zero attempts) as contributing nothing', () => {
    const keyStats = { a: createKeyStat('a', 'L5') };
    const result = rollUpFingerStat(keyStats, 'L5');
    expect(result.accuracy).toBe(0);
    expect(result.avgLatencyMs).toBe(0);
    expect(result.xp).toBe(0);
  });

  it('derives a higher level from more XP', () => {
    const low = rollUpFingerStat({ a: withAttempts('a', 'L5', 10, 0) }, 'L5');
    const high = rollUpFingerStat({ a: withAttempts('a', 'L5', 500, 0) }, 'L5');
    expect(high.level).toBeGreaterThan(low.level);
    expect(low.level).toBeGreaterThanOrEqual(1);
    expect(high.level).toBeLessThanOrEqual(10);
  });

  it('never exceeds the max level of 10', () => {
    const result = rollUpFingerStat({ a: withAttempts('a', 'L5', 100000, 0) }, 'L5');
    expect(result.level).toBe(10);
  });
});
