# session-log.rule

## Trigger

When the user says: checkpoint

---

## Goal

Run end-of-session workflow:

1. Sync implementation with SpecKit spec (/spec/\*.md)
2. Commit changes
3. Append + roll session log (/session-log.md)

---

## Steps

### 1. Detect Spec Drift (SpecKit)

Compare current session work against:

/spec/\*.md

Set:

- spec_status = "none" | "updated"

Rules:

- New feature → updated
- Behavior change → updated
- New edge case → updated
- Refactor only → none

---

### 2. Update SpecKit spec (if needed)

If spec_status = "updated":

- Update existing files in /spec/\*.md
- Do NOT create new spec files unless explicitly required
- Do NOT rewrite entire documents
- Only update:
  - Functional Requirements (FR-\*)
  - Acceptance Scenarios
  - Edge Cases

Track:

- spec_refs (e.g. FR-026–FR-030)
- spec_notes (what changed and why)

---

### 3. Git commit + push

If ANY of the following changed:

- /spec/\*.md
- code files
- /session-log.md

Then perform a full Git check-in:

---

#### 3.1 Stage changes

Stage all relevant files:

git add -A

---

#### 3.2 Generate commit message

Build a structured commit message:

type(scope): summary

Details:

- SpecKit updates (if any)
- Features added
- Fixes

Type rules:

- feat → new functionality
- fix → bug fixes
- chore → spec/log only

Scope rules:

- electron-app
- spec
- session
- or combined if needed

Example:

feat(electron-app): add context menu and gitignore filtering

Details:

- Added right-click context menu (open, reveal)
- Implemented .gitignore-based filtering
- Updated SpecKit requirements FR-026–FR-030
- Logged session changes

---

#### 3.3 Commit

git commit -m "<generated message>"

---

#### 3.4 Push

git push

---

#### 3.5 Safeguards

- If no changes → do nothing
- If commit fails → do not retry blindly
- If push fails → report failure

---

Set:

committed = true | false

### 4. Write session log entry

Append to:

/session-log.md

---

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

---

### 5. Roll log

- Keep last 10 entries in /session-log.md
- Move older entries to:

/session-archive/YYYY-MM.md

---

### 6. Prevent duplication

If the latest entry matches current session:

- UPDATE instead of append

---

## Output

Return only:

{
"spec_updated": true | false,
"committed": true | false,
"session_logged": true
}
