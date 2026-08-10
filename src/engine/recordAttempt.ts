import type { KeyStat } from './types';

const RECENT_RESULTS_CAPACITY = 30;

/**
 * Returns a new KeyStat reflecting one more attempt at this key. Immutable
 * — never mutates the input, so callers can't accidentally share state
 * across renders/tests.
 */
export function recordAttempt(keyStat: KeyStat, correct: boolean, latencyMs: number): KeyStat {
  const recentResults = [...keyStat.recentResults, correct].slice(-RECENT_RESULTS_CAPACITY);

  return {
    ...keyStat,
    attempts: keyStat.attempts + 1,
    correct: keyStat.correct + (correct ? 1 : 0),
    totalLatencyMs: keyStat.totalLatencyMs + latencyMs,
    recentResults,
  };
}
