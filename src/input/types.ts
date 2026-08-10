export type KeyboardLayout = 'qwerty' | 'dvorak' | 'colemak' | 'azerty' | 'qwertz';

export interface NormalizedKeydown {
  key: string;
  timestamp: number;
}
