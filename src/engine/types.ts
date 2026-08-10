import type { FingerId } from '../types';

/** Per-key tracking. Requirements doc §5. */
export interface KeyStat {
  key: string;
  finger: FingerId;
  attempts: number;
  correct: number;
  totalLatencyMs: number; // divide by attempts for average
  recentResults: boolean[]; // ring buffer, last 30, for boss-key triggering
  unlocked: boolean;
}

/** Per-finger roll-up, derived from that finger's owned KeyStats. Requirements doc §5. */
export interface FingerStat {
  finger: FingerId;
  xp: number;
  level: number; // 1-10, derived
  accuracy: number;
  avgLatencyMs: number;
}

export function createKeyStat(key: string, finger: FingerId, unlocked = false): KeyStat {
  return {
    key,
    finger,
    attempts: 0,
    correct: 0,
    totalLatencyMs: 0,
    recentResults: [],
    unlocked,
  };
}
