/**
 * event.key values (not event.code) for the keys that must not reach the
 * browser's default handling during an active round: Space would scroll the
 * page, Tab would move focus away, Backspace would navigate back, and `/`
 * opens Firefox's quick-find.
 */
const PREVENT_DEFAULT_KEYS = new Set([' ', 'Tab', 'Backspace', '/']);

/**
 * Calls preventDefault() for the round-disruptive keys, but only while a
 * round is active — settings and stats screens must keep scrolling/tabbing
 * normally, so callers pass whether a round is currently in progress.
 */
export function maybePreventDefault(event: KeyboardEvent, isRoundActive: boolean): void {
  if (isRoundActive && PREVENT_DEFAULT_KEYS.has(event.key)) {
    event.preventDefault();
  }
}
