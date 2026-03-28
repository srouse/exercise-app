# Contracts

## `openapi.yaml`

**HTTP API** between the **React SPA** and the **Node** (or compatible) server. All `/v1/*`
routes require a **Bearer JWT** issued by **Auth0** unless noted (e.g. `/health`).

- **Evolution**: Bump `info.version` and use migration + deprecation notes for breaking changes.
- **Validation**: Implementations SHOULD validate requests/responses against this spec in CI where
  practical.

## `storage-schema.json` (legacy / optional cache)

JSON Schema for a **client-only** snapshot used **before** server-backed persistence or as an
**optional offline cache**. When the API is authoritative, treat this schema as **secondary**—sync
rules live in [plan.md](../plan.md) and [data-model.md](../data-model.md).

## UI state machine

Rest phases (`exercise_idle`, `rest_running`, `rest_alarm`) remain documented in
[data-model.md](../data-model.md) § Client phases; they map to API calls on transitions.
