---
description: "Task list for 001-bootstrap-session-timer feature implementation"
---

# Tasks: Bootstrap session and rest timer

**Input**: Design documents from `/Users/scott.rouse/Workspace/SpecKit/firstOne/firstone/specs/001-bootstrap-session-timer/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: Not requested in spec—no automated test tasks. Validate with [quickstart.md](./quickstart.md) manual matrix.

**Organization**: Phases follow user stories US1 (P1), US2 (P2). All application code lives under **`src/`** at **repository root** (Vite default); config and `public/` sit next to `.specify/` and `specs/` (per [plan.md](./plan.md)).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks in the same wave)
- **[Story]**: [US1] or [US2] for user-story phases only

## Path conventions

- **App source root**: `src/` (Vite + React + TypeScript at repository root)
- **Spec artifacts**: `specs/001-bootstrap-session-timer/contracts/storage-schema.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Vite React TS scaffold at **repository root** with **`src/`** as the app source tree.

- [x] T001 Scaffold Vite + React + TypeScript at **repository root** (same directory as `.specify/`): run `npm create vite@latest . -- --template react-ts` and resolve merge prompts so existing SpecKit folders stay intact, **or** add `package.json`, `vite.config.ts`, `index.html`, and `src/` manually per [quickstart.md](./quickstart.md)—**do not** use a `web/` subfolder
- [x] T002 Run `npm install` at repository root; add optional `vite-plugin-pwa` dev dependency in `package.json` per [plan.md](./plan.md)
- [x] T003 [P] Add `public/manifest.webmanifest` with `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, and `icons` array (placeholder paths until T024)
- [x] T004 [P] Update `vite.config.ts` at repository root for React plugin and optional `VitePWA()` registration (minimal config; align `base` with deploy target)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Design tokens, global layout, types, storage contract, reducer, and session hook—**required before any UI story**.

**⚠️ CRITICAL**: No user story work until this phase is complete.

- [x] T005 Create `src/styles/tokens-primitive.css` with space scale, radius scale, font-size steps, and neutral color ramp per [research.md](./research.md) and [plan.md](./plan.md)
- [x] T006 Create `src/styles/tokens-semantic.css` referencing **only** primitive variables for `--color-surface`, `--color-text`, `--color-accent`, `--color-alarm`, `--font-timer`, `--touch-target-min`, `--layout-max-width`, and control sizing
- [x] T007 Create `src/styles/global.css` that imports both token files, applies minimal reset, and defines a centered `.app-shell` using `--layout-max-width` (constitution: phone-first, centered column)
- [x] T008 Import `src/styles/global.css` from `src/main.tsx`
- [x] T009 [P] Create `src/lib/sessionTypes.ts` with TypeScript types matching [data-model.md](./data-model.md) and fields in `specs/001-bootstrap-session-timer/contracts/storage-schema.json`
- [x] T010 [P] Create `src/lib/timerMath.ts` exporting `remainingMsFromEndsAt(nowMs: number, endsAtMs: number): number` clamped at zero
- [x] T011 Implement `src/lib/storage.ts` with `STORAGE_KEY` constant `rest-timer-session-v1`, `loadPersistedState()` / `savePersistedState()` using JSON parse/stringify, **manual validation** of required fields per `specs/001-bootstrap-session-timer/contracts/storage-schema.json`, and **safe clear + null return** on invalid or corrupt data; **missing or empty key MUST return null** (first run / no session) per [spec.md](./spec.md) scenario 1 and [contracts/README.md](./contracts/README.md); on save always set **updatedAt** (epoch ms) per [plan.md](./plan.md) § Storage, timestamps, and ordering
- [x] T012 Implement `src/state/sessionReducer.ts` as a pure reducer with actions covering: hydrate from storage, **NEW_SESSION** (new `sessionId`, **sessionStartedAt** = now, clear prior continuable state), **CONTINUE_SESSION**, **START_REST** (durationMs, set `restEndsAt`), **REST_TICK** / wall-clock resync from `restEndsAt`, **REST_COMPLETE** (enter alarm), **REST_STOP** (cancel, no alarm; **append** `{ startedAt, endedAt, outcome: cancelled }` to **restRunLog**), **ALARM_DONE** → `exercise_idle` (**append** `restRunLog` entry with `outcome: completed` when rest finished via alarm), **END_WORKOUT** (`lifecycle: ended`), and **ignore START_REST** when phase is already `rest_running` per [research.md](./research.md); ensure **restRunLog** stays sorted by `startedAt` by appending in chronological order only
- [x] T013 Create `src/hooks/useWorkoutSession.ts` using `useReducer` + `useEffect` to hydrate from `src/lib/storage.ts` on mount and persist on every material state change; when `loadPersistedState()` returns **null**, initialize to **entry / no continuable session** (no errors) per [spec.md](./spec.md) first-run edge case

**Checkpoint**: Foundation ready—implement user stories.

---

## Phase 3: User Story 1 — Exercise, rest, alarm, Done, next exercise (Priority: P1) 🎯 MVP

**Goal**: Full session loop: entry → active session → between-exercises countdown → alarm → Done → repeat; **end session**; **Continue** vs **New workout** on entry; **localStorage** restore on reload.

**Independent Test**: Run scenarios **1–9** in [spec.md](./spec.md) User Story 1 (include **empty storage / first run**; then start session, rest cycle, alarm, Done, second rest, reload restore, end session, resume, new session).

### Implementation for User Story 1

- [x] T014 [US1] Create `src/components/EntryView.tsx` with large primary actions: **New workout** and **Continue** (show Continue only when `src/lib/storage.ts` / session state reports a continuable `ended` or resumable `active` state per [spec.md](./spec.md) FR-002); use semantic CSS variables for touch targets
- [x] T015 [US1] Create `src/components/TimerDisplay.tsx` accepting `remainingMs` and displaying **MM:SS** using `--font-timer` and high contrast semantic colors
- [x] T016 [US1] Create `src/components/SessionView.tsx` with duration presets **0.1 / 1 / 2** min (default **1 min**), **Start rest**, dominant **Stop** (visible during `rest_running`), **Done** when alarm active, and **End workout**; wire dispatches to `useWorkoutSession` from `src/hooks/useWorkoutSession.ts`
- [x] T017 [US1] Update `src/App.tsx` to render `EntryView` vs `SessionView` based on reducer state (e.g. `lifecycle` and whether user is “in” session UI); wrap root in `.app-shell` from `src/styles/global.css`
- [x] T018 [US1] Create `src/components/AlarmSurface.tsx` (or equivalent module colocated with session UI) for **rest_alarm** phase: high-contrast full-area feedback; use **CSS animation** for pulse unless `prefers-reduced-motion: reduce`, then **sustained** solid alarm styling per [research.md](./research.md)
- [x] T019 [US1] Add `src/lib/alarmSound.ts` to play a short beep via **Web Audio API** or `HTMLAudioElement` after an explicit **audio unlock** triggered on first user tap anywhere in `src/App.tsx` or session entry (Safari autoplay policy); while **`rest_alarm`**, **`src/hooks/useWorkoutSession.ts`** MUST **beep once immediately** then **`setInterval` ~2000 ms** repeating **`playAlarmBeep`** until phase changes (see [spec.md](./spec.md) FR-004, [plan.md](./plan.md) implementation notes)
- [x] T020 [US1] Ensure **NEW_SESSION** path in `src/state/sessionReducer.ts` and `src/hooks/useWorkoutSession.ts` replaces prior persisted state with a fresh `sessionId` and clears continuable data per [spec.md](./spec.md) FR-002 / scenario 8
- [x] T021 [US1] Use `requestAnimationFrame` or 1s `setInterval` in `src/components/SessionView.tsx` (or small `src/hooks/useNowTick.ts`) to refresh countdown display from `restEndsAt` without drifting persistence logic

**Checkpoint**: User Story 1 acceptance scenarios pass manually.

---

## Phase 4: User Story 2 — Stop the rest timer early (Priority: P2)

**Goal**: Mid-countdown **Stop** ends rest immediately, **no** completion alarm, session ready for another rest after next exercise.

**Independent Test**: [spec.md](./spec.md) User Story 2 acceptance scenarios (stop early; start another rest later).

### Implementation for User Story 2

- [x] T022 [US2] Verify and harden **REST_STOP** in `src/state/sessionReducer.ts`: transition to `exercise_idle`, clear `restEndsAt` and alarm flags, set `lastRestOutcome` to `cancelled`, never enter `rest_alarm`
- [x] T023 [US2] In `src/components/SessionView.tsx`, ensure **Stop** dispatches **REST_STOP**, hides alarm UI, and **Start rest** remains available after early stop; add inline comment referencing [spec.md](./spec.md) US2 if behavior is non-obvious

**Checkpoint**: User Story 2 scenarios pass manually.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: PWA assets, docs, manual WebKit validation.

- [x] T024 Add `public/icons/` with at least **192×192** and **512×512** maskable PNGs and update `public/manifest.webmanifest` `icons` entries to match
- [x] T025 [P] Finalize `vite-plugin-pwa` config in `vite.config.ts` (scope, `manifest` injection) if using plugin; otherwise ensure manifest link tag in `index.html`
- [x] T026 [P] Add or update **repository root** `README.md` with `npm run dev`, `npm run build`, `npm run preview`, and pointer to `specs/001-bootstrap-session-timer/quickstart.md` for HTTPS deploy and Safari test matrix
- [x] T027 Execute manual checks in `specs/001-bootstrap-session-timer/quickstart.md` on **Safari macOS** and note gaps (iOS/Simulator as available)

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1** → no prerequisites.
- **Phase 2** → depends on Phase 1; **blocks** US1 and US2.
- **Phase 3 (US1)** → depends on Phase 2.
- **Phase 4 (US2)** → depends on Phase 3 (builds on same reducer and `SessionView.tsx`).
- **Phase 5** → depends on Phases 3–4 for meaningful validation.

### User story dependencies

- **US1 (P1)**: After Phase 2 only.
- **US2 (P2)**: After US1 implementation (same files; verify/harden stop path).

### Parallel opportunities

- **T003 + T004** after T002.
- **T009 + T010** after T008 (both independent of each other).
- **T025 + T026** after T024 (different files).

---

## Parallel example (after Phase 2)

```bash
# US1 UI components that touch different files before final integration:
# T014 EntryView.tsx
# T015 TimerDisplay.tsx
# (T016 SessionView.tsx integrates them—run after T014–T015)
```

---

## Implementation strategy

### MVP first (User Story 1 only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (T014–T021).
3. **Stop and validate** US1 against [spec.md](./spec.md).
4. Deploy `dist/` (Vite output at repository root) to an HTTPS static host when ready.

### Incremental delivery

1. Setup + Foundational → stable shell.
2. Add US1 → demo full workout loop + persistence.
3. Add US2 → confirm early stop edge cases.
4. Polish → icons, PWA metadata, documentation, Safari matrix.

---

## Notes

- **Task count**: **27** total (Setup 4, Foundational 9, US1 8, US2 2, Polish 4).
- **Per story**: US1 = 8 tasks, US2 = 2 tasks (US2 mostly verification on shared code).
- Every task includes an explicit file path for LLM execution.
- Commit after each task or logical group; re-run `/speckit.analyze` before `/speckit.implement` if desired.
