# Tasks for: 013-03_codex-bootstrap

## Execution Notes

- **Tool**: Codex (development), any (implementation)
- **Mode**: Sequential
- **Created**: 2026-01-31
- **Rust**: When modifying Rust/template plumbing, follow the `rust-style` skill

```bash
spool tasks status 013-03_codex-bootstrap
spool tasks next 013-03_codex-bootstrap
spool tasks start 013-03_codex-bootstrap 1.1
spool tasks complete 013-03_codex-bootstrap 1.1
spool tasks show 013-03_codex-bootstrap
```

______________________________________________________________________

## Wave 1

- **Depends On**: None

### Task 1.1: Update Codex bootstrap snippet to delegate to Spool CLI

- **Files**: `spool-skills/.codex/spool-skills-bootstrap.md`, `spool-skills/.codex/INSTALL.md`, `.spool/changes/013-03_codex-bootstrap/design.md`
- **Dependencies**: None
- **Action**:
  - Ensure `spool-skills/.codex/spool-skills-bootstrap.md` is a short, always-on snippet that:
    - Points to `spool agent instruction bootstrap --tool codex`.
    - Lists the key workflow artifacts (proposal/apply/review/archive).
  - Update `spool-skills/.codex/INSTALL.md` to reflect the simplified approach.
  - Deprecate the Node CLI runner (`spool-skills/.codex/spool-skills-codex`) via docs (or remove if unused).
- **Verify**: `spool validate 013-03_codex-bootstrap --strict`
- **Done When**: Codex bootstrap is minimal and delegates to the CLI instruction artifacts
- **Updated At**: 2026-01-31
- **Status**: [x] complete

### Task 1.2: Add template assets for Codex bootstrap

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/`
- **Dependencies**: Task 1.1
- **Action**:
  - Embed the Codex bootstrap snippet into the default project template.
  - Ensure the destination matches the manifest in `.spool/changes/013-05_distribution-fetch-mechanics/proposal.md`.
  - When editing Rust for template embedding, apply the `rust-style` skill conventions.
- **Verify**: `make test`
- **Done When**: `spool init --tools codex` installs the bootstrap file into the Codex instructions location
- **Updated At**: 2026-01-31
- **Status**: [x] complete

______________________________________________________________________

## Checkpoints

### Checkpoint: Review Implementation

- **Type**: checkpoint (requires human approval)
- **Files**: `spool-skills/.codex/spool-skills-bootstrap.md`, `.spool/changes/013-03_codex-bootstrap/proposal.md`
- **Dependencies**: None
- **Action**: Review that Codex instructions remain short and non-duplicative
- **Done When**: User confirms implementation is correct
- **Updated At**: 2026-01-31
- **Status**: [x] completed
