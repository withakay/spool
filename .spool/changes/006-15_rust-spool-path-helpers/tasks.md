# Tasks for: 006-15_rust-spool-path-helpers

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

---

## Wave 1

- **Depends On**: None

### Task 1.1: Design the `spool-core` path helper API
- **Files**: spool-rs/crates/spool-core/src
- **Dependencies**: None
- **Action**:
  - Choose between `SpoolPaths` struct vs free functions
  - Define the minimum API surface used by CLI/core
- **Verify**: cargo test -p spool-core
- **Done When**: API is implemented and covered by unit tests
- **Updated At**: 2026-01-29
- **Status**: [x] complete

### Task 1.2: Migrate spool-core call sites
- **Files**: spool-rs/crates/spool-core/src/create, spool-rs/crates/spool-core/src/list.rs
- **Dependencies**: Task 1.1
- **Action**:
  - Replace repeated `.join("changes")` / `.join("modules")` patterns
  - Replace string-based path formatting with `PathBuf::join`
- **Verify**: cargo test -p spool-core
- **Done When**: core code uses the helper and behavior is unchanged
- **Updated At**: 2026-01-29
- **Status**: [x] complete

---

## Wave 2

- **Depends On**: Wave 1

### Task 2.1: Migrate spool-cli to the shared path helper
- **Files**: spool-rs/crates/spool-cli/src/main.rs
- **Dependencies**: Task 1.1
- **Action**:
  - Replace `.spool/` path construction with the `spool-core` helper
  - Remove duplicated path logic in validate and tasks
- **Verify**: cargo test -p spool-cli
- **Done When**: CLI uses shared path helpers; tests pass
- **Updated At**: 2026-01-29
- **Status**: [x] complete
