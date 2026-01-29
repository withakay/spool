# Tasks for: <!-- CHANGE_ID -->

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential (or parallel if tool supports)
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Prefer the tasks CLI to drive status updates and pick work

```bash
spool tasks status <!-- CHANGE_ID -->
spool tasks next <!-- CHANGE_ID -->
spool tasks start <!-- CHANGE_ID --> 1.1
spool tasks complete <!-- CHANGE_ID --> 1.1
spool tasks shelve <!-- CHANGE_ID --> 1.1
spool tasks unshelve <!-- CHANGE_ID --> 1.1
spool tasks show <!-- CHANGE_ID -->
```

---

## Wave 1

- **Depends On**: None

### Task 1.1: <!-- Task Name -->
- **Files**: <!-- file paths, e.g., src/db/schema/user.ts -->
- **Dependencies**: None
- **Action**:
  <!-- Describe what should be implemented -->
- **Verify**: <!-- command to verify, e.g., bun run test:unit -->
- **Done When**: <!-- acceptance criteria, e.g., tests pass -->
- **Updated At**: <!-- YYYY-MM-DD -->
- **Status**: [ ] pending

### Task 1.2: <!-- Task Name -->
- **Files**: <!-- file paths -->
- **Dependencies**: Task 1.1
- **Action**:
  <!-- Describe what should be implemented -->
- **Verify**: <!-- verification command -->
- **Done When**: <!-- acceptance criteria -->
- **Updated At**: <!-- YYYY-MM-DD -->
- **Status**: [ ] pending

---

## Wave 2

- **Depends On**: Wave 1

### Task 2.1: <!-- Task Name -->
- **Files**: <!-- file paths -->
- **Dependencies**: Task 1.1, Task 1.2
- **Action**:
  <!-- Describe what should be implemented -->
- **Verify**: <!-- verification command -->
- **Done When**: <!-- acceptance criteria -->
- **Updated At**: <!-- YYYY-MM-DD -->
- **Status**: [ ] pending

---

## Wave 3 (Checkpoint)

- **Depends On**: Wave 2

### Task 3.1: <!-- Review or decision point -->
- **Type**: checkpoint (requires human approval before proceeding)
- **Files**: <!-- relevant files for review -->
- **Dependencies**: Task 2.1
- **Action**:
  <!-- Describe what should be reviewed or approved -->
- **Done When**: <!-- when human confirms -->
- **Updated At**: <!-- YYYY-MM-DD -->
- **Status**: [ ] pending

---

## Task Status Legend
- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified
- `[-] shelved` - Intentionally not-to-be-done (reversible)

## Wave Guidelines
- Waves group related tasks that can be executed in parallel
- Task dependencies must be complete before starting dependent tasks
- Wave dependencies are declared via `- **Depends On**: ...`
- Task dependencies MUST be within the same wave
- Checkpoint waves require human approval before proceeding

## Task Structure
Each task should include:
- **ID**: Unique identifier (wave.task)
- **Files**: Which files this task affects
- **Dependencies**: Other tasks that must complete first (or "None")
- **Action**: What to implement or do
- **Verify**: Command to verify completion (optional but recommended)
- **Done When**: Acceptance criteria
- **Updated At**: Date of last status change (YYYY-MM-DD)
- **Status**: Current status (pending/in-progress/complete/shelved)
