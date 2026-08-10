import { describe, expect, it } from 'vitest';
import { createKeyStat } from './types';
import { recordAttempt } from './recordAttempt';

describe('recordAttempt', () => {
  it('increments attempts and correct on a correct attempt', () => {
    const result = recordAttempt(createKeyStat('a', 'L5'), true, 120);
    expect(result.attempts).toBe(1);
    expect(result.correct).toBe(1);
    expect(result.totalLatencyMs).toBe(120);
    expect(result.recentResults).toEqual([true]);
  });

  it('increments attempts but not correct on a wrong attempt', () => {
    const result = recordAttempt(createKeyStat('a', 'L5'), false, 200);
    expect(result.attempts).toBe(1);
    expect(result.correct).toBe(0);
    expect(result.recentResults).toEqual([false]);
  });

  it('accumulates latency across attempts', () => {
    let stat = createKeyStat('a', 'L5');
    stat = recordAttempt(stat, true, 100);
    stat = recordAttempt(stat, true, 150);
    expect(stat.attempts).toBe(2);
    expect(stat.totalLatencyMs).toBe(250);
  });

  it('does not mutate the input KeyStat', () => {
    const original = createKeyStat('a', 'L5');
    recordAttempt(original, true, 100);
    expect(original.attempts).toBe(0);
    expect(original.recentResults).toEqual([]);
  });

  it('caps recentResults at the last 30 entries', () => {
    let stat = createKeyStat('a', 'L5');
    for (let i = 0; i < 35; i++) {
      stat = recordAttempt(stat, i % 2 === 0, 100);
    }
    expect(stat.attempts).toBe(35);
    expect(stat.recentResults).toHaveLength(30);
    // The oldest 5 results (i=0..4) should have rolled off; the ring buffer
    // should now start at the result for i=5, which is odd -> false.
    expect(stat.recentResults[0]).toBe(false);
  });
});
