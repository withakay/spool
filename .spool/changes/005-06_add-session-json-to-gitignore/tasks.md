# Tasks for: 005-06_add-session-json-to-gitignore

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Prefer the tasks CLI to drive status updates and pick work

```bash
spool tasks status 005-06_add-session-json-to-gitignore
spool tasks next 005-06_add-session-json-to-gitignore
spool tasks start 005-06_add-session-json-to-gitignore 1.1
spool tasks complete 005-06_add-session-json-to-gitignore 1.1
spool tasks show 005-06_add-session-json-to-gitignore
```

---

## Wave 1

- **Depends On**: None

### Task 1.1: Update init to ignore session state
- **Files**: `spool-rs/crates/spool-core/src/installers/mod.rs`, `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: None
- **Action**:
  - Ensure `spool init` creates or updates the repository root `.gitignore` to include `.spool/session.json`.
  - Keep the update idempotent and preserve existing `.gitignore` content.
- **Verify**: `make test`
- **Done When**: Running `spool init` results in `.gitignore` containing `.spool/session.json` without duplicates
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.2: Add regression tests
- **Files**: `spool-rs/crates/spool-cli/tests/`, `spool-rs/crates/spool-core/src/installers/mod.rs`
- **Dependencies**: Task 1.1
- **Action**:
  - Add tests covering:
    - `.gitignore` creation when missing
    - no-op when `.gitignore` already contains `.spool/session.json`
    - no duplicate insertion on repeated init
- **Verify**: `make test`
- **Done When**: Tests fail without the change and pass with it
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

---

## Wave 2

- **Depends On**: Wave 1

### Task 2.1: Validate and update docs as needed
- **Files**: `.spool/specs/cli-init/spec.md`, `README.md`
- **Dependencies**: Task 1.1, Task 1.2
- **Action**:
  - Confirm the behavior matches the `cli-init` delta spec.
  - Update any user-facing docs mentioning init-time generated files if needed.
- **Verify**: `spool validate 005-06_add-session-json-to-gitignore --strict`
- **Done When**: Validation passes in strict mode
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

---

## Wave 3 (Checkpoint)

- **Depends On**: Wave 2

### Task 3.1: Human review of proposal before implementation
- **Type**: checkpoint (requires human approval before proceeding)
- **Files**: `.spool/changes/005-06_add-session-json-to-gitignore/proposal.md`, `.spool/changes/005-06_add-session-json-to-gitignore/specs/cli-init/spec.md`
- **Dependencies**: Task 2.1
- **Action**:
  - Review scope and ensure `.gitignore` modification policy is acceptable.
- **Done When**: Proposal is approved for implementation
- **Updated At**: 2026-01-31
- **Status**: [ ] pending
