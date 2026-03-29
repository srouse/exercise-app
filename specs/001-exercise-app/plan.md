# Implementation Plan: Exercise app — Auth0 + PostgreSQL + server-backed workouts

**Branch**: `001-bootstrap-session-timer` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification — evolve the rest-timer app to use **Auth0** (Regular Web App) and **PostgreSQL** for durable workout session storage, built as a **Next.js App Router** app deployed on **Netlify**.

## Summary

Replace the Vite SPA + Fastify split with a single **Next.js 14+ App Router** codebase deployed to **Netlify** via `@netlify/plugin-nextjs`. The **home screen** (`app/page.tsx`) shows the user's full session history sorted by most recent first — from there they tap any session to open it or tap **New** to create one. Active sessions open the live workout view (timer, stop, Done, alarm). Auth uses **`@auth0/nextjs-auth0`** with the Regular Web App (Authorization Code) flow — tokens stay server-side in HTTP-only cookies. **Drizzle ORM** + **Neon Postgres** handle storage. All constitution principles pass under v3.1.0.

## Technical Context

**Language/Version**: TypeScript (strict); Node.js 20+
**Primary Dependencies**: **Next.js 14+** (App Router); **`@auth0/nextjs-auth0`** (Regular Web App session + callback); **Drizzle ORM** + **`postgres`** driver; **Drizzle Kit** for migrations; React 19
**Storage**: **Neon PostgreSQL** (serverless, pooled) via `NETLIFY_DATABASE_URL`; no client-side cache in v1
**Testing**: Vitest for DB/logic unit tests; manual Safari matrix for UI; optional Playwright
**Target Platform**: Netlify (Next.js adapter); Safari/iOS installable web (Add to Home Screen)
**Project Type**: Single Next.js App Router project — UI pages + API route handlers in one repo
**Performance Goals**: Sub-200ms p95 for session CRUD; timer UI 60 fps feel unchanged
**Constraints**: Auth0 Regular Web App — client secret server-only; session via HTTP-only cookie; one active session per user enforced server-side
**Scale/Scope**: Single user's workouts; moderate row volume per session; session list pagination deferred

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|--------|
| Laid flat, readable from afar (I) | **Pass** | Session list rows and all workout controls must be large and tappable from a laid-flat phone; API calls must not block coarse UX. |
| Simplicity (II) | **Pass with scope** | Session list adds one screen; YAGNI enforced — no pagination, filters, or editing in v1. |
| Trusted identity + owned data (III) | **Pass** | Auth0 + PostgreSQL explicitly permitted by constitution v3.1.0; no analytics or unnecessary third-party services. |
| Minimal React + vanilla CSS (IV) | **Pass** | Next.js App Router uses React; vanilla CSS retained; no extra UI frameworks. |
| Apple installable web (V) | **Pass** | HTTPS via Netlify; manifest maintained; Auth0 callback URLs include production/preview/standalone origins. |
| Phone-first stage (VI) | **Pass** | Centered column; session list rows scaled for phone; tablet/desktop usable. |

**Post-design re-check**: All principles pass under constitution v3.1.0.

## Project Structure

### Documentation (this feature)

```text
specs/001-exercise-app/
├── spec.md
├── plan.md              # This file
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── contracts/
│   ├── README.md
│   ├── openapi.yaml
│   └── storage-schema.json
└── checklists/
    └── requirements.md
```

### Source Code (Next.js App Router)

```text
app/
├── layout.tsx                        # Root layout (UserProvider from @auth0/nextjs-auth0)
├── page.tsx                          # Home screen: session list + New button (US1)
├── session/
│   └── [id]/
│       ├── page.tsx                  # Active workout view: timer, stop, Done (US2/US3)
│       └── detail/
│           └── page.tsx              # Ended session detail: exercises + rest log
└── api/
    ├── auth/
    │   └── [auth0]/
    │       └── route.ts              # @auth0/nextjs-auth0 handler (login, logout, callback, me)
    ├── sessions/
    │   ├── route.ts                  # GET (list sorted by started_at DESC), POST (create)
    │   └── [id]/
    │       ├── route.ts              # GET (session + children), PATCH (end session)
    │       ├── exercises/
    │       │   └── route.ts          # POST (record exercise)
    │       └── rests/
    │           ├── route.ts          # POST (start rest)
    │           └── [rid]/
    │               └── route.ts      # PATCH (complete/cancel rest)
    └── health/
        └── route.ts                  # Liveness probe

components/
├── SessionList/                      # Home screen list + New button (US1)
├── SessionListItem/                  # Single row: date, time, status badge
├── SessionView/                      # Active workout surface (timer, stop, Done)
├── SessionDetail/                    # Ended session detail (exercise + rest log)
└── TimerDisplay/                     # Countdown display (Principle I: large)

hooks/
└── useWorkoutSession.ts              # Client state machine (exercise_idle -> rest_running -> rest_alarm)

lib/
├── db/
│   ├── schema.ts                     # Drizzle schema
│   ├── client.ts                     # Neon postgres() connection
│   └── queries/                      # Typed helpers per entity
└── sessionTypes.ts

styles/
├── tokens-primitive.css
└── tokens-semantic.css

migrations/                           # Drizzle Kit generated SQL
```

**Structure Decision**: Single Next.js project at repo root. No separate `server/` process. Session ID in URL (`/session/[id]`) so any session — active or ended — is directly addressable.

## Phase 0 — Research (complete)

All decisions resolved in [research.md](research.md). Key outcomes:

| Decision | Outcome |
|----------|---------|
| Full-stack framework | **Next.js 14+ App Router** (replaces Vite SPA + Fastify) |
| Auth flow | **Auth0 Regular Web App** — `@auth0/nextjs-auth0`; session cookie; no browser token |
| ORM / migrations | **Drizzle ORM** + **Drizzle Kit** (`postgres` driver, Neon) |
| DB schema | `users`, `workout_sessions`, `exercise_records`, `rest_intervals` |
| Deployment | **Netlify** + `@netlify/plugin-nextjs` |
| CSS | Vanilla CSS with two-layer token system (primitives + semantics) |
| Home screen | Session list sorted `started_at DESC`; New button; tap row to open any session |
| Active session enforcement | One active session per user, enforced server-side on POST /api/sessions |
| Session URL | `/session/[id]` — active opens workout view, ended opens detail view |
| Offline strategy v1 | Online-first; mutations require successful API; retry queue deferred |
| Rest duration | Fixed at 1 minute — no user selection |
| Duplicate start-rest | Ignore second tap (no parallel countdowns) |
| Alarm audio | Bundled sound or Web Audio API beep; one on completion, repeat every ~2 s until Done; gated on prior user gesture |
| Reduced motion | Sustained high-contrast full-surface state instead of flash |
| Exercise capture UX | Short label field after Done or before Start rest — exact UX in tasks |

## Phase 1 — Design artifacts (complete)

| Artifact | Location |
|----------|---------|
| Data model | [data-model.md](data-model.md) |
| API contract (OpenAPI) | [contracts/openapi.yaml](contracts/openapi.yaml) |
| Contract README | [contracts/README.md](contracts/README.md) |
| Quickstart | [quickstart.md](quickstart.md) |

### Key API surface (Next.js route handlers)

```
GET/POST  /api/auth/[auth0]              -> @auth0/nextjs-auth0 (login, logout, callback, me)
GET       /api/sessions                  -> list all sessions for user, sorted started_at DESC
POST      /api/sessions                  -> create session (returns 409 if active session exists)
GET       /api/sessions/:id              -> get session + exercises + rests
PATCH     /api/sessions/:id              -> { status: "ended" }
POST      /api/sessions/:id/exercises    -> { label, recorded_at? }
POST      /api/sessions/:id/rests        -> { planned_duration_ms, started_at? }
PATCH     /api/sessions/:id/rests/:rid   -> { outcome, ended_at? }
GET       /api/health                    -> liveness probe
```

All session/exercise/rest routes read the authenticated user from the Auth0 session cookie — no `Authorization` header required from the browser.

`POST /api/sessions` returns **409 Conflict** if the user already has an active session, with the active session ID in the response so the client can surface a clear message (FR-004).

### Key data model (summary)

| Table | PK | Notable columns |
|-------|----|-----------------|
| `users` | `uuid` | `auth0_sub` UNIQUE |
| `workout_sessions` | `uuid` | `user_id`, `status` (active/ended), `started_at`, `ended_at` |
| `exercise_records` | `uuid` | `session_id`, `label`, `recorded_at` |
| `rest_intervals` | `uuid` | `session_id`, `planned_duration_ms`, `started_at`, `ended_at`, `outcome` |

## Sync and timestamps

- Server stores **UTC** (`timestamptz`); client displays local time.
- `GET /api/sessions` returns all sessions sorted `started_at DESC` — home screen renders the list directly.
- If the list is empty, home screen shows only the **New** button (US1 scenario 1).
- Active session has `status = 'active'` and `ended_at = NULL`; home screen distinguishes this visually.
- Client optimistically updates timer UI; API calls fire concurrently; error triggers retry toast.

## Environment configuration

`.env` provisioned at repo root (gitignored). `@auth0/nextjs-auth0` reads these automatically:

| Variable | Description |
|----------|-------------|
| `AUTH0_DOMAIN` | Auth0 tenant — `dev-ittwoijv.us.auth0.com` |
| `AUTH0_CLIENT_ID` | Regular Web App client ID |
| `AUTH0_CLIENT_SECRET` | Client secret (server-only, never sent to browser) |
| `AUTH0_SECRET` | Session encryption key (`openssl rand -hex 32`) |
| `APP_BASE_URL` | `http://localhost:43111` (local); production URL on deploy |
| `NETLIFY_DATABASE_URL` | Neon Postgres connection string (pooled, `sslmode=require`) |

Auth0 Dashboard must have `APP_BASE_URL/api/auth/callback` in **Allowed Callback URLs** and `APP_BASE_URL` in **Allowed Logout URLs**.

## Complexity Tracking

> No constitution violations — Auth0 + PostgreSQL permitted under Principle III (v3.1.0). Session list adds one screen but is YAGNI-compliant (required for the product to make sense).

| Consideration | Decision | Rationale |
|---------------|----------|-----------|
| Network dependency for writes | Online-first v1; retry queue deferred to v2 | Spec mandates server durability; full offline queue is v2 scope. |
| Existing Vite SPA scaffold | Replaced by Next.js | Vite scaffold was not yet production-integrated; switching now is lower cost than migrating later. |
| Session list pagination | Deferred to v2 | Single user; row volume stays small in v1; add when list grows unwieldy. |

## Implementation notes for tasks phase

1. **Next.js init**: Scaffold Next.js 14 App Router at repo root; install `@auth0/nextjs-auth0`, `drizzle-orm`, `postgres`, `drizzle-kit`, `@netlify/plugin-nextjs`.
2. **Auth0 route**: Add `app/api/auth/[auth0]/route.ts` using `@auth0/nextjs-auth0` handler; wrap root layout with `<UserProvider>`; redirect unauthenticated users to login.
3. **Drizzle schema + migrations**: Define four tables in `lib/db/schema.ts`; run `drizzle-kit generate` -> review SQL -> `drizzle-kit migrate` against Neon.
4. **Home screen** (`app/page.tsx`): Server component — fetch all sessions via `GET /api/sessions`, render `<SessionList>` with rows sorted newest first; each row links to `/session/[id]`; prominent **New** button posts to `POST /api/sessions` then redirects.
5. **Session routing** (`app/session/[id]/page.tsx`): Check session `status` — if `active`, render `<SessionView>` (timer, stop, Done); if `ended`, render `<SessionDetail>` (exercise + rest log).
6. **API route handlers**: Each route reads user via `getSession()` from `@auth0/nextjs-auth0`; upserts `users` row on first request; enforces ownership; `POST /api/sessions` returns 409 if active session exists.
7. **CSS tokens**: Move existing `tokens-primitive.css` / `tokens-semantic.css` into `styles/`; import in root layout; session list rows MUST use `--touch-target-min` (Principle I).
8. **Netlify deploy**: Add `netlify.toml` with `@netlify/plugin-nextjs`; set all env vars in Netlify dashboard.
9. **Exercise UI**: Minimal single-label input — exact UX component in tasks (Principle I: large target, minimal friction).
10. **PWA**: `public/manifest.webmanifest` retained; Auth0 callback/logout URLs must include standalone PWA origin.

## Phase 2

Run `/speckit.tasks` -> generates `specs/001-exercise-app/tasks.md`.
