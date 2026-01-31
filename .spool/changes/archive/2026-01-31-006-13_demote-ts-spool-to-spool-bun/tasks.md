# Tasks for: 006-13_demote-ts-spool-to-spool-bun

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Template**: Enhanced task format with waves, verification, and status tracking

______________________________________________________________________

## Wave 1

- **Depends On**: None

### Task 1.1: Create `spool-bun/` and relocate TypeScript source

- **Files**: `src/**`, `spool-bun/**`
- **Dependencies**: None
- **Action**:
  - Create `spool-bun/`.
  - Move the current TypeScript implementation from root `src/` into `spool-bun/src/`.
  - Ensure any relative imports and path assumptions are updated to reflect the new root for the legacy implementation.
- **Verify**: `bun test` (or the repo's existing TS test command)
- **Done When**: The TypeScript codebase builds/tests from its new location without relying on a root `src/`.
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

### Task 1.2: Update TS/Bun build config to point at `spool-bun/`

- **Files**: `package.json`, `spool-bun/**` (tsconfig/bunfig/scripts as applicable)
- **Dependencies**: None
- **Action**:
  - Update scripts and configs that reference `src/` so they reference `spool-bun/src/`.
  - Ensure any generated artifacts (dist) continue to land in the expected places for the legacy build.
- **Verify**: `make build` and `make test`
- **Done When**: The default developer commands still work after the move (or are updated to new defaults per Wave 3).
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

______________________________________________________________________

## Wave 2

- **Depends On**: Wave 1

### Task 2.1: Mark TypeScript/Bun implementation as deprecated in docs and agent guidance

- **Files**: `AGENTS.md`, `.spool/AGENTS.md`, `spool-bun/**` (new docs/instructions as needed)
- **Dependencies**: None
- **Action**:
  - Update `AGENTS.md` to state `spool-rs` is supported and must be favored.
  - Add a clear deprecation banner for the TypeScript/Bun implementation and point to the Rust workflow.
  - Ensure the legacy docs under `spool-bun/` include the same deprecation messaging.
- **Verify**: Manual review
- **Done When**: A new contributor reading `AGENTS.md` will default to `spool-rs` and understands the legacy status of `spool-bun`.
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

### Task 2.2: Update template AGENTS content installed by init/update

- **Files**: `src/core/templates/AGENTS.md`, `spool-rs/crates/spool-templates/assets/default/project/AGENTS.md`, `spool-rs/crates/spool-templates/assets/default/project/.spool/AGENTS.md`
- **Dependencies**: None
- **Action**:
  - Update installed template instructions to reflect the new default (`spool-rs` supported; TypeScript deprecated).
  - Ensure any references to root `src/` layout are removed or updated.
- **Verify**: `spool init` (in a scratch repo) and inspect installed instructions
- **Done When**: Fresh installs contain correct guidance and do not reference the old root TypeScript layout.
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

______________________________________________________________________

## Wave 3

- **Depends On**: Wave 2

### Task 3.1: Update Makefile to prefer Rust workflows by default

- **Files**: `Makefile`
- **Dependencies**: None
- **Action**:
  - Update default targets (`build`, `test`, `lint`, etc.) to run the supported Rust equivalents first (or exclusively), and expose legacy TypeScript targets explicitly (e.g., `bun-*` or `spool-bun-*`).
  - Ensure developer ergonomics remain good (clear help text, no surprising side effects).
- **Verify**: `make build && make test`
- **Done When**: `make` workflows reflect `spool-rs` as the default supported path.
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

______________________________________________________________________

## Wave 4

- **Depends On**: Wave 3

### Task 4.1: Ensure `spool-rs` installs/executes as `spool`

- **Files**: `spool-rs/**` (CLI packaging/install paths), installer scripts/templates as applicable
- **Dependencies**: None
- **Action**:
  - Update install logic so the Rust binary is installed/exposed as `spool` (not `spool.rs`).
  - Ensure `spool --help` and `spool --version` identify the Rust implementation as supported.
- **Verify**: `cd spool-rs && cargo test --workspace` (plus any packaging smoke test)
- **Done When**: Installing the supported distribution yields a `spool` command backed by Rust.
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

### Task 4.2: Stop the legacy TypeScript implementation from claiming `spool` by default

- **Files**: `spool-bun/**` (package metadata, scripts, docs)
- **Dependencies**: None
- **Action**:
  - Ensure the legacy implementation does not install/publish a default `spool` command that can shadow Rust.
  - If a legacy CLI entrypoint remains, ensure it uses a distinct name and is labeled deprecated.
- **Verify**: Legacy build command (as defined post-move)
- **Done When**: The legacy implementation cannot silently take over the `spool` command.
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

### Task 4.3: Uninstall legacy TypeScript `spool` from the global cache

- **Files**: `spool-bun/**` (if legacy still manages cache), plus the supported installer/upgrade logic (likely under `spool-rs/**`)
- **Dependencies**: None
- **Action**:
  - Identify the cache location(s) used by the current TypeScript `spool` distribution.
  - Implement idempotent cleanup during installation/upgrade so cached legacy `spool` cannot shadow Rust.
  - Document what is removed and how to opt out (if applicable).
- **Verify**: Manual repro on a machine with cached legacy `spool`
- **Done When**: After upgrade, `spool` resolves to the Rust implementation even when legacy caches previously existed.
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

______________________________________________________________________

## Wave 5

- **Depends On**: Wave 4

### Task 5.1: Update/replace parity validations that assumed TypeScript is canonical

- **Files**: `.spool/specs/rust-installers/spec.md` (archived spec), tests under `spool-rs/**`, parity harnesses if present
- **Dependencies**: None
- **Action**:
  - Remove or update any checks that enforce TypeScript byte-for-byte parity as a hard requirement.
  - Add or adjust golden/template-based validations for installer outputs.
- **Verify**: `make test` and `cd spool-rs && cargo test --workspace`
- **Done When**: CI/tests validate installer outputs without requiring the TypeScript implementation as the reference.
- **Updated At**: 2026-01-29
- **Status**: \[x\] complete

______________________________________________________________________

## Wave 6 (Checkpoint)

- **Depends On**: Wave 5

### Task 6.1: Review support policy and deprecation messaging

- **Type**: checkpoint (requires human approval before proceeding)
- **Files**: `AGENTS.md`, `.spool/AGENTS.md`, `spool-rs/README.md`, `spool-bun/**`
- **Dependencies**: None
- **Action**:
  - Confirm wording, migration guidance, and naming decisions (`spool` vs legacy name) are correct.
  - Confirm the Makefile defaults match the intended supported workflow.
- **Done When**: Maintainers approve the deprecation policy and default install behavior.
- **Updated At**: 2026-01-29
- **Status**: [ ] pending

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified
- `[-] shelved` - Intentionally not-to-be-done (reversible)
