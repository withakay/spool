# Tasks for: <!-- CHANGE_ID -->

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential (or parallel if tool supports)
- **Template**: Enhanced task format with waves, verification, and status tracking

---

## Wave 1

### Task 1.1: <!-- Task Name -->
- **Files**: <!-- file paths, e.g., src/db/schema/user.ts -->
- **Dependencies**: None
- **Action**:
  <!-- Describe what should be implemented -->
- **Verify**: <!-- command to verify, e.g., bun run test:unit -->
- **Done When**: <!-- acceptance criteria, e.g., tests pass -->
- **Status**: [ ] pending

### Task 1.2: <!-- Task Name -->
- **Files**: <!-- file paths -->
- **Dependencies**: Task 1.1
- **Action**:
  <!-- Describe what should be implemented -->
- **Verify**: <!-- verification command -->
- **Done When**: <!-- acceptance criteria -->
- **Status**: [ ] pending

---

## Wave 2 (after Wave 1 complete)

### Task 2.1: <!-- Task Name -->
- **Files**: <!-- file paths -->
- **Dependencies**: Task 1.1, Task 1.2
- **Action**:
  <!-- Describe what should be implemented -->
- **Verify**: <!-- verification command -->
- **Done When**: <!-- acceptance criteria -->
- **Status**: [ ] pending

---

## Wave 3 (Checkpoint)

### Task 3.1: <!-- Review or decision point -->
- **Type**: checkpoint (requires human approval before proceeding)
- **Files**: <!-- relevant files for review -->
- **Dependencies**: Task 2.1
- **Action**:
  <!-- Describe what should be reviewed or approved -->
- **Done When**: <!-- when human confirms -->
- **Status**: [ ] pending

---

## Task Status Legend
- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified

## Wave Guidelines
- Waves group related tasks that can be executed in parallel
- Task dependencies must be complete before starting dependent tasks
- "after Wave X complete" indicates wave-level dependencies
- Checkpoint waves require human approval before proceeding

## Task Structure
Each task should include:
- **ID**: Unique identifier (wave.task)
- **Files**: Which files this task affects
- **Dependencies**: Other tasks that must complete first (or "None")
- **Action**: What to implement or do
- **Verify**: Command to verify completion (optional but recommended)
- **Done When**: Acceptance criteria
- **Status**: Current status (pending/in-progress/complete)
