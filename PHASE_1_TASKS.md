# Phase 1 — Core loop

Goal: a playable, useful app on its own — Drill mode, per-key and per-finger tracking, keyboard heatmap, local persistence. No Flow mode, no Repair mode, no meta-game yet (those are Phases 2–4).

Work top to bottom. Each task lists what it depends on and what "done" means. Don't start a task before its dependencies are checked off.

---

## 1. Project scaffold

- [x] Init Vite + React + TypeScript (strict) project.
- [x] Install and configure Tailwind CSS.
- [x] Install Zustand, `idb`, React Router.
- [x] Configure ESLint (`@typescript-eslint` recommended-type-checked) and Prettier.
- [x] Configure Vitest + React Testing Library.
- [x] Set up `npm run lint`, `npm run typecheck`, `npm run test`, `npm run dev`, `npm run build` scripts.
- [x] Create the directory structure from requirements doc §7 (`engine/`, `audio/`, `input/`, `render/`, `components/`, `routes/`, `stores/`, `db/`, `content/`, `test/`) with empty index files so structure is visible from the start.
- [x] Add `CLAUDE.md` and `TYPING_APP_REQUIREMENTS.md` to repo root if not already present.

**Done when:** `npm run dev` shows a blank app, `npm run lint`/`typecheck`/`test` all pass with zero files to check.

---

## 2. Theme and base layout

- [x] Define light and dark CSS custom-property sets, applied via `data-theme` on root.
- [x] Light is default; respect `prefers-color-scheme` only on first visit (requirements doc §10).
- [x] Define the finger-color ramps (teal/left, coral/right) as theme-scoped custom properties — separate values per theme, not shared hex.
- [x] Set up the monospace font for typing surfaces and sans font for chrome. Confirm the monospace font keeps a stable character grid (test with a mixed-width string).
- [x] Build the app shell: route outlet, minimal top-level nav (routes are `/`, `/play/:mode`, `/stats`, `/settings` — only `/` and `/play/drill` need real content this phase).

**Done when:** switching `data-theme` on the root element visibly swaps the whole UI with no unstyled flashes, and both themes pass WCAG AA contrast checks on body text.

---

## 3. Input handling (`src/input/`)

This is the highest-risk area for subtle bugs. Build and test it in isolation before any component uses it.

- [x] `normalizeKeydown(event)`: extracts `{ key, timestamp }` using `event.key` and `performance.now()`.
- [x] Ignore events where `ctrlKey`, `metaKey`, or `altKey` is true.
- [x] Ignore events where `event.repeat` is true.
- [x] Ignore events where `event.isComposing` is true.
- [x] `preventDefault()` on Space, Tab, Backspace, `/` while a round is active — verify this doesn't leak outside an active round (settings and stats screens must scroll/tab normally).
- [x] Keyboard layout detection via `navigator.keyboard.getLayoutMap()` with a graceful fallback to a user-selected layout (QWERTY default).
- [x] Finger-mapping table: every key on the supported layouts maps to one of the 9 `FingerId` values from the data model.
- [x] Unit tests: modifier-key rejection, key-repeat rejection, IME composition rejection, each supported layout's finger mapping, and the preventDefault scoping.

**Done when:** all input unit tests pass, and manually mashing modifier keys, holding a key down, and typing with an IME active (if testable) all produce no false keystrokes.

---

## 4. Engine: key stats and unlock logic (`src/engine/`)

Pure TypeScript, no DOM or React imports. Write tests alongside each function.

- [ ] `KeyStat` and `FingerStat` types per the data model in requirements doc §5.
- [ ] `recordAttempt(keyStat, correct, latencyMs)`: updates attempts, correct count, latency sum, and the 30-entry ring buffer of recent results.
- [ ] `rollUpFingerStat(keyStats, finger)`: derives a `FingerStat` (accuracy, avg latency, XP, level 1–10) from its owned keys.
- [ ] `unlock.ts`: implements the unlock order and threshold from requirements doc §3.2 (95% accuracy over 50 occurrences of every currently-unlocked key). Pure function: given current `KeyStat` state, returns the next key(s) to unlock, if any.
- [ ] `generator.ts`: weighted drill text generator — 40% weight to weak keys (accuracy below threshold or recently unlocked), 60% general practice, respecting only currently-unlocked keys.
- [ ] Unit tests: unlock triggers at exactly the threshold and not before, generator's weighting distribution over a large sample matches the 40/60 split within a reasonable tolerance, roll-up math is correct with partial finger data (e.g. a finger with only one key attempted).

**Done when:** engine test suite covers unlock thresholds, roll-up correctness, and generator weighting, all passing, with no import of React or DOM APIs anywhere in `engine/`.

---

## 5. Content: word packs (`src/content/`)

- [ ] Source and include `google-10000-english` (or equivalent public-domain list) as `common-1k.json` and `common-5k.json`, each with the required `{ source, license, attribution, retrievedAt }` header.
- [ ] Generate `home-row.json` programmatically (words restricted to `asdf jkl;`) rather than hand-curating.
- [ ] Verify no file lacks the attribution header — add a lint or test step that fails the build if one is missing.

**Done when:** at least the home-row and common-1k packs exist, are licensed correctly, and are loadable by the generator from task 4.

---

## 6. Persistence (`src/db/`)

- [ ] IndexedDB schema via `idb`: object stores for `Progress` (singleton) and `Session` (keyed by id).
- [ ] `saveSession(session)`, `getProgress()`, `updateProgress(patch)`, `exportAllData()`, `deleteAllData()`.
- [ ] Wire `updateProgress` to be called after each drill round completes, applying the `recordAttempt`/`rollUpFingerStat` results from task 4.
- [ ] Unit tests using `fake-indexeddb`: save/load round-trips, export produces valid JSON, delete actually clears both stores.

**Done when:** a session can be saved and the resulting `Progress` re-read after a simulated reload, verified by test — not just by manual inspection.

---

## 7. Drill mode UI (`src/components/`, `src/routes/`)

- [ ] Typing surface component: renders generated drill text, highlights typed characters (correct vs incorrect state), advances a cursor. Uses `transform`/`opacity` only for any per-keystroke visual change — no layout-affecting styles in the hot path.
- [ ] Wire the typing surface to `input/` for keydown handling and to `engine/` for recording attempts.
- [ ] Keyboard heatmap component: renders the keyboard, colors keys by the finger-zone ramps from task 2, intensity driven by per-key accuracy from `Progress`.
- [ ] Drill route (`/play/drill`): loads current `Progress`, generates text via `engine/generator.ts`, runs a round, saves the resulting `Session` and updated `Progress` on completion.
- [ ] Basic round-end summary: accuracy, WPM, any keys newly unlocked this round.

**Done when:** a full round is playable start to finish — text generates, keystrokes register correctly, the heatmap reflects real accuracy data, and progress persists across a page reload.

---

## 8. End-to-end verification

- [ ] Playwright test: load app, navigate to drill mode, complete a round via synthetic keystrokes, assert progress persisted to IndexedDB, reload, assert it's still there.
- [ ] Performance check: instrument or manually verify keystroke-to-paint stays under one frame during a drill round (no Flow mode particles yet, so this should be comfortably within budget — establishes the baseline before Phase 2 adds load).
- [ ] Manual pass: play through enough rounds to trigger at least one key unlock, confirm the unlock order matches the spec.

**Done when:** the Playwright test passes in CI (or locally if CI isn't set up yet), and a fresh unlock has been observed to happen correctly at least once.

---

## Explicitly out of scope for Phase 1

Do not build these now, even if they seem like small additions — they belong to later phases per requirements doc §8:

- Flow mode, the canvas lane renderer, and anything in `render/` or `audio/`
- Repair mode and error-recovery tracking
- Boss keys (the unlock/threshold logic in `engine/` can anticipate the shape, but the boss-key drill UI and triggering are Phase 3)
- XP, levels, streaks, badges, and the stats screen's charts/radar (Phase 4)
- Any backend, auth, or sync (Phase 5, optional)
