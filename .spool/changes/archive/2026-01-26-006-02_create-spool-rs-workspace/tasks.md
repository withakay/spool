# Tasks for: 006-02_create-spool-rs-workspace

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

---

## Wave 1: Workspace Skeleton

### Task 1.1: Create Cargo workspace at `spool-rs/`
- **Files**: `spool-rs/Cargo.toml`, `spool-rs/crates/*`
- **Dependencies**: None
- **Action**:
  - Create workspace root and initial crates
  - Ensure `spool-cli` builds as a binary
- **Verify**: `cd spool-rs && cargo test --workspace`
- **Done When**: workspace compiles and tests run
- **Status**: [x] complete

### Task 1.2: Wire fmt + clippy
- **Files**: `spool-rs/rustfmt.toml` (optional), `spool-rs/README.md`
- **Dependencies**: Task 1.1
- **Action**:
  - Ensure `cargo fmt --check` and `cargo clippy --workspace` are clean
- **Verify**: `cd spool-rs && cargo fmt --check && cargo clippy --workspace`
- **Done When**: formatting and lint pass
- **Status**: [x] complete

---

## Wave 2: Coverage

### Task 2.1: Add coverage command documentation
- **Files**: `spool-rs/README.md`
- **Dependencies**: Task 1.2
- **Action**:
  - Document `cargo llvm-cov --workspace`
  - Set initial coverage target (>= 70% workspace, rising per later changes)
- **Verify**: `cd spool-rs && cargo llvm-cov --workspace`
- **Done When**: command is documented and runs in CI/local
- **Status**: [x] complete

---

## Wave 3: Validate Artifacts

### Task 3.1: Validate change artifacts
- **Files**: N/A
- **Dependencies**: All above
- **Action**:
  - Run strict validation and fix any issues
- **Verify**: `spool validate 006-02_create-spool-rs-workspace --strict`
- **Done When**: validation passes
- **Status**: [x] complete

## Verify

```bash
spool validate 006-02_create-spool-rs-workspace --strict
cd spool-rs
cargo fmt --check
cargo clippy --workspace
cargo test --workspace
cargo llvm-cov --workspace
```
