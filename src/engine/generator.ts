import type { KeyStat } from './types';

export interface GenerateDrillTextOptions {
  /** Candidate words to draw from, e.g. a loaded content pack. */
  wordList: readonly string[];
  keyStats: Record<string, KeyStat>;
  wordCount: number;
  /** Fraction of output words drawn from the weak-key pool. Requirements doc §3.2. */
  weakKeyWeight?: number;
  /** A key below this accuracy counts as weak. */
  weakAccuracyThreshold?: number;
  /** A key with fewer attempts than this counts as weak ("recently unlocked"). */
  recentlyUnlockedAttempts?: number;
  /** Injectable RNG, defaults to Math.random. */
  random?: () => number;
}

const DEFAULT_WEAK_KEY_WEIGHT = 0.4;
const DEFAULT_WEAK_ACCURACY_THRESHOLD = 0.9;
const DEFAULT_RECENTLY_UNLOCKED_ATTEMPTS = 10;

function isWeakKey(
  keyStat: KeyStat | undefined,
  weakAccuracyThreshold: number,
  recentlyUnlockedAttempts: number,
): boolean {
  if (!keyStat) return true;
  if (keyStat.attempts < recentlyUnlockedAttempts) return true;
  return keyStat.correct / keyStat.attempts < weakAccuracyThreshold;
}

function pickRandom<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pickRandom called with an empty array');
  return item;
}

/**
 * Generates drill text as a list of words, weighting toward weak keys per
 * requirements doc §3.2. A word is only eligible at all if every character
 * in it is a currently-unlocked key; among eligible words, one is "weak" if
 * it contains at least one weak key. If either the weak or general pool
 * comes up empty, the other pool is used for the full sample rather than
 * failing — this only degrades gracefully if the caller's wordList doesn't
 * suit the current unlock state (e.g. no home-row-only words available).
 */
export function generateDrillText(options: GenerateDrillTextOptions): string[] {
  const {
    wordList,
    keyStats,
    wordCount,
    weakKeyWeight = DEFAULT_WEAK_KEY_WEIGHT,
    weakAccuracyThreshold = DEFAULT_WEAK_ACCURACY_THRESHOLD,
    recentlyUnlockedAttempts = DEFAULT_RECENTLY_UNLOCKED_ATTEMPTS,
    random = Math.random,
  } = options;

  const unlockedKeys = new Set<string>();
  for (const [key, stat] of Object.entries(keyStats)) {
    if (stat.unlocked) unlockedKeys.add(key);
  }
  unlockedKeys.add(' ');

  const weakWords: string[] = [];
  const generalWords: string[] = [];

  for (const word of wordList) {
    const chars = [...word.toLowerCase()];
    if (!chars.every((char) => unlockedKeys.has(char))) continue;

    const weak = chars.some((char) =>
      isWeakKey(keyStats[char], weakAccuracyThreshold, recentlyUnlockedAttempts),
    );
    (weak ? weakWords : generalWords).push(word);
  }

  if (weakWords.length === 0 && generalWords.length === 0) return [];

  const result: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const useWeakPool =
      (random() < weakKeyWeight && weakWords.length > 0) || generalWords.length === 0;
    const pool = useWeakPool ? weakWords : generalWords;
    result.push(pickRandom(pool, random));
  }

  return result;
}
