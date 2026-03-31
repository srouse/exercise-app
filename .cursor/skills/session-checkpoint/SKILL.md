---
name: session-checkpoint
description: >-
  End-of-session workflow: SpecKit compare (/spec if present), git add/commit/push,
  append .cursor/rules/session-log.md. On invocation, run steps without questions,
  without narrating steps, and return only the JSON result. Use for end-of-session
  check-in, session log updates, and commit + push.
---

# Session checkpoint

## When this skill runs

Invoke via **@session-checkpoint** or the **/session-checkpoint** command (or equivalent project skill entry). Same workflow applies for an informal “check-in” request when the user clearly wants this skill.

## Execution

- Do **not** ask questions.
- Do **not** explain or narrate steps.
- Execute all steps below **in order**.
- **Return only** the final JSON object in the Output section (no other prose).

---

## Goal

Run end-of-session workflow:

1. Sync implementation with SpecKit spec (`/spec/*.md`) **when that directory exists**
2. Commit changes (when applicable)
3. Append or roll session log (`.cursor/rules/session-log.md`)

### This repository

If there is **no** `/spec` directory, skip SpecKit drift detection and updates; set `spec_status` to `"none"`.

---

## Steps

### 1. Detect Spec Drift (SpecKit)

Compare current session work against:

`/spec/*.md`

Set:

- `spec_status` = `"none"` | `"updated"`

Rules:

- New feature → `updated`
- Behavior change → `updated`
- New edge case → `updated`
- Refactor only → `none`

If `/spec` does not exist, set `spec_status = "none"` and skip to step 3 (or step 4 if nothing to commit).

---

### 2. Update SpecKit spec (if needed)

If `spec_status` = `"updated"`:

- Update existing files in `/spec/*.md`
- Do **not** create new spec files unless explicitly required
- Do **not** rewrite entire documents
- Only update:
  - Functional Requirements (FR-\*)
  - Acceptance Scenarios
  - Edge Cases

Track:

- `spec_refs` (e.g. FR-026–FR-030)
- `spec_notes` (what changed and why)

---

### 3. Git commit + push

If **any** of the following changed:

- `/spec/*.md`
- code files
- `.cursor/rules/session-log.md`

Then perform a full Git check-in:

#### 3.1 Stage changes

Stage all relevant files:

```bash
git add -A
```

#### 3.2 Generate commit message

Build a structured commit message:

`type(scope): summary`

Details:

- SpecKit updates (if any)
- Features added
- Fixes

Type rules:

- `feat` → new functionality
- `fix` → bug fixes
- `chore` → spec/log only

Scope rules (examples for this app):

- `app` — application code
- `decks` — flashcard decks / content
- `spec`
- `session`
- or combined if needed

Example:

```text
feat(app): add deck filter and weekly rollup

Details:

- Added filter UI
- Updated SpecKit requirements FR-026–FR-030
- Logged session changes
```

#### 3.3 Commit

```bash
git commit -m "<generated message>"
```

#### 3.4 Push

```bash
git push
```

#### 3.5 Safeguards

- If no changes → do nothing (commit step skipped)
- If commit fails → do not retry blindly
- If push fails → report failure

Set:

- `committed` = `true` | `false`

---

### 4. Write session log entry

Append to:

`.cursor/rules/session-log.md`

Template:

```markdown
### [{{timestamp}}]

#### Summary

- One or two sentence summary

#### Changes

- Features:
- Fixes:
- Code:

#### Spec Impact

- status: {{spec_status}}
- refs:
  - ...
- notes:
  - ...

#### Decisions

- Why key choices were made

#### Next

- Next steps
```

---

### 5. Prevent duplication

If the latest entry matches the current session:

- **UPDATE** instead of append

---

## Output

Return **only** the JSON object below (no surrounding markdown fence, no other text):

```json
{
  "spec_updated": true,
  "committed": true,
  "session_logged": true
}
```

Each value is a boolean: `spec_updated` is `true` only if `/spec` was updated; `committed` reflects whether a commit was made; `session_logged` is `true` when the session log was written or updated.
