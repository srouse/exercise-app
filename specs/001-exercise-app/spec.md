# Feature Specification: Session, rest loop, authenticated server persistence, and workout history

**Feature Branch**: `001-bootstrap-session-timer` (evolving)
**Created**: 2026-03-23
**Status**: Draft
**Input**: Evolve the Vite rest-timer SPA toward **Auth0** authentication and **PostgreSQL** so each **full workout session** is stored server-side, including **rest timeouts** (planned duration, start/end, outcome) and **exercises** the user records during that session.

**Product direction**: Primary in-session flow remains **exercise -> start between-exercises wait timer -> alarm -> Done -> next exercise** until **end workout**. The product MUST **identify users** (Auth0) and **persist workout sessions and structured events** in **Postgres** so a session is a **durable record**: not only live UI phase, but **which exercises** were logged and **each rest interval** (timing and outcome). Entry MUST still support **continue vs new workout** semantics at the UX level, backed by **server state** (and optional client cache for resilience -- exact split in planning). See [plan.md](./plan.md).

**Constitution**: All principles in `.specify/memory/constitution.md` are in force. Auth0 + Postgres are explicitly permitted under Principle III (v3.1.0). Principles **I** (laid flat, readable from afar), **II** (YAGNI within approved scope), **IV-VI** (minimal React + vanilla CSS, installable web, phone-first stage) remain binding.

**UI clarity (constitution, not duplicated as a user story):** **Principle I** requires the
product to assume the phone is often **laid flat**, with primary state and controls **extremely
large and easy to hit**, readable **from afar**, **no** reliance on small targets or dense layout
for the rest loop, a **dominant** stop, and completion feedback **obvious at a distance**.
**Principle VI** requires **phone-first** presentation, a **centered** main column on wider
viewports, and usable scaling on tablet/desktop. Implementation MUST satisfy those principles; a
separate "design system" user story is unnecessary.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Home screen: session list, open any session, start new (Priority: P1)

When the signed-in user opens the app they land on a **home screen** that shows their **full
session history** as a list sorted by **most recent first** (date and time of session start).
Each row shows enough to identify the session: date, time, and status (active or ended). An
**active session** is one that has been started but not yet explicitly ended; it MUST be clearly
distinguished from ended sessions in the list. From this screen the user can:

- **Open any session** -- active or ended -- by tapping its row. Entering an active session
resumes the live workout view. Entering an ended session shows its detail (exercises and rest
intervals logged). Both paths use the same tap gesture on the row.
- **Start a new session** with a prominent **New** button. Pressing New creates a fresh session
server-side and immediately opens the active workout view. It does NOT automatically end any
prior session -- old sessions stay in the list in whatever state they were in.

A session remains in the list indefinitely once created. Sessions are **never silently removed**
by starting a new one. Only one session may be **active** at a time; the system MUST enforce
this on the server. The list MUST be readable at a glance from a distance per Principle I --
rows large enough to tap from a laid-flat phone.

**Why this priority**: The session list is the first screen every user sees on every visit.
Getting it right defines the mental model for the whole product -- history is always visible,
every session is accessible, and starting fresh is always one tap away.

**Independent Test**: Sign in; confirm the session list loads. Create two sessions (end the
first, leave the second active). Verify list shows both in descending order with status
distinguished. Tap each row and confirm the correct view opens. Tap **New**, confirm a third
session is created and the list now shows three entries with the newest at the top.

**Acceptance Scenarios**:

1. **Given** the signed-in user opens the app and has **no sessions** yet, **When** the home
  screen loads, **Then** the list is empty, a **New** button is clearly available, and no error
   is shown.
2. **Given** the user has one or more sessions, **When** the home screen loads, **Then** all
  sessions appear sorted **most recent first** by start time, each showing date, time, and
   status (active or ended).
3. **Given** the user has an **active** session in the list, **When** they tap that row, **Then**
  they enter the live workout view for that session and can continue the rest/exercise rhythm.
4. **Given** the user has an **ended** session in the list, **When** they tap that row, **Then**
  they see that session's detail (exercises and rest intervals logged) and can choose to resume
   it per planning.
5. **Given** the user is on the home screen, **When** they tap **New**, **Then** a new session
  is created server-side and they immediately enter the active workout view for that session.
6. **Given** the user taps **New** while a session is already active, **When** the system
  processes the request, **Then** it either prevents creating a second active session with a
   clear message, or requires the user to end the current session first -- the behavior MUST be
   unambiguous and non-destructive (exact choice in planning).
7. **Given** the user has multiple sessions, **When** they return to the home screen after any
  action, **Then** the list reflects current server state (new sessions appear, status changes
   are reflected).

---

### User Story 2 - Rest loop: exercise, timer, alarm, Done, repeat (Priority: P1)

The user is inside an **active workout session**. They **do an exercise** (off-app; the product
does not track exercise content in this story). When they are ready to rest between exercises,
they **start the between-exercises wait timer**. The countdown is **easy to see** with the
device **laid flat** and **readable from a distance**. When the wait **finishes**, an
**alarm** fires -- **strong visible feedback** and **audible cues** where the platform allows:
**one short sound immediately**, then **additional short sounds every couple of seconds** until
the user dismisses the alarm. The user taps **Done** to acknowledge the end of that rest and
move on. They repeat this rhythm until finished, then **end the session** -- which returns them
to the home screen.

**Why this priority**: This is the core pacing loop the product exists for -- honest rest between
movements without rushing or drifting.

**Independent Test**: Enter an active session. Run one full rest cycle (start timer -> alarm ->
**Done**), log at least one exercise per US5, start a second rest; **reload** mid-session and
confirm server restore; **end** the session and confirm return to home screen with the session
listed as ended.

**Acceptance Scenarios**:

1. **Given** the user is in an active session, **When** they start the between-exercises wait
  timer, **Then** a countdown shows remaining time, updates continuously, and is **readable
   from a laid-flat device at arm's length**.
2. **Given** the between-exercises countdown reaches zero, **When** the wait period ends,
  **Then** an **alarm** occurs (highly visible at a glance; **one** audible cue when permitted,
   **then** repeated audible cues **every couple of seconds** until the user taps **Done**).
3. **Given** the alarm is active, **When** the user taps **Done**, **Then** the rest phase clears
  and they can do their next exercise and start another timer in the same session.
4. **Given** the user had an in-progress session, **When** they leave and return (same or another
  device, same account), **Then** session state is **restored from the server** when network and
   auth are healthy.
5. **Given** the user has completed their workout, **When** they choose to **end the session**,
  **Then** the session is marked ended server-side and they return to the home screen where it
   appears listed as ended.

---

### User Story 3 - Stop the rest timer early and continue (Priority: P2)

The user is **partway through** a between-exercises countdown but **feels ready** to move on.
They **stop the timer midstream** with a **large, obvious** control and **proceed to their next
exercise** without waiting for the alarm. Stopping early MUST **not** leave a stuck alarm or
confusing "rest still running" state.

**Why this priority**: Supports real workouts where the planned rest is a ceiling, not a
prison -- secondary to the happy path but important for trust.

**Independent Test**: Start a rest countdown, stop it before zero, confirm no alarm plays for
that cancelled run and the user can immediately continue the session (e.g. start another timer
after the next exercise when ready).

**Acceptance Scenarios**:

1. **Given** a between-exercises countdown is running, **When** the user uses the dominant
  **stop** control, **Then** the countdown ends immediately, no completion alarm fires for that
   run, and the session is ready for the user to continue their workout.
2. **Given** the user stopped early, **When** they finish their next exercise and want another
  rest, **Then** they can start a new between-exercises timer under the same rules as User
   Story 2.

---

### User Story 4 - Sign in to use the app (Priority: P1)

The user **signs in** with **Auth0** (or equivalent branded login experience) before or as part of
starting work with their data. Without a **successful authentication**, they MUST **not** see or
mutate **another user's** server-backed workouts. After sign-in, the client receives a **session**
that authorizes calls to the **application API** that reads/writes **that user's** Postgres rows.

**Why this priority**: Server-side session and exercise capture is meaningless without a stable
**user identity** tied to storage.

**Independent Test**: Sign in, confirm API requests carry valid credentials; sign out, confirm no
access to prior user's data from a fresh browser context.

**Acceptance Scenarios**:

1. **Given** the user is **not** signed in, **When** they attempt to open the main workout
  experience, **Then** they are guided to **sign in** (or see a clear blocked state with sign-in
   path) -- exact copy and routing per planning.
2. **Given** the user completes Auth0 login successfully, **When** the app receives the session
  per planning, **Then** subsequent **authorized** API calls succeed for **that** user's data.
3. **Given** the user signs out (if offered) or session expires, **When** they try to sync or load
  server session, **Then** the product fails safely (re-auth prompt or read-only local state per
   planning) -- no silent cross-user bleed.

---

### User Story 5 - Server records full workout, exercises, and rest intervals (Priority: P1)

Within an **active workout session** stored in **Postgres**, the system records **exercises** the
user associates with the workout (e.g. **name/label** and **when** recorded) and **each rest
interval**: **planned duration**, **start time**, **end time**, and **outcome** (completed via
alarm path vs cancelled via early stop). Together these form an **audit of the workout** that can
be **reloaded** or **listed** after the fact (minimal list/detail UI can be phased; **persistence
semantics** are in scope for this story).

**Why this priority**: This is the core reason for adopting a database -- **durable, queryable
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
  sessions, **Then** they see **their** historical sessions in the home screen list per US1.
6. **Given** the user has logged exercises and rests in a session, **When** they view the **active**
  workout screen or an **ended** session detail, **Then** they see one **chronological** list of
  exercises and rests with **correct** rest copy (completed rests show **planned** duration;
  cancelled rests show **elapsed** time from timestamps) and **visual** distinction between exercise
  and rest rows.

---

### Edge Cases

- **Unauthenticated**: No server writes for another user's rows; session missing/expired MUST yield
clear **re-auth** or error states (User Story 4).
- **Network unavailable mid-session**: The product MUST **fail safely** -- options include **optimistic
UI with retry queue**, **read-only degradation**, or **blocking** sensitive actions; exact
strategy in planning.
- **First run / no sessions**: After sign-in, when there are **no** sessions yet, the user MUST
reach the home screen with an empty list and a clear **New** button -- no error shown (US1 scenario 1).
- **Duplicate active session**: If the user attempts to create a second active session, the system
MUST prevent it unambiguously (US1 scenario 6).
- **Duplicate start-rest**: User attempts to start a countdown while one is already running --
behavior MUST be single and consistent (e.g. ignore; chosen in planning).
- **Accessibility**: Where the platform exposes reduced motion, completion and alarm feedback
SHOULD remain noticeable without relying solely on motion (approach in planning).
- **Exercise picker layout**: Modal or sheet that lists preset exercises MUST remain **scrollable** and
**fully visible** across viewports (no zero-height scroll regions that hide all choices).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST **persist** workout **session state**, **rest intervals**, and
**recorded exercises** in **PostgreSQL** via an **application-owned API**, scoped by **authenticated
user** (Auth0 identity mapped to app user). Server records are the **source of truth** when online.
- **FR-001a**: The product MUST integrate **Auth0** (Regular Web Application flow) for **sign-in**
and MUST pass **authorized session credentials** to the API on all mutating and session-loading
requests per planning.
- **FR-002**: The home screen MUST display all of the user's sessions sorted by **most recent
first**, each showing date, time, and status (active or ended). The list MUST update to reflect
server state on each visit.
- **FR-003**: From the home screen the user MUST be able to **tap any session row** to open that
session -- entering the live workout view if active, or the detail view if ended.
- **FR-004**: From the home screen the user MUST be able to tap **New** to create a new session
server-side and enter the active workout view immediately. Only one session may be active at a
time; the system MUST enforce this and surface a clear message if violated.
- **FR-005**: In an active session, the user MUST be able to **start a between-exercises rest
countdown** with **remaining time** shown and updated until completion or early stop.
- **FR-006**: When a between-exercises countdown **completes**, the product MUST raise an
**alarm**: **highly visible** at a glance from a typical viewing distance with the device on a
surface, plus **short audible feedback** when the platform allows: **one cue at the moment the
rest ends**, **then additional** short cues **approximately every couple of seconds until** the
user **dismisses** that alarm (e.g. **Done**). Repeating cues MUST **stop** when the alarm is
dismissed.
- **FR-007**: After the alarm for a **completed** rest, the user MUST have a clear **Done** action
that dismisses the rest cycle and leaves them ready to continue the same session.
- **FR-008**: The user MUST be able to **stop** an in-progress countdown with a **single, dominant**
control suitable for **laid-flat, at-a-distance** use; stop MUST cancel that run and MUST NOT
fire the completion alarm.
- **FR-009**: The product MUST support **multiple** rest timer runs **in one session** (repeat:
exercise -> rest timer -> alarm or early stop -> Done -> next round).
- **FR-010**: Core loop controls (start rest, stop, Done, primary time display) MUST **not** depend
on small targets or dense layout; usability MUST meet **Principle I** of the constitution.
- **FR-011**: During an active session the user MUST be able to **end the workout session**; after
this action the session is **not** active and the user returns to the home screen. The ended
session remains in the list and is accessible via tap.
- **FR-012**: The user MUST be able to **record an exercise** during an active session (minimal
**label or name** plus **timestamp**; free text vs presets in planning) so each **exercise row**
is **linked** to the **server workout session**.
- **FR-013**: Each **rest interval** MUST be **persisted** with **planned duration**, **start** and
**end** timestamps (wall clock), and **outcome** (`completed` | `cancelled`), linked to the
**workout session**.
- **FR-014**: In **active** and **ended** session views, the product MUST show a **chronological**
**activity list** of exercises and rest intervals from server data. **Rest** display MUST show
**planned duration** for **completed** outcomes and **wall-clock elapsed** (start to end) for
**cancelled** outcomes, with clear status wording. **Exercise** and **rest** rows MUST be
**visually distinct**. The **same** list presentation SHOULD be **reused** across active session
and session detail unless a strong UX reason dictates otherwise.
- **FR-015**: **Log exercise** MUST offer **preset** exercise labels in a **grouped, scrollable**
chooser; the UI MUST list **all** presets without layout failure (e.g. flex/scroll regions MUST not
collapse to zero height).

### Key Entities

- **User (app)**: Maps **Auth0 subject** to internal `user_id`; owns all workout rows.
- **Workout session (server)**: `active` vs `ended` lifecycle; **server id**; `started_at`; only
one active session per user at a time.
- **Exercise record**: User-visible **label**, **recorded_at**, **foreign key** to workout session.
- **Rest interval (server)**: **planned_duration_ms**, **started_at**, **ended_at** (nullable until
finished), **outcome**; FK to workout session.

## Assumptions and Out of Scope

- **Assumption**: **Auth0** tenant (Regular Web Application) and **Neon PostgreSQL** instance are
provisioned; secrets live in `.env`, not in repo.
- **Assumption**: **HTTPS** everywhere; Netlify provides this automatically.
- **Assumption**: Rest duration is **fixed at 1 minute** — no user selection or presets; countdown and alarm behavior unchanged per Principle I.
- **Assumption**: API is implemented as **Next.js App Router route handlers** deployed to Netlify
(see plan.md); Drizzle ORM + Drizzle Kit for Postgres schema and migrations.
- **Constitution**: Principle III amendment (v3.1.0) is in force; no further amendment needed.
- **Out of scope (initial)**: **Social feeds**, **coach marketplace**, **program templates** beyond
simple exercise labels, **native mobile apps** (web-first remains), **third-party wearables**,
**billing**.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the home screen, a user can **tap New**, **start one between-exercises timer**,
**reach alarm**, and tap **Done** using **at most five** deliberate interactions total.
- **SC-002**: With a countdown running, **100%** of participants in a quick check can identify
**remaining time** and the **stop** control at arm's length with the device on a table (binary
pass/fail per participant).
- **SC-003**: When a countdown is allowed to finish, **100%** of participants notice the **alarm**
within **3 seconds** without picking up the device (binary pass/fail per participant).
- **SC-004**: After closing and reopening the product with **healthy network and auth**, the session
list loads and the user can re-enter an in-progress session in **>= 90%** of trial runs.
- **SC-005**: A user with multiple sessions can identify which is active and which are ended at a
glance from the home screen list without reading fine text -- verified by a quick observation test.

