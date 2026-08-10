import type { NormalizedKeydown } from './types';

/**
 * Extracts `{ key, timestamp }` from a raw keydown event, or returns `null`
 * if the event should not count as a keystroke: modifier-held, a held-key
 * repeat, or mid-IME-composition. Always uses `event.key` (never
 * `keyCode`/`which`) and `performance.now()` (never `Date.now()`) per
 * requirements doc §2.
 */
export function normalizeKeydown(event: KeyboardEvent): NormalizedKeydown | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.repeat) return null;
  if (event.isComposing) return null;

  return { key: event.key, timestamp: performance.now() };
}
