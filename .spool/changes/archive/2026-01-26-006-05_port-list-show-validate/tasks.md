# Tasks for: 006-05_port-list-show-validate

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

---

## Wave 1: `list`

### Task 1.1: Implement `spool list` and `spool list --modules`
- **Files**: `spool-rs/crates/spool-cli/src/*`, `spool-rs/crates/spool-core/src/*`
- **Dependencies**: Change `006-04_port-id-and-config-foundations`
- **Action**:
  - Implement argument parsing and output rendering
  - Match `--json` schema and ordering as observed in TS
- **Verify**: unit + integration tests
- **Done When**: parity tests for list pass in fixtures
- **Status**: [x] complete

---

## Wave 2: `show`

### Task 2.1: Implement `spool show`
- **Files**: `spool-rs/crates/spool-cli/src/*`, `spool-rs/crates/spool-core/src/*`
- **Dependencies**: Task 1.1
- **Action**:
  - Implement `show` rendering and `--json` output
  - Match error messages for missing IDs
- **Verify**: parity tests
- **Done When**: show parity passes on fixtures
- **Status**: [x] complete

---

## Wave 3: `validate`

### Task 3.1: Implement `spool validate` and `--strict`
- **Files**: `spool-rs/crates/spool-cli/src/*`, `spool-rs/crates/spool-core/src/validate/*`
- **Dependencies**: Task 2.1
- **Action**:
  - Implement validation with identical warning/error behavior
  - Match `--json` shapes
- **Verify**: parity tests
- **Done When**: validate parity passes
- **Status**: [x] complete

---

## Wave 4: Parity + Coverage

### Task 4.1: Add parity tests across fixture repos
- **Files**: `spool-rs/crates/spool-cli/tests/parity_*`
- **Dependencies**: Change `006-03_parity-test-harness`
- **Action**:
  - Add fixtures representing:
    - repo with many changes
    - repo with no changes
    - repo with validation warnings
- **Verify**: `cargo test --workspace`
- **Done When**: parity suite is deterministic
- **Status**: [x] complete

### Task 4.2: Coverage target
- **Files**: `spool-rs/README.md`
- **Dependencies**: None
- **Action**:
  - Target >= 85% coverage for `spool-core` validation and rendering
- **Verify**: `cargo llvm-cov --workspace`
- **Done When**: coverage target met or tracked
- **Status**: [x] complete

### Task 4.3: Validate change artifacts
- **Files**: N/A
- **Dependencies**: All above
- **Action**:
  - Run `spool validate 006-05_port-list-show-validate --strict` and fix any issues
- **Verify**: Validation passes
- **Done When**: `spool validate --strict` is clean
- **Status**: [x] complete

## Verify

```bash
spool validate 006-05_port-list-show-validate --strict
cd spool-rs
cargo test --workspace
cargo llvm-cov --workspace
```
