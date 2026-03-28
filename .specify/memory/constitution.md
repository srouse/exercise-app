<!--
Sync Impact Report
Version change: 2.2.0 → 3.0.0
Modified principles:
  - III. No external runtime services → Trusted identity and owned data — minimal external services;
    Auth0 (OIDC) + application-owned API + PostgreSQL are now permitted; unnecessary third-party
    services (analytics, tracking, social, ads) remain prohibited.
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ Constitution Check bullet updated
  - .specify/templates/spec-template.md — ✅ Constitution summary line updated
Follow-up TODOs: None
-->

# Daily Exercise Time Constitution

## Core Principles

### I. Rest intervals first: laid flat, readable from afar

Workouts are organized as **sessions**. Initially the product MUST support **one active workout
session at a time**, composed of a **series of rest timers** between exercise efforts so pacing
stays honest: long enough between movements that you **do not rush**, short enough that you **do
not drift** and rest too long. Later scope (for example multiple saved sessions or history) MUST
be added only in ways that preserve this core loop unless the constitution is amended.

Each rest timer MUST be trivial to **start**, **follow while it runs**, and **stop early** or
**let finish**. The UI MUST assume the phone is often **lying on a surface** (bench, floor,
stand)—not held up to the face—so the user can **glance from a distance**. Primary state and
controls MUST be **extremely large and easy to hit** for that kind of use: what matters now MUST
read clearly **from afar**, and actions MUST not depend on small targets or dense layout.
**Starting** MUST take **minimal effort** from the main surface; **stopping or cancelling** MUST
remain a **dominant, easy control**. When a timer **completes**, the app MUST provide **strong
visible completion feedback** obvious **at a distance**. A **short audible cue** SHOULD be
available using **web-platform or bundled audio only** (no third-party audio services). The whole
flow MUST assume **mid-workout**—hands and attention often elsewhere—so **distance readability and
coarse, forgiving interaction** outweigh information density. Features that obscure this
rest-timer job require explicit constitution amendment. **Rationale:** Rest is easy to misjudge;
the app supports disciplined pacing without becoming a full program designer or social tracker.

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

### IV. Minimal React, single-page shell

The product MUST ship as a **single-page application** with a stable top-level document: one
primary view surface (no multi-page traditional navigation) unless the constitution is amended.
**React** MAY be used **minimally**—only as much as needed for that SPA (no sprawling component
trees or extra UI frameworks without Complexity Tracking justification). Styling MUST remain
straightforward: **vanilla CSS** (global or per-component files) unless a tiny build step is
unavoidable; avoid CSS-in-JS stacks and heavy design systems. **Rationale:** A stable SPA with
light React matches "simple but structured"; keeps the codebase small and approachable.

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

- **Stack:** Minimal React SPA (Principle IV); vanilla CSS; JavaScript/TypeScript as needed for
  React; a small bundler (for example Vite) is permitted to produce deployable static assets.
- **Identity:** Auth0 (or equivalent OIDC provider) for user authentication (Principle III).
- **Data:** Application-owned API (Fastify) + PostgreSQL for server-side persistence (Principle III);
  client-side cache (localStorage/IndexedDB) is optional for resilience only — server is source of truth.
- **Hosting:** Static hosting of SPA assets + HTTPS API hosting are permitted; HTTPS required so
  install/PWA behaviors work reliably on Apple platforms.
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

**Version**: 3.0.0 | **Ratified**: 2026-03-23 | **Last Amended**: 2026-03-28
