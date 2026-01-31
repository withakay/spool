# Tasks for: 006-06_port-init-update-installers

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

______________________________________________________________________

## Wave 1: Filesystem + Marker Editing

### Task 1.1: Implement marker-managed edits

- **Files**: `spool-rs/crates/spool-fs/src/*`
- **Dependencies**: None
- **Action**:
  - Implement marker block detection and replacement
  - Preserve unmanaged content
  - Ensure idempotency
- **Verify**: unit tests
- **Done When**: marker edits match TS on fixtures
- **Status**: \[x\] done

______________________________________________________________________

## Wave 2: Template Rendering

### Task 2.1: Embed and render templates

- **Files**: `spool-rs/crates/spool-templates/src/*`
- **Dependencies**: Task 1.1
- **Action**:
  - Embed templates used by `init`/`update`
  - Support spool dir normalization (default `.spool`, custom spool dir)
- **Verify**: unit tests for rendering
- **Done When**: rendered content matches TS templates
- **Status**: \[x\] done

______________________________________________________________________

## Wave 3: `init` and `update`

### Task 3.1: Port `spool init`

- **Files**: `spool-rs/crates/spool-cli/src/*`, `spool-rs/crates/spool-core/src/*`
- **Dependencies**: Task 2.1
- **Action**:
  - Implement `init` behaviors and flag handling
  - Install prompts/skills/workflows into correct paths
- **Verify**: integration tests + parity tree diff
- **Done When**: non-interactive output matches TS byte-for-byte
- **Status**: \[x\] done

### Task 3.2: Port `spool update`

- **Files**: `spool-rs/crates/spool-cli/src/*`, `spool-rs/crates/spool-core/src/*`
- **Dependencies**: Task 3.1
- **Action**:
  - Implement `update` behavior (reinstall/update managed blocks)
  - Preserve user edits outside managed blocks
- **Verify**: integration tests + parity tree diff
- **Done When**: outputs match TS and unmanaged edits preserved
- **Status**: \[x\] done

______________________________________________________________________

## Wave 4: Parity + Coverage + Validation

### Task 4.1: Add tree-diff parity tests

- **Files**: `spool-rs/crates/spool-cli/tests/parity_*`
- **Dependencies**: Task 3.2
- **Action**:
  - Run TS init/update in a temp dir
  - Run Rust init/update in a separate temp dir
  - Compare directory trees and file bytes
- **Verify**: `cargo test --workspace`
- **Done When**: parity tests pass deterministically
- **Status**: \[x\] done

### Task 4.2: Coverage target

- **Files**: `spool-rs/README.md`
- **Dependencies**: None
- **Action**:
  - Target >= 85% coverage for marker editing and template rendering logic
- **Verify**: `cargo llvm-cov --workspace`
- **Done When**: coverage target met or tracked
- **Status**: \[x\] done
- **Notes**: `cargo llvm-cov --workspace` results: `spool-fs` 94.59% regions; `spool-templates` 86.67% regions

### Task 4.3: Validate change artifacts

- **Files**: N/A
- **Dependencies**: Task 3.2, Task 4.1, Task 4.2
- **Action**:
  - Run `spool validate 006-06_port-init-update-installers --strict` and fix any issues
- **Verify**: Validation passes
- **Done When**: `spool validate --strict` is clean
- **Status**: \[x\] done
- **Notes**: `spool validate 006-06_port-init-update-installers --strict` passed

## Verify

```bash
spool validate 006-06_port-init-update-installers --strict
cd spool-rs
cargo test --workspace
cargo llvm-cov --workspace
```
