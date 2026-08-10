import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectKeyboardLayout } from './keyboardLayout';
import { LAYOUT_CODE_TO_CHAR } from './layoutData';
import type { KeyboardLayout } from './types';

function mockLayoutMap(entries: Partial<Record<string, string>>): void {
  vi.stubGlobal('navigator', {
    ...navigator,
    keyboard: {
      getLayoutMap: () =>
        Promise.resolve({
          get: (code: string) => entries[code],
        }),
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const REAL_LAYOUTS: KeyboardLayout[] = ['qwerty', 'dvorak', 'colemak', 'qwertz', 'azerty'];

describe('detectKeyboardLayout', () => {
  it.each(REAL_LAYOUTS)('identifies %s from a full, consistent layout map', async (layout) => {
    mockLayoutMap(LAYOUT_CODE_TO_CHAR[layout]);
    expect(await detectKeyboardLayout()).toBe(layout);
  });

  it('falls back to the given default when navigator.keyboard is unsupported', async () => {
    vi.stubGlobal('navigator', { ...navigator, keyboard: undefined });
    expect(await detectKeyboardLayout('dvorak')).toBe('dvorak');
  });

  it('falls back to QWERTY by default when the API is unsupported', async () => {
    vi.stubGlobal('navigator', { ...navigator, keyboard: undefined });
    expect(await detectKeyboardLayout()).toBe('qwerty');
  });

  it('falls back when getLayoutMap() rejects', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      keyboard: { getLayoutMap: () => Promise.reject(new Error('denied')) },
    });
    expect(await detectKeyboardLayout('colemak')).toBe('colemak');
  });

  it('falls back when the reported map matches no layout confidently', async () => {
    mockLayoutMap({ KeyQ: 'x', KeyW: 'y', KeyY: 'z' });
    expect(await detectKeyboardLayout('qwerty')).toBe('qwerty');
  });
});
