import { describe, expect, it } from 'vitest';
import { getFingerForKey } from './fingerMap';
import { LAYOUT_CODE_TO_CHAR } from './layoutData';
import type { KeyboardLayout } from './types';
import type { FingerId } from '../types';

const ALL_FINGERS: FingerId[] = ['L5', 'L4', 'L3', 'L2', 'R2', 'R3', 'R4', 'R5', 'thumb'];
const ALL_LAYOUTS: KeyboardLayout[] = ['qwerty', 'dvorak', 'colemak', 'qwertz', 'azerty'];

describe('getFingerForKey: structural coverage', () => {
  it.each(ALL_LAYOUTS)('assigns a valid FingerId to every mapped character in %s', (layout) => {
    const chars = Object.values(LAYOUT_CODE_TO_CHAR[layout]);
    expect(chars.length).toBeGreaterThan(0);
    for (const char of chars) {
      const finger = getFingerForKey(char, layout);
      expect(ALL_FINGERS, `finger for ${JSON.stringify(char)} in ${layout}`).toContain(finger);
    }
  });

  it('returns undefined for a key with no finger assignment', () => {
    expect(getFingerForKey('Enter', 'qwerty')).toBeUndefined();
  });

  it('looks up letters case-insensitively', () => {
    expect(getFingerForKey('A', 'qwerty')).toBe(getFingerForKey('a', 'qwerty'));
  });
});

describe('getFingerForKey: QWERTY', () => {
  it('assigns the home row by column', () => {
    expect(getFingerForKey('a', 'qwerty')).toBe('L5');
    expect(getFingerForKey('s', 'qwerty')).toBe('L4');
    expect(getFingerForKey('d', 'qwerty')).toBe('L3');
    expect(getFingerForKey('f', 'qwerty')).toBe('L2');
    expect(getFingerForKey('j', 'qwerty')).toBe('R2');
    expect(getFingerForKey('k', 'qwerty')).toBe('R3');
    expect(getFingerForKey('l', 'qwerty')).toBe('R4');
    expect(getFingerForKey(';', 'qwerty')).toBe('R5');
  });

  it('assigns space to the thumb', () => {
    expect(getFingerForKey(' ', 'qwerty')).toBe('thumb');
  });
});

describe('getFingerForKey: Dvorak', () => {
  it('assigns the Dvorak home row "aoeuidhtns" per the standard chart', () => {
    const expected: Record<string, FingerId> = {
      a: 'L5',
      o: 'L4',
      e: 'L3',
      u: 'L2',
      i: 'L2',
      d: 'R2',
      h: 'R2',
      t: 'R3',
      n: 'R4',
      s: 'R5',
    };
    for (const [char, finger] of Object.entries(expected)) {
      expect(getFingerForKey(char, 'dvorak'), char).toBe(finger);
    }
  });
});

describe('getFingerForKey: Colemak', () => {
  it('keeps the bottom-row editing-shortcut keys on the same fingers as QWERTY', () => {
    for (const char of ['z', 'x', 'c', 'v']) {
      expect(getFingerForKey(char, 'colemak'), char).toBe(getFingerForKey(char, 'qwerty'));
    }
  });

  it('moves the remapped home-row letters to their new physical fingers', () => {
    // Physical K position now types 'e'; physical N position now types 'k'.
    expect(getFingerForKey('e', 'colemak')).toBe('R3');
    expect(getFingerForKey('k', 'colemak')).toBe('R2');
  });
});

describe('getFingerForKey: QWERTZ', () => {
  it('swaps only Y and Z relative to QWERTY', () => {
    expect(getFingerForKey('z', 'qwertz')).toBe('R2');
    expect(getFingerForKey('y', 'qwertz')).toBe('L5');
    expect(getFingerForKey('a', 'qwertz')).toBe(getFingerForKey('a', 'qwerty'));
  });
});

describe('getFingerForKey: AZERTY', () => {
  it('assigns the AZERTY home row "qsdfghjklm"', () => {
    const expected: Record<string, FingerId> = {
      q: 'L5',
      s: 'L4',
      d: 'L3',
      f: 'L2',
      g: 'L2',
      h: 'R2',
      j: 'R2',
      k: 'R3',
      l: 'R4',
      m: 'R5',
    };
    for (const [char, finger] of Object.entries(expected)) {
      expect(getFingerForKey(char, 'azerty'), char).toBe(finger);
    }
  });
});
