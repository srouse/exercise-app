---
description: "Task list for 001-exercise-app feature implementation"
---

# Tasks: Exercise app — Auth0 + PostgreSQL + Next.js

**Input**: Design documents from `specs/001-exercise-app/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: Not requested in spec — no automated test tasks. Validate with manual Safari matrix (quickstart.md).

**Organization**: Phases follow spec user story priorities. Auth (US4) comes first as it blocks all other stories. Each phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task serves

---

## Phase 1: Setup

**Purpose**: Scaffold Next.js project, remove old Vite scaffold, configure Netlify and CSS tokens.

- [x] T001 Remove Vite scaffold files at repo root: delete `src/`, `index.html`, `vite.config.ts`, `tsconfig.node.json`, and uninstall Vite/React-DOM devDeps from `package.json`
- [x] T002 Scaffold Next.js 14 App Router at repo root: run `npx create-next-app@latest . --typescript --app --no-src-dir --no-tailwind` and accept all prompts; verify `app/`, `next.config.ts`, `tsconfig.json` are created
- [x] T003 Install runtime dependencies: `npm install @auth0/nextjs-auth0 drizzle-orm postgres` in repo root
- [x] T004 Install dev dependencies: `npm install -D drizzle-kit @netlify/plugin-nextjs`
- [x] T005 [P] Create `netlify.toml` at repo root with `[[plugins]] package = "@netlify/plugin-nextjs"` and `[build] command = "npm run build" publish = ".next"`
- [x] T006 [P] Create `styles/tokens-primitive.css` with numeric/spatial scale variables: `--space-1` through `--space-6`, `--radius-sm/md/lg`, `--font-size-step-1` through `--step-5`, raw color ramps (`--color-neutral-900`, etc.)
- [x] T007 [P] Create `styles/tokens-semantic.css` with product-meaning variables: `--color-surface`, `--color-text`, `--color-accent`, `--color-alarm`, `--font-timer`, `--touch-target-min` (min 72px for Principle I), `--layout-max-width`, `--shadow-focus`
- [x] T008 Create `app/layout.tsx` as root layout: import both CSS token files and `globals.css`; add `<html lang="en">`, centered max-width column via `--layout-max-width`; leave auth provider placeholder for Phase 3

**Checkpoint**: `npm run dev` starts Next.js at localhost with token CSS loading

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, Drizzle client, typed query helpers, and shared types. MUST complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T009 Create `lib/db/client.ts`: import `postgres` from `'postgres'`; export `const sql = postgres(process.env.NETLIFY_DATABASE_URL!, { ssl: 'require' })`; export `const db = drizzle(sql)`
- [x] T010 [P] Create `lib/db/schema.ts` with all four Drizzle table definitions using `drizzle-orm/pg-core`:
  - `users`: `id uuid pk default gen_random_uuid()`, `auth0Sub text unique not null`, `email text`, `createdAt timestamptz default now()`
  - `workoutSessions`: `id uuid pk`, `userId uuid fk→users.id`, `status text` (`active`|`ended`), `startedAt timestamptz`, `endedAt timestamptz nullable`, `updatedAt timestamptz`
  - `exerciseRecords`: `id uuid pk`, `sessionId uuid fk→workoutSessions.id cascade`, `label text not null`, `recordedAt timestamptz`
  - `restIntervals`: `id uuid pk`, `sessionId uuid fk→workoutSessions.id cascade`, `plannedDurationMs int not null`, `startedAt timestamptz not null`, `endedAt timestamptz nullable`, `outcome text nullable` (`completed`|`cancelled`)
- [x] T011 Create `drizzle.config.ts` at repo root: set `schema: './lib/db/schema.ts'`, `out: './migrations'`, `dialect: 'postgresql'`, `dbCredentials: { url: process.env.NETLIFY_DATABASE_URL! }`
- [x] T012 Run `npx drizzle-kit generate` to produce initial SQL migration files in `migrations/`; review generated SQL against data-model.md before proceeding
- [x] T013 Run `npx drizzle-kit migrate` to apply schema to Neon database; verify four tables exist in Neon console
- [x] T014 [P] Create `lib/db/queries/users.ts`: export `upsertUser(auth0Sub: string, email?: string): Promise<User>` — INSERT … ON CONFLICT (auth0_sub) DO UPDATE SET email; return upserted row
- [x] T015 [P] Create `lib/db/queries/sessions.ts`: export `listSessions(userId)`, `getSession(id, userId)`, `createSession(userId)`, `endSession(id, userId)` — `endSession` sets `status='ended'` and `endedAt=now()`; `createSession` checks for existing active session and throws if one exists
- [x] T016 [P] Create `lib/db/queries/rests.ts`: export `createRest(sessionId, plannedDurationMs, startedAt)`, `endRest(id, sessionId, outcome, endedAt)`
- [x] T017 [P] Create `lib/db/queries/exercises.ts`: export `createExercise(sessionId, label, recordedAt?)`
- [x] T018 [P] Create `lib/sessionTypes.ts`: export TypeScript interfaces `WorkoutSession`, `ExerciseRecord`, `RestInterval`, `SessionStatus = 'active' | 'ended'`, `RestOutcome = 'completed' | 'cancelled'`; derive from Drizzle inferred types where possible

**Checkpoint**: DB tables exist in Neon; query helpers compile without errors

---

## Phase 3: User Story 4 — Sign in (Priority: P1)

**Goal**: Auth0 login gate before any workout data is accessible. All other stories depend on this.

**Independent Test**: Open app — redirected to Auth0 login. Complete login — land on home screen with no errors. Open incognito — redirected again. Sign out — session cleared.

- [x] T019 Create `lib/auth0.ts` with `Auth0Client` singleton (v4 API); middleware at `middleware.ts` handles `/auth/*` routes automatically (login, logout, callback, me)
- [x] T020 Create `middleware.ts` at repo root: delegates to `auth0.middleware(request)` from `@auth0/nextjs-auth0/server`
- [x] T021 Update `app/layout.tsx` to wrap children with `Auth0Provider` from `@auth0/nextjs-auth0/client`; enables `useUser()` hook in client components
- [x] T022 [P] Verify `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL` are set in `.env`; confirm Auth0 dashboard has `APP_BASE_URL/auth/callback` in Allowed Callback URLs and `APP_BASE_URL` in Allowed Logout URLs (note: v4 uses `/auth/callback` not `/api/auth/callback`)
- [x] T023 [P] Create `app/api/health/route.ts`: `export async function GET() { return Response.json({ ok: true }) }` — no auth required

**Checkpoint**: `npm run dev` → visiting `/` redirects to Auth0 → after login, returns to app without errors

---

## Phase 4: User Story 1 — Home screen: session list (Priority: P1) 🎯 MVP

**Goal**: Signed-in user sees all their sessions sorted newest-first; can tap any row or press New.

**Independent Test**: Sign in. Home screen shows empty list + New button. Press New → session created → enter workout view. Return home → one session listed as active. Press New again → 409 handled with clear message. Create a second session (end first manually) → both listed in order, statuses distinguished.

### API routes

- [x] T024 Create `app/api/sessions/route.ts`:
  - `GET`: call `getSession()` from auth0, upsert user via `upsertUser()`, call `listSessions(userId)` sorted `startedAt DESC`, return JSON array
  - `POST`: upsert user, call `createSession(userId)` — if active session exists catch error and return `Response.json({ error: 'active_session_exists', sessionId }, { status: 409 })`; on success return 201 with new session JSON
- [x] T025 Create `app/api/sessions/[id]/route.ts`:
  - `GET`: fetch session + exercises + rests for authenticated user; return 404 if not found or wrong user
  - `PATCH`: accept `{ status: 'ended' }`, call `endSession(id, userId)`, return updated session

### UI components

- [x] T026 [P] Create `components/SessionListItem/index.tsx`: client component receiving a `WorkoutSession`; display start date formatted as `"MMM D, YYYY · h:mm a"`; show status badge (`Active` in accent color, `Ended` in muted); entire row is a `<Link href="/session/[id]">` with min-height `var(--touch-target-min)` (Principle I)
- [x] T027 [P] Create `components/SessionList/index.tsx`: receives `sessions: WorkoutSession[]`; renders empty state ("No sessions yet") + New button when empty; renders list of `<SessionListItem>` when non-empty; New button triggers POST `/api/sessions` then `router.push('/session/[id]')`; handles 409 by showing "You have an active session" with link to it

### Page

- [x] T028 Update `app/page.tsx` as async server component: call `getSession()` for auth, fetch sessions from DB via `listSessions()`, pass to `<SessionList>`; redirect to `/auth/login` if no auth session

**Checkpoint**: Home screen shows session list, New button works, rows link to correct session

---

## Phase 5: User Story 5 — Server records (Priority: P1)

**Goal**: Every session, exercise, and rest interval is durably stored in Postgres with correct timestamps and outcomes.

**Independent Test**: Start a session. Record two exercises (different labels). Run two rest legs (one to completion, one stopped early). Query Neon console — confirm `workout_sessions`, `exercise_records`, `rest_intervals` rows exist with correct `outcome` and timestamps.

### API routes

- [x] T029 Create `app/api/sessions/[id]/exercises/route.ts`: `POST` — validate auth + session ownership; accept `{ label: string, recorded_at?: string }`; validate `label` max 200 chars; call `createExercise()`; return 201
- [x] T030 Create `app/api/sessions/[id]/rests/route.ts`: `POST` — validate auth + session ownership + session is active; accept `{ planned_duration_ms: number, started_at?: string }`; validate `planned_duration_ms > 0` and `<= 3600000`; call `createRest()`; return 201 with rest interval JSON (client needs `id` for subsequent PATCH)
- [x] T031 Create `app/api/sessions/[id]/rests/[rid]/route.ts`: `PATCH` — validate auth + session ownership; accept `{ outcome: 'completed' | 'cancelled', ended_at?: string }`; call `endRest()`; return 200

### Detail view

- [x] T032 [P] Create `components/SessionDetail/index.tsx`: receives session with embedded exercises and rest intervals; renders chronological list of events (exercise label + time, rest duration + outcome badge); all text large enough for at-distance reading (Principle I)
- [x] T033 Create `app/session/[id]/page.tsx`: async server component; fetch session + children via `GET /api/sessions/[id]`; if `session.status === 'active'` render `<SessionView session={session} />`; if `ended` render `<SessionDetail session={session} />`; return 404 if not found

**Checkpoint**: After a workout, Neon console shows all rows; SessionDetail renders exercise + rest history

---

## Phase 6: User Story 2 — Rest loop: timer, alarm, Done (Priority: P1)

**Goal**: Inside an active session, user can start a rest countdown, see alarm fire, tap Done, and repeat.

**Independent Test**: Enter an active session. Tap Start Rest (1 min preset). Countdown visible at arm's length from a laid-flat phone. Let it run to zero — alarm: full-screen flash + audio beep repeating. Tap Done — alarm clears, session ready for next rest. Reload mid-rest — session state restored. End session — return to home screen.

### Client state machine

- [x] T034 Create `hooks/useWorkoutSession.ts`: manages state `{ phase: 'exercise_idle' | 'rest_running' | 'rest_alarm', restId?: string, startedAt?: number, plannedMs?: number }`; actions: `startRest(plannedMs)`, `triggerAlarm()`, `dismissAlarm()`, `stopRest()`; `startRest` calls `POST /api/sessions/[id]/rests` and stores returned `restId`; `dismissAlarm` calls `PATCH /api/sessions/[id]/rests/[rid]` with `outcome=completed`

### Alarm audio

- [x] T035 Create `lib/alarmSound.ts`: export `playAlarmBeep()` using Web Audio API (`AudioContext`, `OscillatorNode`, short 200ms tone at 880Hz); export `startAlarmLoop(onTick)` using `setInterval` every 2000ms; export `stopAlarmLoop()`; guard against autoplay policy — only call after first user gesture has occurred in session

### UI components

- [x] T036 [P] Create `components/TimerDisplay/index.tsx`: client component receiving `remainingMs: number`; formats as `M:SS`; font size `var(--font-timer)` (large step); color shifts to `var(--color-alarm)` at 0; MUST be readable at arm's length (Principle I)
- [x] T037 Create `components/SessionView/index.tsx`: client component; uses `useWorkoutSession`; renders:
  - **exercise_idle phase**: large **Start Rest** button (fixed 60 000 ms — no duration selection), exercise label input + **Log Exercise** button, **End Session** button; all min-height `var(--touch-target-min)`
  - **rest_running phase**: `<TimerDisplay>`, large **Stop** button (dominant, Principle I)
  - **rest_alarm phase**: full-surface alarm overlay (`background: var(--color-alarm)`), large **Done** button; start alarm loop on mount, stop on unmount

### Exercise logging

- [x] T038 Add exercise logging to `components/SessionView/index.tsx`: single text input for exercise label (cleared after submit); **Log Exercise** button calls `POST /api/sessions/[id]/exercises`; show brief confirmation then clear input; button min-height `var(--touch-target-min)` (Principle I)

### Session end

- [x] T039 Add **End Session** action in `components/SessionView/index.tsx`: calls `PATCH /api/sessions/[id]` with `{ status: 'ended' }`; on success `router.push('/')` to return to home screen

### Reduced motion

- [x] T040 [P] Add `@media (prefers-reduced-motion: reduce)` rule in `styles/tokens-semantic.css`: when alarm phase is active, disable flash animation; instead use sustained high-contrast `--color-alarm` background (no rapid flicker) — ensure alarm is still obvious at distance

**Checkpoint**: Full rest loop works end-to-end; alarm fires and repeats; Done clears it; End Session returns to home

---

## Phase 7: User Story 3 — Stop rest timer early (Priority: P2)

**Goal**: User can cancel an in-progress countdown before it completes; no alarm fires for that run.

**Independent Test**: Start rest countdown. Tap Stop before zero. Confirm: countdown ends immediately, no alarm fires, no audio plays, session is in `exercise_idle` phase ready for next action.

- [x] T041 Add `stopRest()` action in `hooks/useWorkoutSession.ts`: cancel any running alarm interval immediately; call `PATCH /api/sessions/[id]/rests/[rid]` with `outcome=cancelled` and current timestamp as `ended_at`; transition phase to `exercise_idle`
- [x] T042 Verify **Stop** button in `components/SessionView/index.tsx` calls `stopRest()` and that no alarm audio is triggered when stop precedes zero; confirm `rest_intervals.outcome = 'cancelled'` in Neon after stopping

**Checkpoint**: Stop works without alarm; cancelled rest has correct DB record

---

## Phase 8: Polish & Cross-Cutting

**Purpose**: PWA, accessibility, error states, deployment.

- [x] T043 [P] Update `public/manifest.webmanifest`: set `name`, `short_name`, `display: "standalone"`, `start_url: "/"`, `background_color`, `theme_color`; verify 192px and 512px icons exist in `public/icons/`
- [x] T044 [P] Add loading skeleton to `app/page.tsx` for session list using Next.js `loading.tsx` convention (`app/loading.tsx`): large placeholder rows matching `--touch-target-min` height
- [x] T045 [P] Add error boundary for `app/session/[id]/page.tsx` using Next.js `error.tsx` (`app/session/[id]/error.tsx`): show "Session not found" with link back to home
- [x] T046 Add network error toast to `components/SessionView/index.tsx`: if any API call fails during a rest, show unobtrusive retry banner without interrupting the timer display (do not block Principle I controls)
- [ ] T047 Run manual Safari checks per [quickstart.md](./quickstart.md): sign in/out on Safari macOS, sign in/out on Safari iOS (device or Simulator), Add to Home Screen, standalone launch, timer, alarm audio after first gesture, multi-device session restore
- [ ] T048 Set all env vars in Netlify dashboard (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL` = production URL, `NETLIFY_DATABASE_URL`); trigger production deploy and run manual check matrix against production URL

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US4 — Sign in)**: Depends on Phase 2 — BLOCKS all other stories
- **Phase 4 (US1 — Home screen)**: Depends on Phase 3
- **Phase 5 (US5 — Server records API)**: Depends on Phase 3; can run in parallel with Phase 4
- **Phase 6 (US2 — Rest loop)**: Depends on Phases 4 + 5
- **Phase 7 (US3 — Stop early)**: Depends on Phase 6
- **Phase 8 (Polish)**: Depends on Phases 6 + 7

### User Story Dependencies

- **US4 (Sign in)**: Must be first — no workout data is accessible without auth
- **US1 (Home screen)**: Depends on US4; independent of US2/US5
- **US5 (Server records)**: Depends on US4; can proceed in parallel with US1
- **US2 (Rest loop)**: Depends on US1 (session routing) + US5 (rest/exercise API routes)
- **US3 (Stop early)**: Depends on US2 (adds stop to existing timer hook)

### Parallel Opportunities

Within Phase 1: T005, T006, T007 in parallel after T001-T004
Within Phase 2: T014, T015, T016, T017, T018 in parallel after T013
Within Phase 4: T026, T027 in parallel after T024
Within Phase 5: T029, T030, T031, T032 in parallel
Within Phase 6: T035, T036, T040 in parallel; T037 after T034+T036

---

## Implementation Strategy

### MVP (US4 + US1 only — Phases 1-4)

1. Phase 1: Setup Next.js + Netlify
2. Phase 2: DB schema + query helpers
3. Phase 3: Auth0 sign-in gate
4. Phase 4: Home screen with session list + New button
5. **STOP and VALIDATE**: sign in, see list, create session, see it in list
6. Deploy to Netlify preview URL

### Full Delivery Order

1. Phases 1-4 → MVP: auth + session list
2. Phase 5 → server records (API routes without UI)
3. Phase 6 → rest loop UI (timer + alarm + exercise logging)
4. Phase 7 → stop early
5. Phase 8 → polish + production deploy

### Total Tasks: 48

| Phase | Tasks | User Story |
|-------|-------|------------|
| Phase 1 — Setup | T001–T008 | — |
| Phase 2 — Foundational | T009–T018 | — |
| Phase 3 | T019–T023 | US4 (Sign in) |
| Phase 4 | T024–T028 | US1 (Home screen) |
| Phase 5 | T029–T033 | US5 (Server records) |
| Phase 6 | T034–T040 | US2 (Rest loop) |
| Phase 7 | T041–T042 | US3 (Stop early) |
| Phase 8 | T043–T048 | Polish |
