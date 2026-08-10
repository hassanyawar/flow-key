import { describe, expect, it } from 'vitest';
import { normalizeKeydown } from './normalizeKeydown';

function keydown(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent('keydown', init);
}

describe('normalizeKeydown', () => {
  it('extracts key and a performance.now() timestamp for a plain keystroke', () => {
    const before = performance.now();
    const result = normalizeKeydown(keydown({ key: 'a' }));
    const after = performance.now();

    expect(result).not.toBeNull();
    expect(result?.key).toBe('a');
    expect(result?.timestamp).toBeGreaterThanOrEqual(before);
    expect(result?.timestamp).toBeLessThanOrEqual(after);
  });

  it.each([
    ['ctrlKey', { key: 'a', ctrlKey: true }],
    ['metaKey', { key: 'a', metaKey: true }],
    ['altKey', { key: 'a', altKey: true }],
  ])('rejects events with %s held', (_name, init) => {
    expect(normalizeKeydown(keydown(init))).toBeNull();
  });

  it('rejects held-key repeats', () => {
    expect(normalizeKeydown(keydown({ key: 'a', repeat: true }))).toBeNull();
  });

  it('rejects keystrokes during IME composition', () => {
    expect(normalizeKeydown(keydown({ key: 'a', isComposing: true }))).toBeNull();
  });

  it('accepts a shifted keystroke with no other modifiers', () => {
    const result = normalizeKeydown(keydown({ key: 'A', shiftKey: true }));
    expect(result?.key).toBe('A');
  });
});
