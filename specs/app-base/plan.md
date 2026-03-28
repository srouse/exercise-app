# Implementation Plan: App base — rest loop + Auth0 + PostgreSQL

**Branch**: `001-bootstrap-session-timer` (evolving) | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)

**Input**: App-base specification amended for **Auth0**, **PostgreSQL**, and **server-backed workout
sessions** capturing **exercises** and **rest intervals**.

## Summary

Evolve the existing **Vite + React** rest-timer SPA into a **client + API** system: **Auth0** for
identity, a **Node/TypeScript** (NEEDS final pick) **HTTP API** backed by **Postgres**, and
**migrations** for `users`, `workout_sessions`, `exercise_records`, and `rest_intervals`. The **in-gym
UX** (large timer, dominant stop, alarm pattern, phone-first column) is **unchanged in intent**
(constitution **I**, **IV**, **VI**). **Principle III** is now **compliant** under constitution v3.0.0 —
constitution is amended—see **Complexity Tracking**.

## Technical Context

**Language/Version**: TypeScript (strict) on **client and server**; Node.js **20+**  
**Primary Dependencies**: React 19, Vite (SPA); **Auth0 SPA SDK** + **Auth0** Universal Login; API
with **Express** or **Fastify** (decision: **Fastify** default in research—override if team prefers);
**PostgreSQL** **15+**; **Drizzle ORM** with **`postgres`** (or `pg`) driver per `drizzle-orm` docs  
**Storage**: **PostgreSQL** primary; optional **Redis** for sessions later (**out of scope** v1);
client **IndexedDB/localStorage** optional for cache only  
**Testing**: API **Vitest** + **supertest** (or similar); contract tests against OpenAPI; manual
Safari matrix for SPA; **Playwright** optional  
**Target Platform**: HTTPS-deployed SPA + API; Safari/iOS installable web preserved  
**Project Type**: **Monorepo-style**: `src/` SPA + `server/` (or `api/`) service—exact folder in
**Project Structure**  
**Performance Goals**: Sub-200ms p95 for session CRUD + append event on mid-tier connection;
timer UI 60fps feel unchanged  
**Constraints**: Auth0 **PKCE** public client for SPA; API validates **JWT** (Auth0 JWKS); **no**
raw tokens in Postgres; CORS locked to app origin(s)  
**Scale/Scope**: Single user’s workouts; moderate row volume per session; pagination for **session
list** when UI added

## Constitution Check

*GATE: Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|--------|
| Laid flat, readable from afar (I) | **Pass** | Preserve current timer/alarm/controls; server sync must not block coarse UX (optimistic or fast paths). |
| Simplicity (II) | **Pass with scope** | Auth + DB add surface area; YAGNI—no extra entities beyond user, session, exercise row, rest interval until spec expands. |
| Trusted identity + owned data (III) | **Pass** | **Auth0** + **PostgreSQL** explicitly permitted under constitution v3.0.0. |
| Minimal React + vanilla CSS (IV) | **Pass** | Keep SPA + CSS tokens; Auth0 SDK is thin integration. |
| Apple installable web (V) | **Pass** | HTTPS + manifest; Auth0 callback URLs must include production/preview domains. |
| Phone-first stage (VI) | **Pass** | Same centered column; login is secondary to rest surface. |

**Post-design**: All principles pass under constitution v3.0.0.

## Project Structure

### Documentation (this feature)

```text
specs/app-base/
├── plan.md              # This file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── openapi.yaml     # API contract (v1 draft)
│   └── storage-schema.json  # Legacy client cache (optional); may deprecate
└── tasks.md             # /speckit.tasks
```

### Source Code (repository root) — target

```text
src/                       # existing Vite SPA (+ Auth0 provider, API client)
server/
├── package.json           # or single root workspace—TBD in implementation
├── src/
│   ├── index.ts           # HTTP server bootstrap
│   ├── auth/              # JWT verify (jwks-rsa / jose)
│   ├── routes/            # sessions, exercises, rests
│   ├── db/                # pool, queries, migrations
│   └── types/
└── migrations/            # SQL or ORM migrations

# Alternative: api/ instead of server/ — pick one in tasks phase
```

**Structure Decision**: Add **`server/`** (or **`api/`**) beside existing **`src/`** SPA; shared
**types** may live in `packages/shared` later—**not required** for first slice.

## Complexity Tracking

> No constitution violations — Auth0 and PostgreSQL are permitted under Principle III (v3.0.0).

| Consideration | Decision | Rationale |
|-----------|------------|-------------------------------------|
| Hosted auth (**Auth0**) | Stable identity across devices; industry-standard OIDC for SPA | Device-only storage cannot satisfy **multi-device** session restore or shared account model in spec. |
| **PostgreSQL** + API | Durable **workout**, **exercise**, and **rest interval** history with relations and queries | localStorage cannot model multi-device history, server-side backup, or future analytics without a DB. |
| Network dependency for writes | Server is source of truth | Offline-first is **deferred**; spec allows planning for queue/cache later. |

---

## Phase outputs

| Phase | Artifact | Path |
|-------|----------|------|
| 0 | Research | `/Users/scott.rouse/Workspace/SpecKit/firstOne/firstone/specs/app-base/research.md` |
| 1 | Data model | `/Users/scott.rouse/Workspace/SpecKit/firstOne/firstone/specs/app-base/data-model.md` |
| 1 | API contract | `/Users/scott.rouse/Workspace/SpecKit/firstOne/firstone/specs/app-base/contracts/openapi.yaml` |
| 1 | Contract README | `/Users/scott.rouse/Workspace/SpecKit/firstOne/firstone/specs/app-base/contracts/README.md` |
| 1 | Quickstart | `/Users/scott.rouse/Workspace/SpecKit/firstOne/firstone/specs/app-base/quickstart.md` |

**Phase 2**: `/speckit.tasks` → `tasks.md`.

## Sync, timestamps, and API behavior (high level)

- **Server** stores **UTC** timestamps (`timestamptz`); client may display local time.
- **Create workout session** on explicit **New workout**; return `session_id`.
- **Start rest**: `POST` creates `rest_interval` with `started_at`, `planned_duration_ms`.
- **Stop / Done**: `PATCH` sets `ended_at`, `outcome`.
- **Record exercise**: `POST` append row with `label`, `recorded_at`.
- **Continue**: `GET` latest continuable session for user or `404` → entry state.

Details: [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml).

## Implementation notes (for tasks phase)

1. **Auth0**: Register SPA app, callbacks, API audience; use **PKCE**; lock CORS.
2. **API**: Validate JWT **iss**, **aud**, **sub**; map `sub` → `users.id`.
3. **Migrations**: **Drizzle Kit** (`drizzle-kit generate` / `migrate`) for schema; indexes on
   `(user_id, started_at)` for sessions.
4. **SPA**: Wrap app with auth; gate **SessionView** on authenticated user; replace **localStorage**
   persistence with **API sync** (cache optional).
5. **Exercise UI**: Minimal input (single field + confirm) between rests or on “next exercise”—UX
   detail in tasks.
6. **PWA**: Still valid; ensure **Auth0** allowed logout/callback URLs include **standalone** origin
   if needed.
