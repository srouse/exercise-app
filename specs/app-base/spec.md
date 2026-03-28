# Feature Specification: Session, rest loop, authenticated server persistence, and workout history

**Feature Branch**: `001-bootstrap-session-timer` (evolving)  
**Created**: 2026-03-23  
**Status**: Draft  
**Input**: Evolve app-base toward **Auth0** authentication and **PostgreSQL** so each **full workout session** is stored server-side, including **rest timeouts** (planned duration, start/end, outcome) and **exercises** the user records during that session.

**Product direction**: Primary in-session flow remains **exercise → start between-exercises wait timer → alarm → Done → next exercise** until **end workout**. The product MUST **identify users** (Auth0) and **persist workout sessions and structured events** in **Postgres** so a session is a **durable record**: not only live UI phase, but **which exercises** were logged and **each rest interval** (timing and outcome). Entry MUST still support **continue vs new workout** semantics at the UX level, backed by **server state** (and optional client cache for resilience—exact split in planning). **Constitution exception (governance):** Current `.specify/memory/constitution.md` **Principle III** forbids hosted auth and remote user data; this spec **intentionally** introduces **Auth0 + Postgres**. **Before release**, the constitution MUST be **amended** (or this scope reverted). Until then, all implementation plans MUST record the violation in **Complexity Tracking** with rationale (see [plan.md](./plan.md)).

**Constitution (still binding where not excepted)**: Principles **I** (laid-flat rest UX), **II** (YAGNI within approved scope), **IV–VI** (minimal React + vanilla CSS, installable web, phone-first stage) remain in force. Principle **III** is **explicitly superseded for this spec** pending formal amendment.

**UI clarity (constitution, not duplicated as a user story):** **Principle I** requires the
product to assume the phone is often **laid flat**, with primary state and controls **extremely
large and easy to hit**, readable **from afar**, **no** reliance on small targets or dense layout
for the rest loop, a **dominant** stop, and completion feedback **obvious at a distance**.
**Principle VI** requires **phone-first** presentation, a **centered** main column on wider
viewports, and usable scaling on tablet/desktop. Implementation MUST satisfy those principles; a
separate “design system” user story is unnecessary.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exercise, then rest, alarm, Done, next exercise (Priority: P1)

The user **starts a workout session**. They **do an exercise** (off-app or in life; the product
does not need to track the exercise content for this story). When they are ready to rest between
exercises, they **start the between-exercises wait timer**. The countdown is **easy to see** with
the device **laid flat** and **readable from a distance**. When the wait **finishes**, an
**alarm** fires—**strong visible feedback** and **audible cues** where the platform allows: **one
short sound immediately**, then **additional short sounds every couple of seconds** until the user
dismisses the alarm (so a distracted user is reminded without picking up the device). The
user taps **Done** (or an equivalent clear primary action) to **acknowledge the end of that rest**
and **move on**, so they can **do the next exercise** and later **start another between-exercises
timer** in the **same session**. They repeat this rhythm until they are **finished working out for
now**, then they **end the workout session** entirely—session is **no longer active**, with
**persisted** device-local state reflecting that the workout was closed out (exact semantics in
planning). Session progress **persists** so leaving and returning does not arbitrarily wipe an
**active** workout when storage is healthy.

**Why this priority**: This is the core pacing loop the product exists for—honest rest between
movements without rushing or drifting—plus a clear **lifecycle** (active session → finished
session → entry again).

**Independent Test**: **Sign in**; open in a **clean** profile or equivalent (no continuable server
session). Run one full rest cycle (start timer → alarm → **Done**), log at least **one exercise** per
User Story 4, start a second rest; **reload** mid-session and confirm **server restore**; **end**,
**resume**, then **new session** and confirm distinct workouts (scenarios **2–9** plus **US3–US4**).

**Acceptance Scenarios**:

1. **Given** there is **no** continuable workout for this user on the server (and no valid local
   cache of one), **When** the signed-in user opens the product, **Then** it loads **without
   error**, the **entry** experience is shown, **Continue** is **not** offered, and **New workout**
   is available.
2. **Given** the user is on the entry experience, **When** they start a new workout session, **Then**
   they enter an active session where they can begin the work/rest rhythm.
3. **Given** an active session after the user has completed a piece of work they treat as an
   exercise, **When** they start the between-exercises wait timer, **Then** a countdown shows
   remaining time and updates until it finishes or is stopped per User Story 2.
4. **Given** the between-exercises countdown reaches zero, **When** the wait period ends,
   **Then** an **alarm** occurs (highly visible at a glance; **one** audible cue when permitted,
   **then** repeated audible cues **every couple of seconds** until the user taps **Done**).
5. **Given** the alarm is active or just presented, **When** the user confirms with **Done**
   (or equivalent), **Then** the rest phase clears and they are in a state to **continue the
   workout** and, after their next exercise, **start another** between-exercises timer in the
   same session.
6. **Given** the user had an in-progress session, **When** they leave and return to the product
   (same or another device, same account), **Then** session state is **restored from the server**
   (and optional cache) when the network and auth are healthy (exact fields and offline behavior per
   planning).
7. **Given** the user has completed their workout for now, **When** they choose to **end the
   workout session** entirely, **Then** the session is **no longer active** and the entry
   experience reflects that they may **start fresh** or **continue** per persisted rules below.
8. **Given** the user **ended the session** but **did so too soon** (they still want that same
   workout), **When** they are on the entry experience and have **not** started a **new** session
   yet, **Then** they can **get back into the same session** (resume that workout) using a clear
   action backed by persisted state.
9. **Given** the user is on the entry experience, **When** they explicitly choose to **start a
   new workout session**, **Then** a **new** session begins and the product MUST make that
   distinct from **continuing** the prior one (prior continuable state is **replaced or archived**
   per planning so the user’s intent—**resume** vs **new workout**—is **unambiguous**).

---

### User Story 2 - Stop the rest timer early and continue (Priority: P2)

The user is **partway through** a between-exercises countdown but **feels ready** to move on.
They **stop the timer midstream** with a **large, obvious** control and **proceed to their next
exercise** without waiting for the alarm. Stopping early MUST **not** leave a stuck alarm or
confusing “rest still running” state.

**Why this priority**: Supports real workouts where the planned rest is a ceiling, not a
prison—secondary to the happy path but important for trust.

**Independent Test**: Start a rest countdown, stop it before zero, confirm no alarm plays for
that cancelled run and the user can immediately continue the session (e.g. start another timer
after the next exercise when ready).

**Acceptance Scenarios**:

1. **Given** a between-exercises countdown is running, **When** the user uses the dominant
   **stop** control, **Then** the countdown ends immediately, no completion alarm fires for that
   run, and the session is ready for the user to continue their workout.
2. **Given** the user stopped early, **When** they finish their next exercise and want another
   rest, **Then** they can start a new between-exercises timer under the same rules as User
   Story 1.

---

### User Story 3 - Sign in to use the app (Priority: P1)

The user **signs in** with **Auth0** (or equivalent branded login experience) before or as part of
starting work with their data. Without a **successful authentication**, they MUST **not** see or
mutate **another user’s** server-backed workouts. After sign-in, the client receives a **session**
that authorizes calls to the **application API** that reads/writes **that user’s** Postgres rows.

**Why this priority**: Server-side session and exercise capture is meaningless without a stable
**user identity** tied to storage.

**Independent Test**: Sign in, confirm API requests carry valid credentials; sign out, confirm no
access to prior user’s data from a fresh browser context.

**Acceptance Scenarios**:

1. **Given** the user is **not** signed in, **When** they attempt to open the main workout
   experience, **Then** they are guided to **sign in** (or see a clear blocked state with sign-in
   path)—exact copy and routing per planning.
2. **Given** the user completes Auth0 login successfully, **When** the app receives tokens per
   planning, **Then** subsequent **authorized** API calls succeed for **that** user’s data.
3. **Given** the user signs out (if offered) or tokens expire, **When** they try to sync or load
   server session, **Then** the product fails safely (re-auth prompt or read-only local state per
   planning)—no silent cross-user bleed.

---

### User Story 4 - Server records full workout, exercises, and rest intervals (Priority: P1)

Within an **active workout session** stored in **Postgres**, the system records **exercises** the
user associates with the workout (e.g. **name/label** and **when** recorded) and **each rest
interval**: **planned duration**, **start time**, **end time**, and **outcome** (completed via
alarm path vs cancelled via early stop). Together these form an **audit of the workout** that can
be **reloaded** or **listed** after the fact (minimal list/detail UI can be phased; **persistence
semantics** are in scope for this story).

**Why this priority**: This is the core reason for adopting a database—**durable, queryable
history** beyond a single browser profile.

**Independent Test**: Complete one workout with at least two logged exercises and two rest legs
(one completed, one stopped early); inspect DB or API and confirm rows match wall-clock behavior.

**Acceptance Scenarios**:

1. **Given** a signed-in user starts a **new workout session** on the server, **When** the session
   is created, **Then** it has a **stable server identifier** and **ownership** tied to that user.
2. **Given** an active session, **When** the user **records an exercise** (label + confirm per
   planning), **Then** a **persisted exercise record** is created **linked to that session** with a
   timestamp.
3. **Given** an active session, **When** a **rest countdown starts**, **Then** a **rest interval**
   record is created with **planned duration** and **start time**; **When** it ends (alarm + Done,
   or Stop), **Then** the record is updated with **end time** and **outcome** (`completed` |
   `cancelled`).
4. **Given** the user **ends** the workout, **When** the session is closed per planning, **Then**
   the server marks the session **finished** and no new rests attach to it without a **new**
   session.
5. **Given** the user returns later on **another device** (same account), **When** they fetch
   sessions, **Then** they see **their** historical sessions per planning (pagination/versioning as
   specified).

---

### Edge Cases

- **Unauthenticated**: No server writes for another user’s rows; token missing/invalid MUST yield
  clear **re-auth** or error states (User Story 3).
- **Network unavailable mid-session**: The product MUST **fail safely**—options include **optimistic
  UI with retry queue**, **read-only degradation**, or **blocking** sensitive actions; exact
  strategy in planning (NEEDS product choice if not decided in research).
- **First run / no continuable session**: After sign-in, when there is **no** resumable server
  session, the user MUST reach **entry** and start with **New workout** without errors (parity
  with prior “empty local” story, now server-backed).
- **Storage unavailable, full, or corrupted (client cache)**: If local cache is used, corrupt cache
  MUST be **discarded** in favor of server truth when possible; exact behavior in planning.
- User attempts to **start a new between-exercises countdown** while one is already running:
  behavior MUST be single and consistent (e.g. ignore, replace, or stop-then-start)—chosen in
  planning.
- **Premature “end session”**: User ends the workout then realizes they are not done; they MUST
  still be able to **resume the same session** from entry **until** they start a **new** session
  (see FR-002, FR-009). Planning defines labels and whether “ended” is soft until **new** replaces
  it.
- **Accessibility**: Where the platform exposes reduced motion, completion and alarm feedback
  SHOULD remain noticeable without relying solely on motion (approach in planning).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST **persist** workout **session state**, **rest intervals**, and
  **recorded exercises** in **PostgreSQL** via an **application-owned API**, scoped by **authenticated
  user** (Auth0 identity mapped to app user). The client MAY use **local cache** (e.g. localStorage
  or IndexedDB) for **offline resilience or performance** but **server records** are the **source
  of truth** when online—exact sync rules in planning.
- **FR-001a**: The product MUST integrate **Auth0** (or documented equivalent) for **sign-in** and
  MUST pass **authorized** credentials to the API on **mutating** and **session-loading** requests
  per planning.
- **FR-002**: From the **entry** experience the user MUST be able to **start a new workout
  session** (a **new** workout) and, when the server (or cache) holds a **continuable** workout
  (**in progress** or **ended but recoverable** until superseded), **continue that same
  session**. Choosing **new** MUST be explicit and MUST **replace or archive** the prior
  continuable state per planning so the user always knows whether they are **resuming** or
  **starting over**.
- **FR-003**: In an active session, after the user is ready following physical work they treat as
  an exercise, they MUST be able to **start a between-exercises rest countdown** with **remaining
  time** shown and updated until completion or early stop.
- **FR-004**: When a between-exercises countdown **completes**, the product MUST raise an
  **alarm**: **highly visible** at a glance from a typical viewing distance with the device on a
  surface, plus **short audible feedback** when the platform allows (constitution-aligned): **one
  cue at the moment the rest ends**, **then** **additional** short cues **approximately every couple
  of seconds** **until** the user **dismisses** that alarm (e.g. **Done**). Repeating cues MUST
  **stop** when the alarm is dismissed or the session leaves that alarm state.
- **FR-005**: After the alarm for a **completed** rest, the user MUST have a clear **Done**
  (or equivalent) action that **dismisses** that rest cycle and leaves them ready to **continue
  the same session** (next exercise, then another rest timer when they choose).
- **FR-006**: The user MUST be able to **stop** an in-progress between-exercises countdown with
  a **single, dominant** control suitable for **laid-flat, at-a-distance** use; that stop MUST
  **cancel** the countdown for that run and MUST **not** fire the completion alarm for that run.
- **FR-007**: The product MUST support **multiple** between-exercises timer runs **in one
  session** over time (repeat: exercise → rest timer → alarm or early stop → Done as applicable →
  next round).
- **FR-008**: Core loop controls (start rest, stop, Done, and primary time display during a run)
  MUST **not** depend on small targets or dense layout; **laid-flat, at-a-distance** usability
  for the rest timer MUST meet **Principle I** (and layout **Principle VI**) of the constitution.
- **FR-009**: During an active session the user MUST be able to **end the workout session**
  entirely when they are done for now (or need to stop); after this action the session is **not**
  active, but persisted data MUST still allow **resume** of **that** workout until **FR-002**
  **new session** supersedes it.
- **FR-010**: The user MUST be able to **record an exercise** during an active session (minimal
  **label or name** plus **timestamp**; free text vs presets in planning) so each **exercise row**
  is **linked** to the **server workout session**.
- **FR-011**: Each **rest interval** MUST be **persisted** with **planned duration**, **start** and
  **end** timestamps (wall clock), and **outcome** (`completed` | `cancelled`), linked to the
  **workout session** (and optionally to the **exercise** that preceded it—relationship in planning).

### Key Entities

- **User (app)**: Maps **Auth0 subject** to internal `user_id`; owns all workout rows.
- **Workout session (server)**: One **current continuable** workout per user at a time for v1 unless
  planning allows multiple actives; **active** vs **ended** lifecycle; **server id**; timestamps.
- **Exercise record**: User-visible **label**, **recorded_at**, **foreign key** to workout session;
  ordering by time for replay/history.
- **Rest interval (server)**: **planned_duration_ms**, **started_at**, **ended_at** (nullable until
  finished), **outcome**; FK to workout session.
- **Between-exercises rest run (client)**: Live UI phase/timer still drives **countdown** and
  **alarm**; on transitions, client **syncs** to create/update **Rest interval** rows per FR-011.

## Assumptions and Out of Scope

- **Assumption**: **Auth0** tenant and **PostgreSQL** instance are provisioned for **non-production**
  and **production**; secrets live in env/config, not in repo.
- **Assumption**: **HTTPS** everywhere for SPA, API, and Auth0 callbacks.
- **Assumption**: Default rest duration and presets remain as in planning (e.g. **0.1 / 1 / 2**
  min); true **countdown** and **alarm** behavior unchanged for Principle I.
- **Assumption**: API uses Node **Fastify** (per plan) and **Drizzle ORM** + **Drizzle Kit** for
  Postgres schema and migrations (see **research.md**).
- **Constitution**: **Principle III** amendment tracks with this spec before production release.
- **Out of scope (initial)**: **Social feeds**, **coach marketplace**, **program templates** beyond
  simple exercise labels, **native mobile apps** (web-first remains), **third-party wearables**,
  **billing** (unless Auth0 plan requires it—document separately).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can **start a session**, **start one between-exercises timer**,
  **reach alarm**, and tap **Done** using **at most five** deliberate interactions total (excluding
  optional duration selection if present).
- **SC-002**: With a countdown running, **100%** of participants in a quick check can identify
  **remaining time** and the **stop** control at arm’s length with the device on a table (binary
  pass/fail per participant).
- **SC-003**: When a countdown is allowed to finish, **100%** of participants notice the **alarm**
  within **3 seconds** without picking up the device (binary pass/fail per participant).
- **SC-004**: After closing and reopening the product with **healthy network and auth**, an
  **in-progress session** is **restored from the server** in **≥ 90%** of trial runs (matrix in
  planning; offline cases scored separately).
- **SC-005**: After the user **ends** a session (prematurely or not), **without** starting a
  **new** session, they can **resume the same workout** from entry in **one** clear action in
  **≥ 90%** of trial runs; after they **start a new session**, a **distinct** new workout is
  evident (no silent merge with the prior session)—verified by a short scripted test matrix in
  planning.
