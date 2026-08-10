import { describe, expect, it, vi } from 'vitest';
import { maybePreventDefault } from './preventDefault';

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key });
}

describe('maybePreventDefault', () => {
  it.each([' ', 'Tab', 'Backspace', '/'])(
    'prevents default for %j while a round is active',
    (key) => {
      const event = keydown(key);
      const spy = vi.spyOn(event, 'preventDefault');
      maybePreventDefault(event, true);
      expect(spy).toHaveBeenCalledOnce();
    },
  );

  it.each([' ', 'Tab', 'Backspace', '/'])(
    'does not prevent default for %j when no round is active',
    (key) => {
      const event = keydown(key);
      const spy = vi.spyOn(event, 'preventDefault');
      maybePreventDefault(event, false);
      expect(spy).not.toHaveBeenCalled();
    },
  );

  it('does not prevent default for keys outside the disruptive set, even mid-round', () => {
    const event = keydown('a');
    const spy = vi.spyOn(event, 'preventDefault');
    maybePreventDefault(event, true);
    expect(spy).not.toHaveBeenCalled();
  });
});
