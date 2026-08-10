# Keystroke — Project Requirements

A gamified web app for practicing core typing skills: finger accuracy, rhythm/flow, and error recovery.

This document is the build spec. It is written to be handed to Claude Code as the source of truth for implementation. All design decisions are settled — §10 records the ones that were open during specification and how they resolved.

---

## 1. Product summary

**What it is:** a browser-based typing trainer built as a game, not a lesson plan. Sessions are 60–90 seconds. Progress is tracked per-finger and per-skill, not as a single WPM number.

**Who it's for:** people who want to keep manual typing and hand-eye coordination sharp — students, developers, writers. Assumes a physical keyboard; mobile is view-only for stats.

**The single job of the main screen:** get the user typing within two seconds of load, with no menu to navigate.

**What it is not:** a lesson-based curriculum, a code editor, a multiplayer racing game (v1), or a mobile touch-typing app.

### Core skill model

Everything in the app maps to one of three tracked skills. Do not add mechanics that don't serve one of these.

| Skill | What it measures | Primary mode |
|---|---|---|
| Precision | Correct finger-to-key mapping; per-finger accuracy | Drill mode, Boss keys |
| Flow | Consistent inter-keystroke rhythm, not raw speed | Flow mode |
| Recovery | Time and keystrokes taken to correct an error without breaking pace | Repair mode |

---

## 2. Tech stack

### Required

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 + TypeScript (strict) | Function components and hooks only |
| Build tool | Vite | Fast HMR matters for tuning game feel |
| Styling | Tailwind CSS | Plus a small set of CSS custom properties for the theme ramp |
| Game rendering | Canvas 2D via a thin custom renderer | Only for Flow mode's scrolling lane and particle feedback |
| State | Zustand | One store per domain: `sessionStore`, `progressStore`, `settingsStore` |
| Persistence (v1) | IndexedDB via `idb` | Local-first. No account required to use the app |
| Routing | React Router | Routes are shallow: `/`, `/play/:mode`, `/stats`, `/settings` |
| Charts | Recharts | Stats screen only, never in the game loop |
| Testing | Vitest + React Testing Library | Plus Playwright for one end-to-end typing flow |
| Lint/format | ESLint + Prettier | `@typescript-eslint` recommended-type-checked |

### Explicitly rejected

- **No game engine (Unity, Godot, Phaser).** Typing is a keyboard-event and text-rendering problem; the DOM and Canvas 2D handle it with lower input latency and a far smaller bundle. Revisit only if 3D scenes become a requirement.
- **No WebGL/PixiJS in v1.** Canvas 2D is sufficient for the particle and lane effects described here. Add PixiJS only if profiling shows Canvas 2D dropping frames.
- **No CSS-in-JS runtime libraries.** They add per-frame cost in the game loop.
- **No backend in v1.** See §8 for the optional sync phase.

### Performance budget

These are hard requirements, not aspirations. A typing game lives or dies on input latency.

- Keystroke to visual feedback: **under 16ms** (one frame at 60fps).
- Time to interactive on the play screen: **under 1.5s** on a mid-range laptop, cold cache.
- Game loop must hold **60fps** with the flow meter, lane scroll, and particles all active.
- Initial JS bundle: **under 200KB gzipped**. Stats screen and Recharts must be lazy-loaded via `React.lazy`.
- Zero layout thrash during typing: never write to layout-affecting CSS properties in a keydown handler. Use `transform` and `opacity` only.

### Input handling rules

These are the most common sources of bugs in typing apps. Implement them explicitly.

- Listen on a focused hidden input or `document`, not on a contenteditable.
- Use `event.key` for character comparison, never `keyCode` or `which`.
- Ignore keydown events where `event.ctrlKey`, `event.metaKey`, or `event.altKey` is true.
- Call `preventDefault()` on Space, Tab, Backspace, and `/` during an active round so the browser doesn't scroll, tab away, navigate back, or open quick-find.
- Handle IME composition: ignore keystrokes while `event.isComposing` is true.
- Detect and handle key repeat (`event.repeat`) — held keys must not count as multiple correct strokes.
- Timestamp every keystroke with `performance.now()`, not `Date.now()`, for rhythm calculations.
- Detect keyboard layout where possible via `navigator.keyboard.getLayoutMap()`, falling back to a user-selected layout in settings (QWERTY, Dvorak, Colemak, AZERTY, QWERTZ).

---

## 3. Feature requirements

### 3.1 Flow mode (primary mode)

The default mode. Words scroll toward a target line; the user types them as they arrive.

Flow mode has two sub-modes sharing one engine — **free flow** (user-paced, the default) and **beat lock** (BPM-locked, unlocked later). See §10 for the full sub-mode spec. The requirements below apply to both unless noted.

**Requirements:**
- In free flow, words advance as they are completed — there is no imposed tempo. In beat lock, words advance on a BPM grid (default 90, adjustable 60–160).
- A combo multiplier increases with each correctly completed word and resets to zero on an uncorrected error.
- A **flow meter** fills based on the *consistency* of inter-keystroke intervals, not speed. Compute the coefficient of variation of the last 20 intervals; lower variation fills the meter faster. This is the mechanic that distinguishes the app — do not replace it with a speed meter.
- Visual feedback escalates with the flow meter: color saturation increases, a subtle particle emitter activates above 60%, an ambient audio layer fades in above 80%.
- Breaking flow drops the meter smoothly over ~400ms rather than snapping to zero, so the loss feels like momentum rather than punishment.
- Round length: 60 seconds default.

**Scoring:** `score = (wordsCompleted * 10) * comboMultiplier * (1 + flowMeterAverage)`

### 3.2 Drill mode (precision)

Progressive key introduction with per-finger tracking.

**Requirements:**
- Start with home row (`asdf jkl;`). New keys unlock when the user hits **95% accuracy over 50 occurrences** of every currently-unlocked key.
- Unlock order: home row → `e i r u` → `t y o n` → `g h c m` → `w v b p` → `q z x` → punctuation → numbers → symbols.
- Track accuracy, average latency, and total occurrences **per key** and roll them up **per finger** (8 fingers plus thumbs on space).
- Each finger has its own XP level (1–10) derived from rolled-up accuracy and volume. Display this on the keyboard heatmap.
- Generated drill text must weight recently-unlocked and low-accuracy keys more heavily. Target 40% weight to weak keys, 60% to general practice.

### 3.3 Boss keys

Short, focused drills on the user's weakest keys.

**Requirements:**
- Triggered automatically when a key's accuracy falls below 85% over its last 30 occurrences, or launched manually from the stats screen.
- 30-second single-key-focused drill: the target key appears in ~30% of characters, surrounded by already-mastered keys.
- Clearing a boss key (raising it above 90%) awards a badge and a burst of XP for the owning finger.

### 3.4 Repair mode (error recovery)

Trains fast correction, which is the actual skill — not error avoidance.

**Requirements:**
- Errors are not blocked. The user must notice and correct them with Backspace.
- Measure **recovery cost**: keystrokes typed between the error and its correction. A recovery within 1 keystroke is a "clean recovery" and awards bonus points; 2–3 is neutral; 4+ is penalized.
- Measure **detection latency**: milliseconds between the erroneous keystroke and the first Backspace.
- Visual metaphor: a mistyped word visibly cracks and heals when corrected. Uncorrected errors persist visually to the end of the round.
- Survival variant: 3 lives, lost only when an error goes uncorrected past a 5-keystroke window.

### 3.5 Progression and meta-game

- **XP** accrues per finger and globally. Global level unlocks new word packs and visual themes.
- **Daily streak** with a grace day per week so a single missed day doesn't destroy long streaks.
- **Skill radar** on the stats screen: five axes — precision, flow, recovery, endurance, coverage (proportion of keys above 90%).
- **Badges** for concrete achievements: clearing all boss keys, a 100-word combo, a 7-day streak, full key coverage, a sub-100ms average latency on a finger.
- **Session history** with per-session replay of the keystroke timeline (stored as compact interval arrays, not full event logs).

### 3.6 Stats screen

- Keyboard heatmap colored by per-key accuracy, with a toggle for per-key latency.
- Per-finger breakdown table.
- WPM, accuracy, flow consistency, and recovery cost trends over time (line charts, lazy-loaded).
- Weakest five keys with a one-click launch into a boss-key drill.

### 3.7 Settings

Keyboard layout, sound on/off (off by default), reduced motion, theme (light by default), word pack selection, and a data export/delete control. BPM appears only once beat lock is unlocked, and only affects that sub-mode.

---

## 4. Design direction

Reuse the visual language from the prototype: color-by-finger-zone, meter-as-feedback, split stats rather than a single blended score.

- **Finger color mapping:** left hand uses a teal ramp, right hand a coral ramp. Within each hand, darker shades for pinky and ring, lighter for index. Thumbs are neutral gray.
- **Typography:** a monospace face for all typing surfaces (drill text, target words) — the character grid must be stable so letters do not shift as they are typed. A sans face for chrome and stats. Never a proportional font in the typing area.
- **Motion:** effects are earned, not ambient. A resting screen is quiet; particles and color only appear as flow builds.
- **Accessibility (required, not optional):**
  - Respect `prefers-reduced-motion` — replace particles and screen movement with static color changes.
  - All game state must be legible without color alone (meters carry numeric labels).
  - Visible keyboard focus on all chrome.
  - Text contrast meets WCAG AA in both light and dark modes.
  - Sound is off by default and never required to play.

---

## 5. Data model

Store locally in IndexedDB. Keep the shapes compact — keystroke data accumulates quickly.

```ts
type FingerId = 'L5'|'L4'|'L3'|'L2'|'R2'|'R3'|'R4'|'R5'|'thumb';

interface KeyStat {
  key: string;
  finger: FingerId;
  attempts: number;
  correct: number;
  totalLatencyMs: number;   // divide by attempts for average
  recentResults: boolean[]; // ring buffer, last 30, for boss-key triggering
  unlocked: boolean;
}

interface FingerStat {
  finger: FingerId;
  xp: number;
  level: number;            // 1-10, derived
  accuracy: number;         // rolled up from KeyStat
  avgLatencyMs: number;
}

interface Session {
  id: string;
  mode: 'flow'|'drill'|'boss'|'repair';
  startedAt: number;
  durationMs: number;
  wpm: number;
  accuracy: number;
  flowConsistency: number;  // 0-1, from interval coefficient of variation
  recoveryCost: number;     // mean keystrokes-to-correction
  maxCombo: number;
  intervals: number[];      // inter-keystroke ms, for replay
  errors: { key: string; expected: string; atMs: number; correctedAfter: number|null }[];
}

interface Progress {
  globalXp: number;
  level: number;
  streakDays: number;
  lastPlayedDate: string;   // ISO date
  graceDaysRemaining: number;
  badges: string[];
  keyStats: Record<string, KeyStat>;
  fingerStats: Record<FingerId, FingerStat>;
}
```

**Retention:** keep full `Session` records for 90 days, then collapse older ones into daily aggregates. The user must be able to export all data as JSON and delete everything from settings.

---

## 6. Content sources

All practice text must be **public domain or permissively licensed**. Do not scrape or bundle copyrighted prose, song lyrics, poetry, or paywalled articles. Attribute sources in an in-app credits screen.

### Approved sources

| Content | Source | License | Use |
|---|---|---|---|
| Common English words | `google-10000-english` word list | Public domain | Core word packs, frequency-ordered |
| Word frequency data | Wiktionary frequency lists | CC BY-SA — attribute | Weighting word selection by commonality |
| Broader vocabulary | SCOWL / `english-words` | Permissive | Advanced packs, rare-letter coverage |
| Public-domain prose | Project Gutenberg, pre-1929 works | Public domain in the US | Passage mode for endurance drills |
| Code snippets | Own-written samples, or MIT/Apache-licensed repos with attribution | MIT/Apache | Symbol and bracket drills |
| Quotes | Wikiquote entries that are public domain | Check per-entry | Optional; verify each, do not bulk-import |

### Generation over curation

Prefer **generating** drill text procedurally from the word lists rather than shipping fixed paragraphs. The weighting algorithm in §3.2 needs dynamic text anyway, and generation avoids licensing risk entirely.

### Word pack structure

```
/src/content/packs/
  common-1k.json      // top 1000 words, no capitals or punctuation
  common-5k.json
  home-row.json       // generated, keys asdfjkl; only
  symbols.json        // programming symbols and brackets
  numbers.json
  passages/           // public-domain excerpts, each with source + license fields
```

Every content file carries a header object: `{ source, license, attribution, retrievedAt }`. Do not add a content file without one.

### Prohibited

- Song lyrics, poems, and contemporary published prose, in any quantity.
- User-uploaded text in v1 (adds moderation surface with no gameplay benefit).
- Scraped quote APIs of unclear provenance — most aggregate copyrighted material.

---

## 7. Project structure

```
src/
  content/          word packs and generators
  engine/           framework-agnostic game logic — pure TS, no React
    scoring.ts
    flow.ts         interval consistency math
    recovery.ts     error window tracking
    unlock.ts       key progression rules
    generator.ts    weighted drill text generation
  input/            keydown normalization, layout maps, finger mapping
  render/           canvas renderer for flow lane and particles
  audio/            procedural Web Audio synthesis — no samples, no React imports
  components/       React UI — keyboard heatmap, meters, stat cards
  routes/           screens
  stores/           zustand stores
  db/               IndexedDB schema and migrations
  test/
```

**Rule:** `engine/` must be pure TypeScript with no React or DOM imports. All scoring, flow, recovery, and unlock logic lives there and is unit-tested directly. This is what keeps game feel tunable without touching the UI.

---

## 8. Build phases

**Phase 1 — core loop.** Input handling, drill mode, per-key and per-finger tracking, keyboard heatmap, IndexedDB persistence. Playable and useful on its own.

**Phase 2 — flow mode.** Canvas lane renderer, combo system, flow meter with interval-consistency math, escalating feedback, and procedural audio. Ship free flow only; beat lock follows once the consistency math is validated against real sessions.

**Phase 3 — recovery and bosses.** Repair mode, error-window tracking, boss-key triggering, survival variant.

**Phase 4 — meta-game.** XP, levels, streaks, badges, stats screen with charts and radar.

**Phase 5 (optional) — accounts and sync.** Only if there is demand for cross-device progress. Would add: a backend (Postgres + a thin API), auth, and a server-authoritative leaderboard. Leaderboards require server-side validation of keystroke intervals to resist scripted submissions — do not build a client-trusting leaderboard.

---

## 9. Testing requirements

- Unit tests for every module in `engine/` — scoring, flow consistency, unlock thresholds, recovery cost, and the text generator's weighting distribution.
- Input normalization tests covering modifier keys, key repeat, IME composition, and each supported layout.
- One Playwright end-to-end test: load the app, complete a drill round via synthetic keystrokes, verify progress persisted to IndexedDB and survived a reload.
- A performance test asserting keystroke-to-paint stays under one frame with the flow meter and particles active.

---

## 10. Resolved decisions

These were open questions during specification. They are now settled — implement as written.

### Sound: procedural, via the Web Audio API

No audio samples ship with the app. All sound is synthesized at runtime.

- Use a single `AudioContext`, created lazily on the first user gesture (browsers block autoplay before interaction).
- Keystroke feedback: a short oscillator burst, roughly 15–30ms, with a fast attack and exponential decay. Vary pitch slightly per finger zone so the left and right hands sound distinguishable.
- Correct-word chime and error tone are the same synthesis path with different frequency and envelope — do not build separate systems.
- The flow-meter ambient layer above 80% is a low sustained oscillator with slowly modulating gain, faded in over ~1s. It must fade out, never cut.
- Reuse a small pool of oscillator nodes rather than allocating per keystroke; garbage collection during the game loop causes frame drops.
- Sound stays off by default and behind a settings toggle. Nothing in the game may depend on audio to be playable.
- Keep all synthesis in `src/audio/`, framework-agnostic like `engine/`, so it is testable and tunable in isolation.

### Flow mode: passive rhythm by default, with two sub-modes

Flow mode ships with rhythm **measured, not enforced**. The user types at their own pace; the flow meter reads the consistency of their intervals as described in §3.1. This is the default and the mode a new user lands in.

Both sub-modes share one engine — the same interval-consistency math in `engine/flow.ts` drives both. The difference is only whether the app imposes a tempo.

| Sub-mode | Tempo | Flow meter source | Intended for |
|---|---|---|---|
| Free flow (default) | User-paced; words advance as they are completed | Coefficient of variation of the user's own intervals | Everyone; the default entry point |
| Beat lock | BPM-locked scroll, 60–160, default 90 | Deviation from the metronome grid | Players who have cleared a flow-consistency threshold |

**Requirements:**
- Free flow is the default and must be fully playable without ever surfacing beat lock.
- Beat lock unlocks after the user sustains a flow consistency above 0.7 for three sessions. Do not gate it behind payment or level alone.
- In beat lock, a missed beat window drops the combo but does not end the round.
- The sub-mode is a selectable tab on the Flow mode screen once unlocked, not a separate route.
- Both sub-modes write to the same `Session` record with `mode: 'flow'`; add a `subMode: 'free'|'beatlock'` field to distinguish them in stats.

Update the `Session` interface in §5 accordingly:

```ts
interface Session {
  // ...existing fields
  mode: 'flow'|'drill'|'boss'|'repair';
  subMode?: 'free'|'beatlock';
}
```

### Default theme: light

- Light is the default on first load. Dark is available in settings and must meet the same WCAG AA contrast requirements.
- Respect `prefers-color-scheme` on first visit only — if the user's system is set to dark, open in dark, but record light as the stored default once they change anything. An explicit user choice in settings always wins thereafter.
- Implement both themes as CSS custom-property sets on a root `data-theme` attribute. No duplicated component styles, no conditional color logic in JS.
- The finger-color ramps (teal for left hand, coral for right) must be defined per theme so they stay legible on both backgrounds — do not reuse identical hex values across modes.
