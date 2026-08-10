import { describe, expect, it } from 'vitest';
import type { KeyStat } from './types';
import { getNextUnlock, HOME_ROW_KEYS, UNLOCK_GROUPS } from './unlock';

function groupAt(index: number): readonly string[] {
  const group = UNLOCK_GROUPS[index];
  if (!group) throw new Error(`no unlock group at index ${index}`);
  return group;
}

function unlockedStat(key: string, attempts: number, correct: number): KeyStat {
  return {
    key,
    finger: 'L5',
    attempts,
    correct,
    totalLatencyMs: attempts * 100,
    recentResults: [],
    unlocked: true,
  };
}

/** Every home-row key at exactly the given attempts/correct. */
function homeRowAt(attempts: number, correct: number): Record<string, KeyStat> {
  const keyStats: Record<string, KeyStat> = {};
  for (const key of HOME_ROW_KEYS) keyStats[key] = unlockedStat(key, attempts, correct);
  return keyStats;
}

describe('getNextUnlock', () => {
  it('returns null when nothing is unlocked yet', () => {
    expect(getNextUnlock({})).toBeNull();
  });

  it('returns null when any unlocked key is below the occurrence minimum, even at 100% accuracy', () => {
    const keyStats = homeRowAt(49, 49); // 100% accuracy, but only 49 occurrences
    expect(getNextUnlock(keyStats)).toBeNull();
  });

  it('returns null when occurrences are sufficient but accuracy is just under threshold', () => {
    const keyStats = homeRowAt(100, 94); // 94% accuracy, 100 occurrences
    expect(getNextUnlock(keyStats)).toBeNull();
  });

  it('unlocks the next group at exactly the 95%/50-occurrence threshold', () => {
    const keyStats = homeRowAt(100, 95); // exactly 95%, well past the occurrence minimum
    expect(getNextUnlock(keyStats)).toEqual(groupAt(1)); // e i r u
  });

  it('unlocks at exactly 50 occurrences with accuracy exactly at threshold', () => {
    // 50 attempts * 0.95 = 47.5, so 48/50 is the smallest integer count clearing 95% at the minimum occurrence count.
    const keyStats = homeRowAt(50, 48);
    expect(getNextUnlock(keyStats)).toEqual(groupAt(1));
  });

  it('stays null if even one currently-unlocked key is short, regardless of the rest', () => {
    const keyStats = homeRowAt(100, 100); // every home-row key perfect...
    keyStats['a'] = unlockedStat('a', 100, 80); // ...except this one
    expect(getNextUnlock(keyStats)).toBeNull();
  });

  it('progresses to the group after next once the newly-unlocked group also clears threshold', () => {
    const keyStats = homeRowAt(100, 100);
    for (const key of groupAt(1)) {
      keyStats[key] = unlockedStat(key, 100, 100);
    }
    expect(getNextUnlock(keyStats)).toEqual(groupAt(2)); // t y o n
  });

  it('returns null once every group is unlocked and mastered', () => {
    const keyStats: Record<string, KeyStat> = {};
    for (const group of UNLOCK_GROUPS) {
      for (const key of group) keyStats[key] = unlockedStat(key, 100, 100);
    }
    expect(getNextUnlock(keyStats)).toBeNull();
  });
});
