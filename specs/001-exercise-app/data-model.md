# Data model: Auth0 user, workout session, exercises, rest intervals

**Feature**: 001-exercise-app
**Spec**: [spec.md](./spec.md)
**Persistence**: **PostgreSQL** (primary); optional client cache (see [contracts/README.md](./contracts/README.md))

## Server entities (PostgreSQL)

### `users`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | App-generated or DB default |
| `auth0_sub` | `text` UNIQUE NOT NULL | Auth0 `sub` claim |
| `email` | `text` NULL | From Auth0 if available |
| `created_at` | `timestamptz` | |

### `workout_sessions`

One **continuable** active session per user is recommended for v1 (enforce in app logic or partial
unique index where `status = 'active'`).

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | |
| `status` | `text` | `active` \| `ended` |
| `started_at` | `timestamptz` | Session created |
| `ended_at` | `timestamptz` NULL | Set on end workout |
| `updated_at` | `timestamptz` | Touch on any child change (optional) |

### `exercise_records`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `session_id` | `uuid` FK → `workout_sessions.id` ON DELETE CASCADE | |
| `label` | `text` NOT NULL | User-visible name |
| `recorded_at` | `timestamptz` | When user confirmed |

### `rest_intervals`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `session_id` | `uuid` FK → `workout_sessions.id` ON DELETE CASCADE | |
| `planned_duration_ms` | `int` NOT NULL | |
| `started_at` | `timestamptz` NOT NULL | |
| `ended_at` | `timestamptz` NULL | Until stop or Done |
| `outcome` | `text` NULL | `completed` \| `cancelled` when finished |

Optional future: `preceding_exercise_id` FK → `exercise_records.id` if ordering must be explicit.

## Client phases (unchanged UX state machine)

The SPA may keep **in-memory / reducer** phases (`exercise_idle`, `rest_running`, `rest_alarm`) for
Principle I; each transition that matters for history triggers an **API call** to create/update rows
above.

## State transitions (API triggers)

```
POST /sessions                    → new workout_sessions row (status=active)
POST /sessions/:id/exercises      → exercise_records row
POST /sessions/:id/rests        → rest_intervals row (started_at, planned_duration_ms)
PATCH /sessions/:id/rests/:rid → ended_at + outcome
PATCH /sessions/:id             → status=ended, ended_at
```

Exact paths: [contracts/openapi.yaml](./contracts/openapi.yaml).

## Validation

- `planned_duration_ms` > 0; cap e.g. 60 minutes in API.
- `label` max length (e.g. 200 chars).
- All mutating routes require JWT with `sub` matching or creating `users` row.

## Migrations

Implement tables above with **Drizzle schema** (`drizzle-orm/pg-core`) and ship SQL via **Drizzle Kit**
(`drizzle-kit generate` / `migrate`).

## Legacy `localStorage`

`contracts/storage-schema.json` described the **pre-server** client document. It may be **shrunk** to
**cache-only** or **removed** in a later task once API sync ships.
