# Tasks for: 012-01_add-git-worktree-support

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Prefer the tasks CLI to drive status updates and pick work

```bash
spool tasks status 012-01_add-git-worktree-support
spool tasks next 012-01_add-git-worktree-support
spool tasks start 012-01_add-git-worktree-support 1.1
spool tasks complete 012-01_add-git-worktree-support 1.1
spool tasks show 012-01_add-git-worktree-support
```

______________________________________________________________________

## Wave 1

- **Depends On**: None

### Task 1.1: Research and decide Mise local config filename

- **Files**: `.spool/changes/012-01_add-git-worktree-support/design.md`
- **Dependencies**: None
- **Action**:
  - Confirm Mise's supported local config filename(s) and choose the default entry to copy.
  - Update `design.md` Open Questions with a concrete decision.
- **Verify**: N/A
- **Done When**: Design explicitly names the Mise local config file to support by default
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.2: Add global config keys for worktree defaults

- **Files**: `spool-rs/crates/spool-core/src/config/`, `.spool/specs/global-config/spec.md`
- **Dependencies**: Task 1.1
- **Action**:
  - Add schema + defaults for `worktrees.defaultBranch` and `worktrees.localFiles`.
  - Ensure values can be overridden via existing config mechanisms.
- **Verify**: `make test`
- **Done When**: Defaults exist and can be loaded without breaking older configs
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.3: Emit worktree-aware apply instructions

- **Files**: `spool-rs/crates/spool-cli/`, `spool-rs/crates/spool-core/`, `.spool/specs/cli-artifact-workflow/spec.md`
- **Dependencies**: Task 1.2
- **Action**:
  - Add worktree mode logic to `spool instructions apply` output.
  - Include a deterministic shell snippet that creates/reuses `./main` and `./changes/<id>`.
  - Include local file copy steps for `.env`, `.envrc`, and Mise local config.
- **Verify**: `make test`
- **Done When**: Apply instructions clearly instruct the agent to operate in the change worktree directory
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2

- **Depends On**: Wave 1

### Task 2.1: Add opt-in init support for worktree layout

- **Files**: `spool-rs/crates/spool-cli/`, `spool-rs/crates/spool-core/`, `.spool/specs/cli-init/spec.md`
- **Dependencies**: Task 1.3
- **Action**:
  - Add an opt-in flag/config to `spool init` that prepares the `./main` worktree layout.
  - Make it idempotent and safe.
- **Verify**: `make test`
- **Done When**: `spool init` can set up worktree layout without duplicating worktrees
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 2.2: Add integration tests for worktree instructions and copying

- **Files**: `spool-rs/crates/spool-cli/tests/`
- **Dependencies**: Task 2.1
- **Action**:
  - Add tests that assert generated instructions include expected paths and copy steps.
  - Add tests for default branch fallback behavior.
- **Verify**: `make test`
- **Done When**: Tests fail without implementation and pass with it
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3 (Checkpoint)

- **Depends On**: Wave 2

### Task 3.1: Human review of workspace layout and security posture

- **Type**: checkpoint (requires human approval before proceeding)
- **Files**: `.spool/changes/012-01_add-git-worktree-support/proposal.md`, `.spool/changes/012-01_add-git-worktree-support/design.md`
- **Dependencies**: Task 2.2
- **Action**:
  - Confirm the directory layout and the default local file copy list are acceptable.
  - Confirm whether Spool should manage ignores via `.git/info/exclude` or leave it as documentation.
- **Done When**: Proposal is approved for implementation
- **Updated At**: 2026-01-31
- **Status**: [ ] pending
