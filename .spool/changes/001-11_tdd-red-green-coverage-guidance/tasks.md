# Tasks for: 001-11_tdd-red-green-coverage-guidance

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Prefer the tasks CLI to drive status updates and pick work

```bash
spool tasks status 001-11_tdd-red-green-coverage-guidance
spool tasks next 001-11_tdd-red-green-coverage-guidance
spool tasks start 001-11_tdd-red-green-coverage-guidance 1.1
spool tasks complete 001-11_tdd-red-green-coverage-guidance 1.1
spool tasks show 001-11_tdd-red-green-coverage-guidance
```

______________________________________________________________________

## Wave 1

- **Depends On**: None

### Task 1.1: Add TDD + coverage guidance to installed templates

- **Files**:
  - `spool-rs/crates/spool-templates/assets/default/project/.opencode/commands/spool-proposal.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.opencode/commands/spool-apply.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.claude/commands/spool/proposal.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.claude/commands/spool/apply.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.codex/prompts/spool-proposal.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.codex/prompts/spool-apply.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.github/prompts/spool-proposal.prompt.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.github/prompts/spool-apply.prompt.md`
- **Dependencies**: None
- **Action**:
  - Add a concise "Testing Policy" section that directs RED/GREEN/REFACTOR and references a configurable coverage target (default 80%).
  - Include a short snippet showing where the project can override the defaults.
- **Verify**: `make test`
- **Done When**: A fresh `spool init --force --tools all` installs templates that include the new guidance.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 1.2: Extend template config to include testing defaults

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.spool/config.json`
- **Dependencies**: None
- **Action**: Add default keys for testing policy (TDD workflow + coverage target).
- **Verify**: `make test`
- **Done When**: Installed `.spool/config.json` contains the default testing policy keys.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2

- **Depends On**: Wave 1

### Task 2.1: Plumb testing policy config into instruction generation

- **Files**: `spool-rs/` (instruction generation + config loading)
- **Dependencies**: Task 1.1, Task 1.2
- **Action**:
  - Read config via existing cascading config system.
  - Render testing policy guidance into `spool agent instruction proposal|apply` outputs, using configured values.
- **Verify**: `make test`
- **Done When**: A unit/integration test demonstrates that instruction output changes with config overrides.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 2.2: Update docs to describe TDD + coverage guidance and overrides

- **Files**:
  - `.spool/AGENTS.md` (project docs)
  - `docs/agent-workflow.md` (if present)
- **Dependencies**: Task 2.1
- **Action**: Add a short section documenting RED/GREEN/REFACTOR and the default coverage target, with config override examples.
- **Verify**: `spool validate 001-11_tdd-red-green-coverage-guidance --strict`
- **Done When**: Documentation clearly explains defaults and how to override them.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3 (Checkpoint)

- **Depends On**: Wave 2

### Task 3.1: Human review of wording and default policy

- **Type**: checkpoint (requires human approval before proceeding)
- **Files**:
  - `spool-rs/crates/spool-templates/assets/default/project/`
  - `spool-rs/` instruction generation changes
- **Dependencies**: Task 2.1, Task 2.2
- **Action**: Review that guidance is clear, non-noisy, and the defaults (RED/GREEN/REFACTOR + 80%) are appropriate.
- **Done When**: Reviewer approves phrasing and key naming.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending
