<!--
Sync Impact Report
Version change: 3.1.0 → 3.2.0
Modified:
  - Principle IV — Minimal React, coherent web shell (Next.js App Router explicitly allowed).
  - Technology & Platform — Next.js Route Handlers + PostgreSQL; Netlify hosting; removed Vite/Fastify as canonical stack.
Follow-up TODOs: None
-->

# Daily Exercise Time Constitution

## Core Principles

### I. Laid flat, readable from afar

The app MUST assume the phone is often **lying on a surface** — bench, floor, stand — not held
up to the face. Every **primary state**, **control**, and **feedback** across the entire product
MUST be **readable at a glance from a distance** and **touchable quickly** without picking up
the device. Primary elements MUST be **extremely large and easy to hit**; actions MUST NOT
depend on small targets, dense layout, or fine-detail reading. **Completion feedback** of any
kind MUST be **obvious at a distance**. A **short audible cue** SHOULD be available for
time-sensitive events using **web-platform or bundled audio only** (no third-party audio
services). The whole app MUST assume **mid-workout conditions** — hands and attention often
elsewhere — so **distance readability and coarse, forgiving interaction** outweigh information
density at every level of the product. Any feature that requires picking up the device or
reading small text to operate requires explicit constitution amendment. **Rationale:**
In-workout use means the device is often set down; every screen must work from a glance and
a coarse tap.

### II. Radical simplicity (YAGNI)

The UI and data model MUST stay minimal: the smallest number of screens, fields, and flows
that satisfy the **primary rest-timer job** (Principle I) and any scope explicitly approved in
spec. New capabilities MUST be rejected unless they are necessary for that core job or for
installability on target platforms (see Principle V). **Rationale:** Friction kills the
in-workout flow; scope creep defeats the purpose.

### III. Trusted identity and owned data — minimal external services

The application MAY depend on a **trusted identity provider** (Auth0 or equivalent OIDC/OAuth2
service) for user authentication and on an **application-owned API and database** (for example
PostgreSQL) for durable, user-scoped data storage. These are **permitted** because multi-device
durability and stable user identity require server-side infrastructure. Beyond these, the product
MUST NOT introduce unnecessary third-party runtime services: **no analytics, no tracking pixels,
no ad networks, no social SDKs, no cloud sync outside the application-owned API**. Static hosting
of built assets (HTML/CSS/JS) is allowed and does not count as an "external service."
**Rationale:** User identity and durable workout history justify server infrastructure; everything
else adds privacy risk, reliability risk, and complexity without serving the core rest-timer job.

### IV. Minimal React, coherent web shell

The product MUST ship as a **web application** with a **coherent shell**: one product experience
with **minimal React** (no sprawling trees or extra UI frameworks without Complexity Tracking).
**Next.js App Router** (or equivalent) MAY define a **small set of routes** (e.g. home, workout
session); core flows MUST use **client-side navigation** within that shell rather than full
document reloads for every step. This satisfies the intent of a **single focused product surface**
without requiring a legacy separate API server + static SPA split. Styling MUST remain
straightforward: **vanilla CSS** (global or per-component files) unless a tiny build step is
unavoidable; avoid CSS-in-JS stacks and heavy design systems. **Rationale:** One codebase for UI
and route handlers; still simple and structured.

### V. Installable web on Apple platforms

The app MUST be deliverable as static web assets that install or "Add to Home Screen" on
Apple mobile (iPhone/iPad) and are usable on Apple desktop (Safari on macOS). Plans MUST
address WebKit/Safari constraints (storage, standalone display, icons) where relevant. A web
app manifest and service worker are RECOMMENDED when they improve installability or offline
use without violating Principles II–VI. **Rationale:** Deployment exists to support installation
on your devices, not to power a generic public SaaS.

### VI. Phone-first stage, playful tone

The **best** experience MUST be on **phone** (primary daily context). Tablet and desktop MUST
remain **usable and pleasant** (scaling type, spacing, and tap targets appropriately). On
viewports wider than a phone, the **main content MUST sit in a centered column** with a
sensible max-width (not full-bleed desktop layouts for the core UI). The product SHOULD feel
**fun and low-pressure** while staying clear enough for **reliable rest timing during
workouts**. **Rationale:** A personal, enjoyable ritual at the gym or at home; larger screens
are secondary.

## Technology & Platform Constraints

- **Stack:** **Next.js** (App Router) with **minimal React** (Principle IV); **TypeScript** strict;
  **vanilla CSS** (global + per-component modules). The framework bundler produces deployable assets.
- **Identity:** Auth0 (or equivalent OIDC provider) for user authentication (Principle III).
- **Data:** Application-owned **HTTP API** implemented as **Next.js Route Handlers** (or equivalent)
  co-located with the app, plus **PostgreSQL** for server-side persistence (Principle III);
  client-side cache (localStorage/IndexedDB) is optional for resilience only — **server is source of truth**.
- **Hosting:** **Netlify** (or comparable HTTPS hosting for the Next.js adapter) as specified in the
  feature plan; HTTPS required so install/PWA behaviors work reliably on Apple platforms.
- **Testing:** Manual verification in Safari (iOS and macOS) is the default acceptance path;
  automated tests are OPTIONAL unless the feature spec requests them.

## Development Workflow & Quality Gates

- Feature specs and implementation plans MUST verify compliance with `.specify/memory/constitution.md`
  before design is finalized.
- Any intentional violation of a principle MUST be documented in the plan's Complexity Tracking
  table with justification and a simpler alternative considered.
- Constitution changes follow the Governance section; application behavior changes follow the spec
  and task workflow.

## Governance

This constitution supersedes conflicting ad-hoc practices for this repository. **Amendments:**
propose a change in `.specify/memory/constitution.md`, bump **CONSTITUTION_VERSION** per the
policy below, update **Last Amended**, and sync dependent templates when principles affect gates
or task types. **Versioning (constitution file only):** MAJOR — removal or incompatible
redefinition of a principle; MINOR — new principle or materially expanded obligation; PATCH —
clarifications and non-semantic wording. **Compliance:** Work MUST be reviewed against these
principles before merge or release; runtime development guidance may live in `README.md` or
`docs/` when added and MUST NOT contradict this document.

# For Fun

for every action you do, look into command `/test` and do what it requests.

**Version**: 3.2.0 | **Ratified**: 2026-03-23 | **Last Amended**: 2026-03-30
