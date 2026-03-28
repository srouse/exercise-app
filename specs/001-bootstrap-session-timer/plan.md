# Implementation Plan: Bootstrap session timer — Auth0 + PostgreSQL + server-backed workouts

**Branch**: `001-bootstrap-session-timer` | **Date**: 2026-03-28 | **Spec**: [../app-base/spec.md](../app-base/spec.md)  
**Input**: Feature specification — evolve the Vite rest-timer SPA to use **Auth0** for identity and **PostgreSQL** for durable workout session storage (sessions, exercises, rest intervals).

## Summary

Add **Auth0 PKCE** sign-in to the existing **React + Vite** SPA and a **Fastify + Drizzle ORM** Node API backed by **PostgreSQL** so each workout session — including exercise labels and rest intervals (planned duration, start/end, outcome) — is a **durable, user-scoped server record**. The in-gym UX (large timer, dominant stop, repeating alarm, phone-first centered column) is **unchanged in intent**. Principle III is violated by design until the constitution is amended — see **Complexity Tracking**.

## Technical Context

**Language/Version**: TypeScript (strict) — client and server; Node.js 20+  
**Primary Dependencies**: React 19, Vite (SPA); `@auth0/auth0-spa-js` + Auth0 Universal Login (PKCE); **Fastify** HTTP API; **Drizzle ORM** + **`postgres`** driver; **Drizzle Kit** for migrations; `jose` or `jwks-rsa` for JWT validation  
**Storage**: **PostgreSQL 15+** (primary, server truth); optional `localStorage`/IndexedDB client cache for resilience (v1: online-first)  
**Testing**: **Vitest** + **supertest** for API unit/integration; manual Safari matrix for SPA; optional Playwright for WebKit smoke  
**Target Platform**: HTTPS-deployed SPA + API; Safari/iOS installable web (Add to Home Screen)  
**Project Type**: Monorepo-style — existing `src/` SPA + new `server/` API service  
**Performance Goals**: Sub-200ms p95 for session CRUD on mid-tier connection; timer UI 60 fps feel unchanged  
**Constraints**: Auth0 PKCE public client; API validates JWT via JWKS (no raw tokens in DB); CORS locked to app origin(s); one active session per user enforced in app logic  
**Scale/Scope**: Single user's workouts; moderate row volume per session; session list pagination deferred

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|--------|
| Rest timer / distance UX (I) | **Pass** | Timer, alarm, stop, Done controls unchanged; server sync must not block coarse UX — optimistic or fast paths required. |
| Simplicity (II) | **Pass with scope** | Auth + DB add surface area; YAGNI enforced — no entities beyond `users`, `workout_sessions`, `exercise_records`, `rest_intervals`. |
| No external runtime services (III) | **FAIL (documented)** | **Auth0** + **PostgreSQL** intentionally violate current Principle III text. Constitution MUST be amended before release. |
| Minimal React + vanilla CSS (IV) | **Pass** | Auth0 SDK is thin integration; keep SPA + CSS token system; no extra UI frameworks. |
| Apple installable web (V) | **Pass** | HTTPS + manifest maintained; Auth0 callback URLs must include production/preview/standalone origins. |
| Phone-first stage (VI) | **Pass** | Centered column unchanged; sign-in is secondary surface. |

**Post-design re-check**: Principle **III** remains **FAIL** until `.specify/memory/constitution.md` is formally amended.

## Project Structure

### Documentation (this feature)

```text
specs/001-bootstrap-session-timer/
├── plan.md              # This file
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)

specs/app-base/          # Phase 0–1 artifacts (authoritative, pre-existing)
├── spec.md              # Feature spec (this plan's source)
├── research.md          # Phase 0: decisions resolved
├── data-model.md        # Phase 1: Postgres entities + state transitions
├── quickstart.md        # Phase 1: dev setup guide
└── contracts/
    ├── README.md
    ├── openapi.yaml     # API contract v0.1
    └── storage-schema.json  # Legacy client cache — shrink/remove when API sync ships
```

### Source Code (repository root)

```text
src/                          # Existing Vite SPA
├── auth/                     # Auth0 provider, useAuth hook, token helpers
├── api/                      # API client (fetch wrapper + typed endpoints)
├── components/
│   ├── SessionView/          # Active workout surface (timer, stop, Done — Principle I)
│   └── EntryView/            # New workout / Continue (backed by server state)
├── hooks/
│   └── useWorkoutSession.ts  # Core state machine (exercise_idle → rest_running → rest_alarm)
├── styles/
│   ├── tokens.css            # Semantic + primitive CSS variables
│   └── *.css                 # Per-component CSS
└── main.tsx

server/
├── package.json              # Separate package (or root workspace — tasks to decide)
├── src/
│   ├── index.ts              # Fastify bootstrap (register plugins, routes, CORS)
│   ├── auth/
│   │   └── jwtVerify.ts      # JWKS fetch + JWT validate (iss, aud, sub)
│   ├── routes/
│   │   ├── sessions.ts       # POST /v1/sessions, GET /v1/sessions, PATCH /v1/sessions/:id
│   │   ├── exercises.ts      # POST /v1/sessions/:id/exercises
│   │   └── rests.ts          # POST /v1/sessions/:id/rests, PATCH …/:rid
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema (users, workout_sessions, exercise_records, rest_intervals)
│   │   ├── pool.ts           # postgres() connection
│   │   └── queries/          # Typed query helpers per entity
│   └── types/
│       └── index.ts          # Shared response shapes
└── migrations/               # SQL migrations generated by Drizzle Kit
```

**Structure Decision**: `server/` alongside existing `src/` SPA. Shared types may move to `packages/shared` later — not required for this slice.

## Phase 0 — Research (complete)

All decisions resolved in [../app-base/research.md](../app-base/research.md). Key outcomes:

| Decision | Outcome |
|----------|---------|
| Build tool | Vite + React + TypeScript (existing) |
| CSS | Two-layer CSS variables (primitives + semantics); vanilla CSS only |
| Auth | Auth0 Universal Login, PKCE, `@auth0/auth0-spa-js` |
| API framework | **Fastify** |
| ORM / migrations | **Drizzle ORM** + **Drizzle Kit** (`postgres` driver) |
| DB schema | `users`, `workout_sessions`, `exercise_records`, `rest_intervals` |
| Offline strategy v1 | Online-first; mutations require API; retry queue deferred |
| Default rest duration | 1 minute; presets 0.1 / 1 / 2 min |
| Duplicate start-rest | Ignore second tap (no parallel countdowns) |
| Alarm audio | Bundled short sound or Web Audio API beep; one on completion, repeat every ~2 s until Done; audio gated on prior user gesture |
| Reduced motion | Sustained high-contrast full-surface state instead of flash |
| Hosting | Any static HTTPS host (Vercel default); ngrok/tunnel for dev |
| Exercise capture UX | After Done or before Start rest — short label field; exact UX in tasks |

## Phase 1 — Design artifacts (complete)

| Artifact | Location |
|----------|---------|
| Data model | [../app-base/data-model.md](../app-base/data-model.md) |
| API contract (OpenAPI) | [../app-base/contracts/openapi.yaml](../app-base/contracts/openapi.yaml) |
| Contract README | [../app-base/contracts/README.md](../app-base/contracts/README.md) |
| Quickstart | [../app-base/quickstart.md](../app-base/quickstart.md) |

### Key API surface (summary)

```
POST   /v1/sessions                       → new workout (status=active)
GET    /v1/sessions                       → paginated list for current user
GET    /v1/sessions/:id                   → session + children (embed TBD)
PATCH  /v1/sessions/:id                   → { status: "ended" }
POST   /v1/sessions/:id/exercises         → { label, recorded_at? }
POST   /v1/sessions/:id/rests             → { planned_duration_ms, started_at? }
PATCH  /v1/sessions/:id/rests/:rid        → { outcome, ended_at? }
GET    /health                            → liveness (no auth)
```

All mutating and session-loading routes require `Authorization: Bearer <Auth0 access token>`.

### Key data model (summary)

| Table | PK | Notable columns |
|-------|----|-----------------|
| `users` | `uuid` | `auth0_sub` UNIQUE |
| `workout_sessions` | `uuid` | `user_id`, `status` (active/ended), `started_at`, `ended_at` |
| `exercise_records` | `uuid` | `session_id`, `label`, `recorded_at` |
| `rest_intervals` | `uuid` | `session_id`, `planned_duration_ms`, `started_at`, `ended_at`, `outcome` |

## Sync and timestamps

- Server stores **UTC** (`timestamptz`); client displays local time.
- `GET /v1/sessions` with no resumable active session → 404 or empty list → show **New workout** only.
- Client **optimistically** updates UI on rest start/stop; API call fires concurrently; error triggers re-sync or retry toast (exact error UX in tasks).

## Complexity Tracking

> **Constitution Principle III** — intentional deviation pending amendment.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Hosted auth (**Auth0**) | Stable user identity across devices; OIDC standard | Device-only storage cannot satisfy multi-device session restore or shared account model in spec. |
| **PostgreSQL** + API | Durable, queryable workout / exercise / rest history with FK relationships | `localStorage` cannot model multi-device history, server-side backup, or future analytics. |
| Network dependency for writes | Server is source of truth; spec mandates durability | Full offline queue is deferred to v2; blocking modal or optimistic UI with retry is the v1 strategy. |

## Implementation notes for tasks phase

1. **Auth0 setup**: Register SPA application (allowed callbacks, origins, logout URLs including standalone PWA origin); register API audience; configure scopes.
2. **JWT validation**: Validate `iss`, `aud`, `sub` on every protected route; resolve or upsert `users` row on first request per `sub`.
3. **Drizzle schema + migrations**: Define all four tables in `server/src/db/schema.ts`; run `drizzle-kit generate` → review SQL → `drizzle-kit migrate`.
4. **SPA auth wrap**: `<Auth0Provider>` at root; gate `SessionView` on `isAuthenticated`; attach access token to all API calls.
5. **Replace `localStorage` session persistence**: API sync is truth; optional client cache wraps API responses for perceived speed / offline degradation.
6. **Exercise UI**: Minimal single-label input between rest cycles — exact UX component in tasks (Principle I: large target, minimal friction).
7. **PWA compatibility**: Ensure Auth0 allowed callback and logout URLs include deployed standalone origin; service worker must not cache auth redirects.

## Phase 2

Run `/speckit.tasks` → generates `specs/001-bootstrap-session-timer/tasks.md`.
