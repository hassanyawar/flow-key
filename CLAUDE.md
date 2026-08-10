# CLAUDE.md — Flowtype

This file is instructions for Claude Code working in this repo. Read `TYPING_APP_REQUIREMENTS.md` first — it is the product and architecture spec. This file is about *how* to work, not *what* to build.

## Project

Flowtype is a gamified typing trainer: React + TypeScript + Vite, Canvas 2D for the game surface, Zustand for state, IndexedDB for local persistence. No backend in v1. Full stack rationale is in the requirements doc §2 — don't relitigate it (no game engine, no CSS-in-JS, no WebGL yet).

## Before you start any task

1. Check which build phase the task belongs to (requirements doc §8). Don't reach ahead into a later phase's concerns — e.g. don't wire up beat-lock BPM logic while still on Phase 1.
2. If a task touches `engine/`, write the pure-TS logic and its unit tests before touching any component that consumes it.
3. If the task is ambiguous against the spec, stop and ask rather than guessing — this app's feel depends on exact behavior (see Non-negotiables below), and a wrong guess compiles fine but plays wrong.

## Non-negotiables

These come directly from the requirements doc. Violating them is a bug even if the code compiles and tests pass.

- **`engine/` and `audio/` never import React or touch the DOM.** They are pure TypeScript, unit-testable in isolation. If a component needs game logic, it imports a function from `engine/`, it does not reimplement it inline.
- **Keystroke-to-feedback must stay under 16ms.** Never write to layout-affecting CSS properties (`width`, `top`, `left`, box model) from a keydown handler or the game loop — use `transform` and `opacity` only. If you're unsure whether a style change triggers layout, assume it does and use a transform instead.
- **`event.key` only, never `keyCode`/`which`.** Every keydown handler must ignore ctrl/meta/alt-modified events, must handle `event.repeat`, and must ignore events while `event.isComposing` is true. Copy the pattern from the first handler you write — don't reinvent it per component.
- **No sampled audio.** All sound is synthesized in `audio/` via Web Audio oscillators, per requirements doc §10. Reuse pooled oscillator nodes; do not allocate a new node per keystroke.
- **Flow meter reflects consistency, not speed.** If you find yourself computing the flow meter from words-per-minute or raw interval length, stop — it's the coefficient of variation of recent intervals. This is the one mechanic that makes the app what it is.
- **No copyrighted practice text.** Every content file under `src/content/` must carry the `{ source, license, attribution, retrievedAt }` header. If you generate a new word pack, generate it from the approved sources in requirements doc §6 — never hand-write or scrape prose to fill a pack.
- **Light theme is the default.** Both themes are CSS custom properties on `data-theme`; never write a conditional color branch in component logic.

## Code conventions

- TypeScript strict mode. No `any` — if a type is genuinely unknown, use `unknown` and narrow it.
- Function components and hooks only. No class components.
- One Zustand store per domain (`sessionStore`, `progressStore`, `settingsStore`) — don't cram unrelated state into one store.
- Co-locate a component's test file next to it (`Foo.tsx`, `Foo.test.tsx`).
- Prefer small, named functions in `engine/` over inline logic in components — the goal is that game feel can be tuned and tested without touching UI code.
- Run `npm run lint` and `npm run typecheck` before considering a task done. Both must be clean.
- Commit messages: imperative mood, scoped prefix matching the top-level directory touched (e.g. `engine: fix flow consistency calc for short sessions`).

## Git workflow

This repo follows git-flow: `main` is releases only, `develop` is the integration branch, all work happens on branches cut from `develop`.

- One feature branch per task from `PHASE_1_TASKS.md` (or the equivalent numbered task in a later phase's task doc) — branch as `feature/<short-task-slug>`, e.g. `feature/project-scaffold`, `feature/input-handling`.
- Don't lump multiple numbered tasks into one branch, even if they touch the same directory — the task doc's dependency ordering exists so each is independently reviewable and revertible.
- Branch from `develop`, not `main`. Merge back into `develop` only once the task's "Done when" criteria pass (lint/typecheck/tests clean, per Code conventions above).
- Unless explicitly told otherwise, keep this work local: commit on the feature branch, merge to local `develop`, and stop there. Do not push to `origin` or open a PR without being asked — those are visible to others and need explicit sign-off first.
- Commit message format is unchanged from the convention below (imperative mood, scoped prefix); this applies per-commit within a feature branch, not just at merge time.

## Testing expectations

- Every function in `engine/` and `audio/` gets a unit test. This is not optional — these directories are pure and cheap to test, and they're where the actual game behavior lives.
- Input normalization (modifier keys, repeat, IME, layout mapping) needs explicit test cases for each condition, not just a happy path.
- Don't write a Playwright test per feature. One end-to-end flow (per requirements doc §9) is enough; lean on unit tests for the rest.

## What not to do

- Don't add a dependency without checking if `engine/` can do it in plain TS first — the bundle budget is 200KB gzipped for the initial load.
- Don't build ahead of the current phase's scope, even if it seems convenient (e.g. don't add the beat-lock BPM UI while implementing free-flow in Phase 2).
- Don't introduce a backend, auth, or network call — v1 is local-first, no exceptions, no "just for now" shortcuts.
- Don't loosen the input-handling or performance rules to make a feature easier to ship. If a feature can't be built within them, flag it instead of quietly regressing input latency.

## When you're unsure

Ask. This spec is detailed on purpose because typing-game feel is unforgiving of small mistakes — re-read the relevant section of `TYPING_APP_REQUIREMENTS.md` before guessing, and surface the ambiguity if the doc doesn't resolve it.
