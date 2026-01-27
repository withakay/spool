# Tasks for: 006-06_port-init-update-installers

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

---

## Wave 1: Filesystem + Marker Editing

### Task 1.1: Implement marker-managed edits
- **Files**: `spool-rs/crates/spool-fs/src/*`
- **Dependencies**: Change `006-02_create-spool-rs-workspace`
- **Action**:
  - Implement marker block detection and replacement
  - Preserve unmanaged content
  - Ensure idempotency
- **Verify**: unit tests
- **Done When**: marker edits match TS on fixtures
- **Status**: [x] done

---

## Wave 2: Template Rendering

### Task 2.1: Embed and render templates
- **Files**: `spool-rs/crates/spool-templates/src/*`
- **Dependencies**: Task 1.1
- **Action**:
  - Embed templates used by `init`/`update`
  - Support spool dir normalization (default `.spool`, custom spool dir)
- **Verify**: unit tests for rendering
- **Done When**: rendered content matches TS templates
- **Status**: [ ] pending

---

## Wave 3: `init` and `update`

### Task 3.1: Port `spool init`
- **Files**: `spool-rs/crates/spool-cli/src/*`, `spool-rs/crates/spool-core/src/*`
- **Dependencies**: Task 2.1
- **Action**:
  - Implement `init` behaviors and flag handling
  - Install prompts/skills/workflows into correct paths
- **Verify**: integration tests + parity tree diff
- **Done When**: non-interactive output matches TS byte-for-byte
- **Status**: [ ] pending

### Task 3.2: Port `spool update`
- **Files**: `spool-rs/crates/spool-cli/src/*`, `spool-rs/crates/spool-core/src/*`
- **Dependencies**: Task 3.1
- **Action**:
  - Implement `update` behavior (reinstall/update managed blocks)
  - Preserve user edits outside managed blocks
- **Verify**: integration tests + parity tree diff
- **Done When**: outputs match TS and unmanaged edits preserved
- **Status**: [ ] pending

---

## Wave 4: Parity + Coverage + Validation

### Task 4.1: Add tree-diff parity tests
- **Files**: `spool-rs/crates/spool-cli/tests/parity_*`
- **Dependencies**: Change `006-03_parity-test-harness`
- **Action**:
  - Run TS init/update in a temp dir
  - Run Rust init/update in a separate temp dir
  - Compare directory trees and file bytes
- **Verify**: `cargo test --workspace`
- **Done When**: parity tests pass deterministically
- **Status**: [ ] pending

### Task 4.2: Coverage target
- **Files**: `spool-rs/README.md`
- **Dependencies**: None
- **Action**:
  - Target >= 85% coverage for marker editing and template rendering logic
- **Verify**: `cargo llvm-cov --workspace`
- **Done When**: coverage target met or tracked
- **Status**: [ ] pending

### Task 4.3: Validate change artifacts
- **Files**: N/A
- **Dependencies**: All above
- **Action**:
  - Run `spool validate 006-06_port-init-update-installers --strict` and fix any issues
- **Verify**: Validation passes
- **Done When**: `spool validate --strict` is clean
- **Status**: [ ] pending

## Verify

```bash
spool validate 006-06_port-init-update-installers --strict
cd spool-rs
cargo test --workspace
cargo llvm-cov --workspace
```
