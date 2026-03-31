# Quickstart: SPA + API + Auth0 + Postgres

**Repo root**: `/Users/scott.rouse/Workspace/exercise-app`

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+ (local Docker or managed)
- **Auth0** tenant (application + API registered)

## Environment (illustrative)

**SPA** (Vite):

- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE` (API identifier)

**API**:

- `DATABASE_URL` (Postgres connection string)
- `AUTH0_ISSUER` (e.g. `https://YOUR_DOMAIN/`)
- `AUTH0_AUDIENCE`

Never commit secrets; use `.env.local` (gitignored).

## Database

```bash
# Example: create DB and apply Drizzle migrations when server package exists
createdb workout_timer
# cd server && npx drizzle-kit migrate   # or npm script wrapping drizzle-kit
```

## Develop

```bash
# Terminal 1 — API (after server scaffold)
# cd server && npm run dev

# Terminal 2 — SPA (existing)
npm run dev
```

Use **HTTPS** or **tunnel** for Auth0 callbacks on real devices (see Auth0 **Allowed Callback URLs**).

## Manual checks

| Check | Notes |
|-------|--------|
| Login / logout | Auth0 universal page; return to app |
| New session | `POST /v1/sessions` creates row |
| In-session flow | Accordion: pick exercise → **Complete** → app chains `POST .../exercises` then `POST .../rests`; no separate “Start rest” / “Log exercise” |
| Stop / Done | **Stop** or alarm **Done** → `PATCH` rest with outcome; returns to catalog |
| Delete session | **Delete** on session screen → `DELETE /api/sessions/[id]` → **204** when allowed (FR-020) |
| Multi-device | Same user, second browser, list/get session |

## Constitution

Principle **III** in `.specify/memory/constitution.md` **conflicts** with this stack until amended;
see [plan.md](./plan.md) **Complexity Tracking**.
