# Tasks for: 006-10_packaging-and-transition-plan

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

---

## Wave 1: Packaging Plan

### Task 1.1: Document packaging/distribution strategy
- **Files**: `.spool/research/investigations/packaging-distribution.md` (update as needed), `spool-rs/README.md`
- **Dependencies**: Change `006-02_create-spool-rs-workspace`
- **Action**:
  - Define the chosen distribution approach (binaries + npm wrapper)
  - Define platform matrix and artifact names
  - Define versioning and integrity checks
- **Verify**: docs are concrete and actionable
- **Done When**: plan is ready to implement in CI
- **Status**: [ ] pending

---

## Wave 2: CI/Release Artifacts

### Task 2.1: Define CI build + release steps (documented)
- **Files**: `.github/workflows/*` (future), `spool-rs/README.md`
- **Dependencies**: Task 1.1
- **Action**:
  - Specify commands to build release binaries per platform
  - Specify how npm wrapper fetches/releases those binaries
- **Verify**: plan includes commands and file paths
- **Done When**: CI work is fully specified
- **Status**: [ ] pending

---

## Wave 3: Verification + Validation

### Task 3.1: Add packaging verification checklist
- **Files**: `spool-rs/README.md`
- **Dependencies**: Task 2.1
- **Action**:
  - Document verification commands:
    - `spool --version`, `spool --help`
    - checksum verification
    - completion install verification
- **Verify**: checklist is complete
- **Done When**: release verification is explicit
- **Status**: [ ] pending

### Task 3.2: Validate change artifacts
- **Files**: N/A
- **Dependencies**: All above
- **Action**:
  - Run `spool validate 006-10_packaging-and-transition-plan --strict` and fix any issues
- **Verify**: Validation passes
- **Done When**: `spool validate --strict` is clean
- **Status**: [ ] pending

## Verify

```bash
spool validate 006-10_packaging-and-transition-plan --strict
```
