import type { FingerId } from '../types';
import type { FingerStat, KeyStat } from './types';

/**
 * XP required to reach each level (1-indexed: LEVEL_THRESHOLDS[0] is the XP
 * floor for level 1). XP is a finger's total *correct* keystrokes, so it's
 * already both a volume and an accuracy signal — typing inaccurately yields
 * fewer correct reps for the same practice time, without needing a second
 * accuracy multiplier layered on top.
 */
const LEVEL_THRESHOLDS = [0, 50, 100, 175, 275, 400, 600, 900, 1300, 1850];
const MAX_LEVEL = LEVEL_THRESHOLDS.length;

function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (threshold !== undefined && xp >= threshold) level = i + 1;
  }
  return Math.min(level, MAX_LEVEL);
}

/**
 * Rolls up every KeyStat owned by `finger` into a FingerStat. Keys with zero
 * attempts (untouched, or belonging to another finger) contribute zero to
 * every sum, so a finger with only one key attempted still rolls up
 * correctly.
 */
export function rollUpFingerStat(keyStats: Record<string, KeyStat>, finger: FingerId): FingerStat {
  let attempts = 0;
  let correct = 0;
  let totalLatencyMs = 0;

  for (const keyStat of Object.values(keyStats)) {
    if (keyStat.finger !== finger) continue;
    attempts += keyStat.attempts;
    correct += keyStat.correct;
    totalLatencyMs += keyStat.totalLatencyMs;
  }

  const xp = correct;

  return {
    finger,
    xp,
    level: levelFromXp(xp),
    accuracy: attempts > 0 ? correct / attempts : 0,
    avgLatencyMs: attempts > 0 ? totalLatencyMs / attempts : 0,
  };
}
