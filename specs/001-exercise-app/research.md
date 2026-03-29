# Research: Bootstrap session timer (Phase 0)

**Feature**: `001-exercise-app`  
**Date**: 2026-03-23

## 1. Build tool and React shape

**Decision**: **Vite** (current stable) + **React** + **TypeScript**.

**Rationale**: Fast dev server, first-class SPA defaults, static `dist/` output for any HTTPS host,
minimal config, aligns with constitution “small bundler permitted.”

**Alternatives considered**: Create React App (maintenance mode); Next.js (unnecessary SSR; adds
complexity vs constitution simplicity).

## 2. Design tokens (CSS variables only)

**Decision**: Two-layer tokens in global CSS:

- **Primitives**: numeric/spatial scale only—`--space-1`…`--space-6`, `--radius-sm/md/lg`,
  `--font-size-step-1`…`--step-5`, raw color ramps if needed (`--color-neutral-900`, etc.).
- **Semantics**: product meaning—`--color-surface`, `--color-text`, `--color-accent`,
  `--color-alarm`, `--font-timer` (maps to a large step), `--touch-target-min` (min height/width
  for controls), `--layout-max-width`, `--shadow-focus`.

Components reference **only semantic** variables in rules; primitives are referenced only inside
the token definition files. That avoids “inventing” ad hoc values in feature CSS.

**Rationale**: Constitution requires vanilla CSS, no heavy design system; tokens satisfy “never make
up values in implementation” without a component library.

**Alternatives considered**: Tailwind (constitution prefers vanilla CSS files); CSS-in-JS (explicitly
avoided in constitution).

## 3. Static hosting and HTTPS (install / PWA)

**Decision**: **Any** static host with **HTTPS** and correct **headers** is sufficient. **Vercel**
is a recommended default for the team (preview URLs on every branch, zero config for Vite static
build) but **not mandatory**. Equivalents: **Netlify**, **Cloudflare Pages**, **GitHub Pages**
(with HTTPS).

**Rationale**: Constitution allows static asset hosting only; installability (Safari “Add to Home
Screen,” macOS **Add to Dock** / web app where supported) requires a **secure context** and valid
**manifest**; not tied to a specific vendor.

**Alternatives considered**: Local-only file URLs—**rejected** for install/PWA validation (not a
secure context in many cases). **ngrok** or **Cloudflare tunnel** for quick HTTPS demos without
a full deploy.

## 4. Testing “Apple desktop” and mobile

**Decision**:

- **macOS**: Primary check is **Safari** on a real Mac—windowed and, where OS supports it,
  **installed web app** (Dock). Validate layout (centered column), tap targets with trackpad,
  localStorage, and alarm audio after user gesture.
- **iOS**: **Safari** on device or **Simulator** for layout, Add to Home Screen, standalone
  display, and storage behavior.
- **Automation**: Optional **Playwright** later for smoke tests in WebKit; not required for MVP
  per spec (manual is default). **Vite preview** over LAN + device Safari is acceptable for dev.

**Rationale**: There is no substitute for WebKit behavior (storage quotas, audio policies,
standalone mode) on real targets.

**Alternatives considered**: “Desktop app” as Electron—**out of scope** (constitution targets
installable **web** on Apple platforms, not a separate native shell for this feature).

## 5. Default rest duration and duplicate “start rest”

**Decision**:

- **Default rest length**: **1 minute**; visible presets **0.1 / 1 / 2** minutes (6 s / 60 s / 120 s)
  on session screen (simple buttons or chips).
- **Timer already running**: **Ignore** a second “start rest” tap (no parallel countdowns); optional
  subtle feedback (planning detail).

**Rationale**: Matches spec “planning decides”; keeps state machine simple.

## 6. Alarm audio on iOS / Safari

**Decision**: Use **short bundled audio** (small asset) or **Web Audio API** short beeps; **play one
beep** when the rest countdown completes, **then repeat** the **same** beep **every ~2 seconds**
until the user dismisses the alarm (phase leaves **`rest_alarm`**). Schedule repeats from
**`useWorkoutSession`** (or equivalent) with **`setInterval`**, clearing the interval on cleanup.
Call audio only after **user gesture** has occurred at least once in the session (or on first tap
anywhere) to satisfy autoplay policies. Visual alarm remains **primary**; sound is supplementary.

**Rationale**: Constitution allows bundled/web-platform audio only; mobile Safari blocks autoplay
without gesture context. Repeating cues help users who step away without requiring a single
long tone.

## 7. Reduced motion

**Decision**: If `prefers-reduced-motion: reduce`, replace rapid **flash** with a **sustained
high-contrast full-surface state** until Done (still obvious at distance).

**Rationale**: Spec edge case + inclusive default.

## Resolved clarifications (no NEEDS CLARIFICATION left in plan)

All items above were unknowns in Technical Context; they are now decided for implementation
planning.

---

## 8. Auth0 + Next.js (2026-03-28, amended 2026-03-28)

**Decision**: **Auth0 Universal Login** with **Authorization Code Flow** (Regular Web Application)
using **`@auth0/nextjs-auth0`** SDK. The SDK handles the callback route, session cookie, and token
refresh automatically. Client secret stays server-side in Netlify environment variables — never
exposed to the browser.

**Rationale**: `.env` is provisioned for a Regular Web App (has `AUTH0_CLIENT_SECRET`). The
`@auth0/nextjs-auth0` SDK is purpose-built for this flow with Next.js App Router and requires
minimal wiring. Tokens never touch the browser; session is a secure HTTP-only cookie.

**Alternatives considered**: **SPA + PKCE** (`@auth0/auth0-spa-js`) — rejected because the
provisioned Auth0 app type is Regular Web App (client secret present); SPA flow would require
re-registering the Auth0 app. **Clerk**, **Supabase Auth** — rejected, Auth0 explicitly chosen.

## 9. Full-stack framework and API (2026-03-28, amended 2026-03-28)

**Decision**: **Next.js 14+ App Router** replaces the Vite SPA + Fastify server split. API routes
live in `app/api/` alongside the UI. **Drizzle ORM** + **`postgres`** driver retained for Neon
Postgres access; **Drizzle Kit** for migrations. Deployed to **Netlify** via
`@netlify/plugin-nextjs` (zero-config for App Router).

**Rationale**: One codebase, one deploy target — no separate Fastify process to run or host.
Netlify Functions handle Next.js API routes natively. Auth0 Regular Web App flow integrates
cleanly via `@auth0/nextjs-auth0` route handler at `app/api/auth/[auth0]/route.ts`. Drizzle ORM
is framework-agnostic and works identically in Next.js Route Handlers.

**Alternatives considered**: **Vite SPA + Fastify** (prior plan) — rejected because it required a
separate server process, separate deploy target, and manual JWT validation; Regular Web App auth
flow is a poor fit for a pure SPA. **Next.js + Vercel** — valid but Netlify is already
provisioned with Neon integration.

## 10. PostgreSQL schema shape

**Decision**: Normalized tables `users`, `workout_sessions`, `exercise_records`, `rest_intervals` (see
[data-model.md](./data-model.md)).

**Rationale**: Clear FK relationships; easy queries for “session with all rests and exercises.”

## 11. Offline / sync strategy (v1)

**Decision**: **Online-first**: mutations require successful API unless tasks introduce a **small
retry queue**. **NEEDS CLARIFICATION** for v2: full offline queue vs blocking modal.

**Rationale**: Smallest slice to ship server truth; spec edge case allows planning to choose.

## 12. Where exercise is captured in UX

**Decision**: **NEEDS UX task**: e.g. after **Done** on alarm or before **Start rest**, user enters
**short label** (one field). Planning leaves exact screen to tasks to preserve Principle I (large
touch targets).

**Rationale**: Spec FR-010 requires persistence semantics first; minimal UI can follow.
