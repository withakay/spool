# Tasks for: 011-01_cascading-config-merging

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential (or parallel if tool supports)
- **Created**: 2026-01-31

---

## Wave 1
- **Depends On**: None

### Task 1.1: Implement cascading config loading + merge
- **Files**: `spool-rs/crates/spool-core/src/config/mod.rs`, `spool-rs/crates/spool-core/src/spool_dir/mod.rs`
- **Dependencies**: None
- **Action**:
  - Add `.spool.json` support for repo-level config.
  - Add merged project config loader supporting `spool.json`, `.spool.json`, `<spoolDir>/config.json`, and `$PROJECT_DIR/config.json`.
  - Implement deterministic deep-merge semantics.
- **Verify**: `make test`
- **Done When**: Tests cover precedence and merge behavior; existing callers unchanged
- **Updated At**: 2026-01-31
- **Status**: [x] completed

### Task 1.2: Align docs/specs with implemented behavior
- **Files**: `.spool/specs/cli-agent-config/spec.md`, `docs/config.md`, `README.md`
- **Dependencies**: Task 1.1
- **Action**:
  - Ensure docs/specs reference `<spoolDir>/config.json` (not YAML) and describe cascading order.
- **Verify**: `spool validate --strict`
- **Done When**: Docs/specs no longer claim YAML agent config
- **Updated At**: 2026-01-31
- **Status**: [x] completed

---

## Checkpoints

### Checkpoint: Review Implementation
- **Type**: checkpoint (requires human approval)
- **Dependencies**: All Wave 1 tasks
- **Action**: Review the implementation before proceeding
- **Done When**: User confirms implementation is correct
- **Updated At**: 2026-01-31
- **Status**: [x] completed
