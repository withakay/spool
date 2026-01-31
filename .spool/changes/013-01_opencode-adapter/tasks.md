# Tasks for: 013-01_opencode-adapter

## Execution Notes

- **Tool**: OpenCode (development), any (implementation)
- **Mode**: Sequential
- **Created**: 2026-01-31
- **Tracking**: Prefer the tasks CLI
- **Rust**: When modifying Rust/template plumbing, follow the `rust-style` skill

```bash
spool tasks status 013-01_opencode-adapter
spool tasks next 013-01_opencode-adapter
spool tasks start 013-01_opencode-adapter 1.1
spool tasks complete 013-01_opencode-adapter 1.1
spool tasks show 013-01_opencode-adapter
```

______________________________________________________________________

## Wave 1

- **Depends On**: None

### Task 1.1: Implement OpenCode plugin that injects bootstrap instructions

- **Files**: `spool-skills/adapters/opencode/spool-skills.js`, `.spool/changes/013-01_opencode-adapter/design.md`
- **Dependencies**: None
- **Action**:
  - Add a Spool-owned OpenCode plugin at `spool-skills/adapters/opencode/spool-skills.js`.
  - Use `experimental.chat.system.transform` to inject a short bootstrap that delegates to:
    - `spool agent instruction bootstrap --tool opencode`
  - Resolve skills from `${OPENCODE_CONFIG_DIR}/skills/spool-skills/` (never via relative paths).
  - Keep plugin stateless and avoid intercepting tools beyond the prompt transform.
- **Verify**:
  - `node -c spool-skills/adapters/opencode/spool-skills.js` (syntax)
  - `spool-skills/tests/opencode/run-tests.sh` (if applicable)
- **Done When**: Plugin can be copy-installed and always points to a stable skills location
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.2: Add template assets for OpenCode plugin + spool-skills skill bundle

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/`
- **Dependencies**: Task 1.1
- **Action**:
  - Embed the OpenCode plugin into the default project template.
  - Embed the `spool-skills` skill bundle into the default project template under OpenCode skills.
  - Ensure installed layout matches the manifest in `.spool/changes/013-05_distribution-fetch-mechanics/proposal.md`.
  - When editing Rust for template embedding, apply the `rust-style` skill conventions.
- **Verify**: `make test`
- **Done When**: `spool init --tools opencode` installs both plugin and skills without repo-relative assumptions
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

______________________________________________________________________

## Checkpoints

### Checkpoint: Review Implementation

- **Type**: checkpoint (requires human approval)
- **Files**: `.spool/changes/013-01_opencode-adapter/proposal.md`, `spool-skills/adapters/opencode/spool-skills.js`
- **Dependencies**: Task 1.2
- **Action**: Review the OpenCode bootstrap approach and destination paths
- **Done When**: User confirms implementation is correct
- **Updated At**: 2026-01-31
- **Status**: [ ] pending
