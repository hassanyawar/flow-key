import type { KeyboardLayout } from './types';
import { DISCRIMINATING_CODES, LAYOUT_CODE_TO_CHAR, type PhysicalCode } from './layoutData';

interface KeyboardLayoutMapLike {
  get(code: string): string | undefined;
}

interface NavigatorWithKeyboard {
  keyboard?: {
    getLayoutMap: () => Promise<KeyboardLayoutMapLike>;
  };
}

const ALL_LAYOUTS: KeyboardLayout[] = ['qwerty', 'dvorak', 'colemak', 'qwertz', 'azerty'];

function scoreLayout(layout: KeyboardLayout, reported: KeyboardLayoutMapLike): number {
  const reference = LAYOUT_CODE_TO_CHAR[layout];
  let score = 0;
  for (const code of DISCRIMINATING_CODES) {
    const expected = reference[code];
    if (expected !== undefined && reported.get(code) === expected) score += 1;
  }
  return score;
}

/**
 * Detects the active keyboard layout via navigator.keyboard.getLayoutMap(),
 * matching a handful of discriminating physical keys against each supported
 * layout's reference table. Falls back to `fallback` (QWERTY by default)
 * whenever the API is unsupported, denied, or produces no confident match —
 * this covers browsers without the API (Firefox, Safari) as well as
 * insecure contexts.
 */
export async function detectKeyboardLayout(fallback: KeyboardLayout = 'qwerty'): Promise<KeyboardLayout> {
  const nav = navigator as NavigatorWithKeyboard;
  if (!nav.keyboard?.getLayoutMap) return fallback;

  let reported: KeyboardLayoutMapLike;
  try {
    reported = await nav.keyboard.getLayoutMap();
  } catch {
    return fallback;
  }

  let best: KeyboardLayout = fallback;
  let bestScore = -1;
  let tied = false;

  for (const layout of ALL_LAYOUTS) {
    const score = scoreLayout(layout, reported);
    if (score > bestScore) {
      best = layout;
      bestScore = score;
      tied = false;
    } else if (score === bestScore) {
      tied = true;
    }
  }

  const MIN_CONFIDENT_MATCHES = 3;
  if (bestScore < MIN_CONFIDENT_MATCHES || tied) return fallback;

  return best;
}

export type { PhysicalCode };
