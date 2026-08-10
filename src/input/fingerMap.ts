import type { FingerId } from '../types';
import type { KeyboardLayout } from './types';
import { CODE_TO_FINGER, LAYOUT_CODE_TO_CHAR } from './layoutData';

function buildCharToFinger(layout: KeyboardLayout): Map<string, FingerId> {
  const table = new Map<string, FingerId>();
  const codeToChar = LAYOUT_CODE_TO_CHAR[layout];

  for (const [code, char] of Object.entries(codeToChar)) {
    if (char === undefined) continue;
    table.set(char, CODE_TO_FINGER[code as keyof typeof CODE_TO_FINGER]);
  }

  return table;
}

const CHAR_TO_FINGER_BY_LAYOUT: Record<KeyboardLayout, Map<string, FingerId>> = {
  qwerty: buildCharToFinger('qwerty'),
  dvorak: buildCharToFinger('dvorak'),
  colemak: buildCharToFinger('colemak'),
  qwertz: buildCharToFinger('qwertz'),
  azerty: buildCharToFinger('azerty'),
};

/**
 * Which finger types the given character under the given layout. Letters
 * are looked up case-insensitively (fingers don't change with Shift).
 * Returns `undefined` for characters with no assigned finger (e.g. Enter,
 * Shift) — Phase 1 only needs the standard 3-row block plus digits/space.
 */
export function getFingerForKey(key: string, layout: KeyboardLayout): FingerId | undefined {
  const table = CHAR_TO_FINGER_BY_LAYOUT[layout];
  return table.get(key) ?? table.get(key.toLowerCase());
}
