import type { FingerId } from '../types';
import type { KeyboardLayout } from './types';

/**
 * DOM `event.code` values for the standard 3-row alphabetic block plus
 * digits and space. `code` identifies a physical key position regardless of
 * what character the active layout makes it produce.
 */
export type PhysicalCode =
  | 'KeyQ'
  | 'KeyW'
  | 'KeyE'
  | 'KeyR'
  | 'KeyT'
  | 'KeyY'
  | 'KeyU'
  | 'KeyI'
  | 'KeyO'
  | 'KeyP'
  | 'KeyA'
  | 'KeyS'
  | 'KeyD'
  | 'KeyF'
  | 'KeyG'
  | 'KeyH'
  | 'KeyJ'
  | 'KeyK'
  | 'KeyL'
  | 'KeyZ'
  | 'KeyX'
  | 'KeyC'
  | 'KeyV'
  | 'KeyB'
  | 'KeyN'
  | 'KeyM'
  | 'Semicolon'
  | 'Quote'
  | 'Comma'
  | 'Period'
  | 'Slash'
  | 'BracketLeft'
  | 'BracketRight'
  | 'Minus'
  | 'Equal'
  | 'Digit1'
  | 'Digit2'
  | 'Digit3'
  | 'Digit4'
  | 'Digit5'
  | 'Digit6'
  | 'Digit7'
  | 'Digit8'
  | 'Digit9'
  | 'Digit0'
  | 'Space';

/**
 * Which finger owns each physical key position. This is layout-independent
 * — finger assignment follows hand ergonomics tied to the physical key, not
 * whatever character a remapped layout makes it produce (requirements doc §4).
 */
export const CODE_TO_FINGER: Record<PhysicalCode, FingerId> = {
  KeyQ: 'L5',
  KeyW: 'L4',
  KeyE: 'L3',
  KeyR: 'L2',
  KeyT: 'L2',
  KeyY: 'R2',
  KeyU: 'R2',
  KeyI: 'R3',
  KeyO: 'R4',
  KeyP: 'R5',

  KeyA: 'L5',
  KeyS: 'L4',
  KeyD: 'L3',
  KeyF: 'L2',
  KeyG: 'L2',
  KeyH: 'R2',
  KeyJ: 'R2',
  KeyK: 'R3',
  KeyL: 'R4',
  Semicolon: 'R5',
  Quote: 'R5',

  KeyZ: 'L5',
  KeyX: 'L4',
  KeyC: 'L3',
  KeyV: 'L2',
  KeyB: 'L2',
  KeyN: 'R2',
  KeyM: 'R2',
  Comma: 'R3',
  Period: 'R4',
  Slash: 'R5',

  BracketLeft: 'R5',
  BracketRight: 'R5',
  Minus: 'R5',
  Equal: 'R5',

  Digit1: 'L5',
  Digit2: 'L4',
  Digit3: 'L3',
  Digit4: 'L2',
  Digit5: 'L2',
  Digit6: 'R2',
  Digit7: 'R2',
  Digit8: 'R3',
  Digit9: 'R4',
  Digit0: 'R5',

  Space: 'thumb',
};

const DIGITS: Partial<Record<PhysicalCode, string>> = {
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  Digit0: '0',
  Space: ' ',
};

const QWERTY_CODE_TO_CHAR: Record<PhysicalCode, string> = {
  ...DIGITS,
  Minus: '-',
  Equal: '=',
  KeyQ: 'q',
  KeyW: 'w',
  KeyE: 'e',
  KeyR: 'r',
  KeyT: 't',
  KeyY: 'y',
  KeyU: 'u',
  KeyI: 'i',
  KeyO: 'o',
  KeyP: 'p',
  BracketLeft: '[',
  BracketRight: ']',
  KeyA: 'a',
  KeyS: 's',
  KeyD: 'd',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  Semicolon: ';',
  Quote: "'",
  KeyZ: 'z',
  KeyX: 'x',
  KeyC: 'c',
  KeyV: 'v',
  KeyB: 'b',
  KeyN: 'n',
  KeyM: 'm',
  Comma: ',',
  Period: '.',
  Slash: '/',
} as Record<PhysicalCode, string>;

// Standard US-Dvorak remap (physical position -> Dvorak character).
const DVORAK_CODE_TO_CHAR: Record<PhysicalCode, string> = {
  ...DIGITS,
  Minus: '[',
  Equal: ']',
  KeyQ: "'",
  KeyW: ',',
  KeyE: '.',
  KeyR: 'p',
  KeyT: 'y',
  KeyY: 'f',
  KeyU: 'g',
  KeyI: 'c',
  KeyO: 'r',
  KeyP: 'l',
  BracketLeft: '/',
  BracketRight: '=',
  KeyA: 'a',
  KeyS: 'o',
  KeyD: 'e',
  KeyF: 'u',
  KeyG: 'i',
  KeyH: 'd',
  KeyJ: 'h',
  KeyK: 't',
  KeyL: 'n',
  Semicolon: 's',
  Quote: '-',
  KeyZ: ';',
  KeyX: 'q',
  KeyC: 'j',
  KeyV: 'k',
  KeyB: 'x',
  KeyN: 'b',
  KeyM: 'm',
  Comma: 'w',
  Period: 'v',
  Slash: 'z',
} as Record<PhysicalCode, string>;

// Colemak only moves the letters (plus Semicolon<->O) — punctuation, digits,
// and Z/X/C/V stay put by design, to preserve editing-shortcut muscle memory.
const COLEMAK_CODE_TO_CHAR: Record<PhysicalCode, string> = {
  ...QWERTY_CODE_TO_CHAR,
  KeyE: 'f',
  KeyR: 'p',
  KeyT: 'g',
  KeyY: 'j',
  KeyU: 'l',
  KeyI: 'u',
  KeyO: 'y',
  KeyP: ';',
  KeyS: 'r',
  KeyD: 's',
  KeyF: 't',
  KeyG: 'd',
  KeyJ: 'n',
  KeyK: 'e',
  KeyL: 'i',
  Semicolon: 'o',
  KeyN: 'k',
};

// QWERTZ (German) is QWERTY with just Y and Z swapped — the one fact about
// it that's true regardless of which national variant's punctuation/dead
// keys are in play. Punctuation/digit fidelity beyond that is out of scope
// for Phase 1's plain-English word content.
const QWERTZ_CODE_TO_CHAR: Partial<Record<PhysicalCode, string>> = {
  ...QWERTY_CODE_TO_CHAR,
  KeyY: 'z',
  KeyZ: 'y',
};

// AZERTY (French) letter rows plus the bottom-row punctuation shift.
// Number-row shift-layer digits and the accented-key positions (Quote,
// Minus, Equal, Brackets) are genuinely different hardware and out of scope
// for Phase 1's plain-English word content, so they're left unmapped here.
const AZERTY_CODE_TO_CHAR: Partial<Record<PhysicalCode, string>> = {
  ...DIGITS,
  KeyQ: 'a',
  KeyW: 'z',
  KeyE: 'e',
  KeyR: 'r',
  KeyT: 't',
  KeyY: 'y',
  KeyU: 'u',
  KeyI: 'i',
  KeyO: 'o',
  KeyP: 'p',
  KeyA: 'q',
  KeyS: 's',
  KeyD: 'd',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  Semicolon: 'm',
  KeyZ: 'w',
  KeyX: 'x',
  KeyC: 'c',
  KeyV: 'v',
  KeyB: 'b',
  KeyN: 'n',
  KeyM: ',',
  Comma: ';',
  Period: ':',
  Slash: '!',
};

export const LAYOUT_CODE_TO_CHAR: Record<KeyboardLayout, Partial<Record<PhysicalCode, string>>> = {
  qwerty: QWERTY_CODE_TO_CHAR,
  dvorak: DVORAK_CODE_TO_CHAR,
  colemak: COLEMAK_CODE_TO_CHAR,
  qwertz: QWERTZ_CODE_TO_CHAR,
  azerty: AZERTY_CODE_TO_CHAR,
};

/** A handful of codes whose character output differs across every supported
 * layout, used to fingerprint which layout is active without comparing the
 * full key set. */
export const DISCRIMINATING_CODES: PhysicalCode[] = ['KeyQ', 'KeyW', 'KeyY', 'KeyZ', 'KeyM', 'Semicolon'];
