import type { KeyStat } from './types';

export const HOME_ROW_KEYS: readonly string[] = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

/** Unlock order, requirements doc §3.2. Each group unlocks together once
 * every currently-unlocked key clears the threshold below. */
export const UNLOCK_GROUPS: readonly (readonly string[])[] = [
  HOME_ROW_KEYS,
  ['e', 'i', 'r', 'u'],
  ['t', 'y', 'o', 'n'],
  ['g', 'h', 'c', 'm'],
  ['w', 'v', 'b', 'p'],
  ['q', 'z', 'x'],
  [',', '.', "'", '!', '?'], // punctuation
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], // numbers
  [
    '`',
    '-',
    '=',
    '[',
    ']',
    '\\',
    '/',
    '~',
    '@',
    '#',
    '$',
    '%',
    '^',
    '&',
    '*',
    '(',
    ')',
    '_',
    '+',
    '{',
    '}',
    '|',
    ':',
    '"',
    '<',
    '>',
  ], // symbols
];

/** Space (thumb) is needed for word breaks in every mode from the start,
 * so it's never gated by the unlock progression above. */
export const ALWAYS_UNLOCKED_KEYS: readonly string[] = [' '];

export const UNLOCK_ACCURACY_THRESHOLD = 0.95;
export const UNLOCK_MIN_OCCURRENCES = 50;

function meetsThreshold(keyStat: KeyStat): boolean {
  return (
    keyStat.attempts >= UNLOCK_MIN_OCCURRENCES &&
    keyStat.correct / keyStat.attempts >= UNLOCK_ACCURACY_THRESHOLD
  );
}

/**
 * Given the current KeyStat state, returns the next group of keys to
 * unlock, or `null` if not ready yet (or everything is already unlocked).
 * Assumes the caller has already seeded HOME_ROW_KEYS as unlocked in the
 * initial Progress — this function only ever progresses *beyond* whatever
 * is currently marked unlocked, it doesn't grant the starting home row.
 */
export function getNextUnlock(keyStats: Record<string, KeyStat>): readonly string[] | null {
  const unlockedStats = Object.values(keyStats).filter((keyStat) => keyStat.unlocked);
  if (unlockedStats.length === 0) return null;

  const allUnlockedMeetThreshold = unlockedStats.every(meetsThreshold);
  if (!allUnlockedMeetThreshold) return null;

  for (const group of UNLOCK_GROUPS) {
    const groupAlreadyUnlocked = group.every((key) => keyStats[key]?.unlocked === true);
    if (!groupAlreadyUnlocked) return group;
  }

  return null;
}
