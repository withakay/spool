# Tasks for: 008-03_support-in-progress-status

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Prefer the tasks CLI to drive status updates and pick work

```bash
spool tasks status 008-03_support-in-progress-status
spool tasks next 008-03_support-in-progress-status
spool tasks start 008-03_support-in-progress-status 1.1
spool tasks complete 008-03_support-in-progress-status 1.1
```

______________________________________________________________________

## Wave 1: Parser Changes

- **Depends On**: None

### Task 1.1: Add in-progress checkbox constant and parsing

- **Files**: `spool-rs/crates/spool-workflow/src/tasks.rs`
- **Dependencies**: None
- **Action**:
  - Add constant for in-progress marker: `const CHECKBOX_IN_PROGRESS: &str = "- [~]";`
  - Update `TaskStatus` enum (if not already present) to include `InProgress` variant
  - Modify the checkbox parsing logic to recognize `- [~]` as `TaskStatus::InProgress`
  - Update `parse_checkbox_line()` or equivalent function to handle the tilde marker
- **Verify**: `cargo test -p spool-workflow`
- **Done When**: Parser correctly identifies `- [~]` as in-progress status
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 1.2: Add checkbox format serialization for in-progress

- **Files**: `spool-rs/crates/spool-workflow/src/tasks.rs`
- **Dependencies**: Task 1.1
- **Action**:
  - Update the checkbox format writer to serialize `TaskStatus::InProgress` as `- [~]`
  - Ensure round-trip consistency: parse → modify → write preserves the format
- **Verify**: `cargo test -p spool-workflow`
- **Done When**: Writing a task with in-progress status produces `- [~]` marker
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2: Unit Tests for Parser

- **Depends On**: Wave 1

### Task 2.1: Write failing test for in-progress checkbox parsing

- **Files**: `spool-rs/crates/spool-workflow/tests/tasks_parsing.rs`
- **Dependencies**: None
- **Action**:
  - Write test case: `test_parse_checkbox_in_progress`
  - Input: `- [~] Task in progress`
  - Expected: Task with status `InProgress` and description "Task in progress"
- **Verify**: `cargo test -p spool-workflow test_parse_checkbox_in_progress`
- **Done When**: Test passes after Wave 1 implementation
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 2.2: Write test for mixed checkbox status parsing

- **Files**: `spool-rs/crates/spool-workflow/tests/tasks_parsing.rs`
- **Dependencies**: Task 2.1
- **Action**:
  - Write test case: `test_parse_checkbox_mixed_statuses`
  - Input: Multi-line with `- [ ]`, `- [~]`, `- [x]` tasks
  - Expected: Correct status for each task
- **Verify**: `cargo test -p spool-workflow test_parse_checkbox_mixed`
- **Done When**: Test passes with all three statuses correctly identified
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 2.3: Write test for checkbox serialization round-trip

- **Files**: `spool-rs/crates/spool-workflow/tests/tasks_parsing.rs`
- **Dependencies**: Task 2.1
- **Action**:
  - Write test case: `test_checkbox_roundtrip_in_progress`
  - Parse tasks, modify one to in-progress, serialize, re-parse
  - Verify status is preserved through round-trip
- **Verify**: `cargo test -p spool-workflow test_checkbox_roundtrip`
- **Done When**: Round-trip preserves in-progress status
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3: CLI Command Updates

- **Depends On**: Wave 2

### Task 3.1: Remove error for checkbox format in start command

- **Files**: `spool-rs/crates/spool-cli/src/commands/tasks.rs`
- **Dependencies**: None
- **Action**:
  - Locate the error message at line ~227: "Checkbox-only tasks.md does not support in-progress"
  - Remove or replace the error branch
  - Allow the start command to proceed for checkbox format
- **Verify**: `cargo build -p spool-cli`
- **Done When**: `spool tasks start` no longer errors on checkbox format
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 3.2: Implement single in-progress validation for checkbox

- **Files**: `spool-rs/crates/spool-cli/src/commands/tasks.rs`
- **Dependencies**: Task 3.1
- **Action**:
  - Before starting a checkbox task, check if any task already has `- [~]` marker
  - If found, return error: "Task N is already in-progress. Complete it first or use a different task."
  - Include the in-progress task's description in the error message
- **Verify**: `cargo test -p spool-cli`
- **Done When**: Starting a task when another is in-progress returns clear error
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 3.3: Update start command to write in-progress marker

- **Files**: `spool-rs/crates/spool-cli/src/commands/tasks.rs`
- **Dependencies**: Task 3.2
- **Action**:
  - When starting a checkbox task, update `- [ ]` to `- [~]`
  - Use the existing task update/write logic
  - Print confirmation: "Started task N: <description>"
- **Verify**: `spool tasks start <change-id> <task-id>` on a test checkbox file
- **Done When**: Task marker changes from `- [ ]` to `- [~]` in file
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 3.4: Update next command for checkbox in-progress awareness

- **Files**: `spool-rs/crates/spool-cli/src/commands/tasks.rs`
- **Dependencies**: Task 3.3
- **Action**:
  - When finding next task in checkbox format, check for existing in-progress
  - If in-progress task exists, display: "Current task: <description>"
  - If no in-progress, find first pending and offer to start it
- **Verify**: `spool tasks next <change-id>` on checkbox file with in-progress task
- **Done When**: Next command shows current in-progress task or offers to start next pending
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 4: Integration Tests

- **Depends On**: Wave 3

### Task 4.1: Write integration test for checkbox start workflow

- **Files**: `spool-rs/crates/spool-cli/tests/tasks_integration.rs` (create if needed)
- **Dependencies**: None
- **Action**:
  - Create a test checkbox tasks.md file
  - Run `spool tasks start` via CLI
  - Verify file is updated with `- [~]` marker
  - Verify output message
- **Verify**: `cargo test -p spool-cli tasks_integration`
- **Done When**: Integration test passes for start workflow
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 4.2: Write integration test for single in-progress constraint

- **Files**: `spool-rs/crates/spool-cli/tests/tasks_integration.rs`
- **Dependencies**: Task 4.1
- **Action**:
  - Create checkbox file with one `- [~]` task
  - Attempt to start another task
  - Verify error is returned
- **Verify**: `cargo test -p spool-cli`
- **Done When**: Test confirms constraint is enforced
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 5: Final Verification

- **Depends On**: Wave 4

### Task 5.1: Run full test suite

- **Files**: All
- **Dependencies**: None
- **Action**:
  - Run `cargo test --workspace`
  - Run `cargo clippy --workspace`
  - Ensure no regressions
- **Verify**: `cargo test --workspace && cargo clippy --workspace`
- **Done When**: All tests pass, no clippy warnings
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 5.2: Manual end-to-end verification

- **Files**: None (manual test)
- **Dependencies**: Task 5.1
- **Action**:
  - Create a test change with checkbox tasks.md
  - Run `spool tasks start` - verify marker changes to `- [~]`
  - Run `spool tasks next` - verify shows current in-progress
  - Run `spool tasks complete` - verify marker changes to `- [x]`
  - Try starting another task while one is in-progress - verify error
- **Verify**: Manual verification
- **Done When**: All manual test scenarios pass
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified
- `[-] shelved` - Intentionally not-to-be-done (reversible)
