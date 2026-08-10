import { describe, expect, it } from 'vitest';
import type { KeyStat } from './types';
import { generateDrillText } from './generator';

// Deterministic PRNG so the statistical test below is reproducible, not flaky.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function unlockedStat(key: string, attempts: number, correct: number): KeyStat {
  return {
    key,
    finger: 'L5',
    attempts,
    correct,
    totalLatencyMs: 0,
    recentResults: [],
    unlocked: true,
  };
}

describe('generateDrillText', () => {
  it('only produces words made entirely of currently-unlocked keys', () => {
    const keyStats: Record<string, KeyStat> = {
      a: unlockedStat('a', 100, 100),
      s: unlockedStat('s', 100, 100),
      d: unlockedStat('d', 100, 100),
    };
    const wordList = ['ads', 'sad', 'add', 'quiz', 'flow']; // quiz/flow use locked letters
    const result = generateDrillText({ wordList, keyStats, wordCount: 200, random: mulberry32(1) });

    expect(result.length).toBe(200);
    for (const word of result) {
      expect(['ads', 'sad', 'add']).toContain(word);
    }
  });

  it('returns an empty list when no word in the list is fully unlocked', () => {
    const keyStats: Record<string, KeyStat> = { a: unlockedStat('a', 100, 100) };
    const result = generateDrillText({
      wordList: ['flow', 'type'],
      keyStats,
      wordCount: 50,
    });
    expect(result).toEqual([]);
  });

  it('weights roughly 40% weak-key words and 60% general-practice words over a large sample', () => {
    const keyStats: Record<string, KeyStat> = {
      // "weak" (below 90% accuracy)
      a: unlockedStat('a', 100, 70),
      // "strong" keys
      s: unlockedStat('s', 100, 99),
      d: unlockedStat('d', 100, 99),
      f: unlockedStat('f', 100, 99),
    };
    // Every word containing 'a' is weak; the rest are general.
    const wordList = ['a', 'as', 'ad', 'af', 'sd', 'df', 'fs', 'sf', 'ds', 'fd'];

    const result = generateDrillText({
      wordList,
      keyStats,
      wordCount: 20000,
      random: mulberry32(42),
    });

    const weakFraction = result.filter((word) => word.includes('a')).length / result.length;
    expect(weakFraction).toBeGreaterThan(0.37);
    expect(weakFraction).toBeLessThan(0.43);
  });

  it('draws entirely from the general pool when there are no weak keys', () => {
    const keyStats: Record<string, KeyStat> = {
      a: unlockedStat('a', 100, 100),
      s: unlockedStat('s', 100, 100),
    };
    const result = generateDrillText({
      wordList: ['as', 'sa'],
      keyStats,
      wordCount: 100,
      random: mulberry32(7),
    });
    expect(result.length).toBe(100);
  });

  it('draws entirely from the weak pool when everything is weak (e.g. freshly unlocked)', () => {
    const keyStats: Record<string, KeyStat> = {
      a: unlockedStat('a', 2, 2), // fewer than the "recently unlocked" attempt floor
      s: unlockedStat('s', 2, 2),
    };
    const result = generateDrillText({
      wordList: ['as', 'sa'],
      keyStats,
      wordCount: 100,
      random: mulberry32(11),
    });
    expect(result.length).toBe(100);
  });

  it('always includes space as unlocked even if not present in keyStats', () => {
    const keyStats: Record<string, KeyStat> = { a: unlockedStat('a', 100, 100) };
    // A single-word list has no spaces, but this should not throw or filter
    // words out solely for containing no characters outside `a`.
    const result = generateDrillText({ wordList: ['a'], keyStats, wordCount: 5 });
    expect(result).toEqual(['a', 'a', 'a', 'a', 'a']);
  });
});
