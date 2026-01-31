# Tasks for: 002-08_extract-ralph-into-crate

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential (or parallel if tool supports)
- **Created**: 2026-01-31

---

## Wave 1
- **Depends On**: None

### Task 1.1: Inventory Ralph API and dependencies
- **Files**: `spool-rs/crates/spool-core/src/ralph/`, `spool-rs/crates/spool-cli/`
- **Dependencies**: None
- **Action**:
  - Identify all Ralph entrypoints and call sites (`RalphOptions`, `run_ralph`, state helpers).
  - Identify which `spool-core` modules Ralph depends on today.
  - Decide the new crate name and module layout.
- **Verify**: N/A
- **Done When**: Extraction plan is concrete (crate layout + dependency direction)
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.2: Create `spool-ralph` crate and move source files
- **Files**: `spool-rs/Cargo.toml`, `spool-rs/crates/spool-ralph/`, `spool-rs/crates/spool-core/src/ralph/`
- **Dependencies**: Task 1.1
- **Action**:
  - Add a new workspace crate for Ralph.
  - Move `prompt.rs`, `runner.rs`, `state.rs` into the new crate.
  - Keep public API equivalent (types + functions) so call sites can be updated cleanly.
- **Verify**: `make build`
- **Done When**: The workspace builds with the new crate present
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.3: Update `spool-cli` to use the new crate
- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: Task 1.2
- **Action**:
  - Replace `spool_core::ralph` usage with `spool_ralph` (or equivalent) and keep CLI behavior stable.
- **Verify**: `make test`
- **Done When**: `spool ralph` compiles and runs using the extracted crate
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.4: Move Ralph tests to the new crate
- **Files**: `spool-rs/crates/spool-core/tests/ralph.rs`, `spool-rs/crates/spool-ralph/tests/`
- **Dependencies**: Task 1.3
- **Action**:
  - Relocate/adjust Ralph tests so they compile and validate behavior against the extracted crate.
- **Verify**: `make test`
- **Done When**: Ralph tests pass from their new location
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.5: Remove Ralph module from `spool-core`
- **Files**: `spool-rs/crates/spool-core/src/lib.rs`, `spool-rs/crates/spool-core/src/ralph/`
- **Dependencies**: Task 1.4
- **Action**:
  - Remove `pub mod ralph;` and any remaining Ralph code from `spool-core`.
  - Ensure no stale references remain.
- **Verify**: `make test`
- **Done When**: `spool-core` no longer contains Ralph code and tests still pass
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

---

## Checkpoints

### Checkpoint: Review Implementation
- **Type**: checkpoint (requires human approval)
- **Dependencies**: All Wave 1 tasks
- **Action**: Review the implementation before proceeding
- **Done When**: User confirms implementation is correct
- **Updated At**: 2026-01-31
- **Status**: [ ] pending
