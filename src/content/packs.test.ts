import { describe, expect, it } from 'vitest';
import { generateDrillText } from '../engine';
import type { KeyStat } from '../engine';
import { ALL_PACKS, common1k, common5k, homeRow } from './index';
import type { WordPack } from './types';

// Reads every pack file straight off disk via Vite's glob, independent of
// ALL_PACKS — this is what actually fails the build if a new pack file is
// dropped in without a header, per PHASE_1_TASKS.md task 5.
const packModules = import.meta.glob<{ default: WordPack }>('./packs/*.json', { eager: true });
const packEntries: [string, { default: WordPack }][] = Object.entries(packModules);

describe('every content pack file on disk has a complete attribution header', () => {
  it('found at least one pack file to check', () => {
    expect(packEntries.length).toBeGreaterThan(0);
  });

  it.each(packEntries)(
    '%s has source, license, attribution, retrievedAt, and words',
    (_path: string, mod: { default: WordPack }) => {
      const pack = mod.default;
      expect(pack.source).toMatch(/\S/);
      expect(pack.license).toMatch(/\S/);
      expect(pack.attribution).toMatch(/\S/);
      expect(pack.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(Array.isArray(pack.words)).toBe(true);
      expect(pack.words.length).toBeGreaterThan(0);
    },
  );

  it('ALL_PACKS has one entry per file found on disk', () => {
    expect(ALL_PACKS).toHaveLength(packEntries.length);
  });
});

describe('common-1k / common-5k', () => {
  it('contain only lowercase, punctuation-free words', () => {
    for (const word of common1k.words) expect(word).toMatch(/^[a-z]+$/);
    for (const word of common5k.words) expect(word).toMatch(/^[a-z]+$/);
  });

  it('common-1k is the frequency-ordered prefix of common-5k', () => {
    expect(common1k.words).toEqual(common5k.words.slice(0, common1k.words.length));
  });
});

describe('packs are loadable by engine/generator.ts', () => {
  it('feeds common-1k straight into generateDrillText', () => {
    const keyStats: Record<string, KeyStat> = {};
    for (const char of new Set(common1k.words.join(''))) {
      keyStats[char] = {
        key: char,
        finger: 'L5',
        attempts: 100,
        correct: 99,
        totalLatencyMs: 0,
        recentResults: [],
        unlocked: true,
      };
    }

    const result = generateDrillText({ wordList: common1k.words, keyStats, wordCount: 30 });
    expect(result).toHaveLength(30);
    for (const word of result) expect(common1k.words).toContain(word);
  });

  it('feeds home-row straight into generateDrillText once home-row keys are unlocked', () => {
    const keyStats: Record<string, KeyStat> = {};
    for (const char of ['a', 's', 'd', 'f', 'j', 'k', 'l']) {
      keyStats[char] = {
        key: char,
        finger: 'L5',
        attempts: 100,
        correct: 99,
        totalLatencyMs: 0,
        recentResults: [],
        unlocked: true,
      };
    }

    const result = generateDrillText({ wordList: homeRow.words, keyStats, wordCount: 20 });
    expect(result).toHaveLength(20);
    for (const word of result) expect(homeRow.words).toContain(word);
  });
});

describe('home-row', () => {
  const HOME_ROW_LETTERS = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l']);

  it('restricts every word to home-row letters only', () => {
    expect(homeRow.words.length).toBeGreaterThan(0);
    for (const word of homeRow.words) {
      for (const char of word) {
        expect(HOME_ROW_LETTERS.has(char), `"${word}" contains "${char}"`).toBe(true);
      }
    }
  });
});
