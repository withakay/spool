# Tasks for: 013-12_integrate-plan-skills-with-spool-workflow

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

```bash
spool tasks status 013-12_integrate-plan-skills-with-spool-workflow
spool tasks next 013-12_integrate-plan-skills-with-spool-workflow
```

______________________________________________________________________

## Wave 1: Enhance spool-apply-change-proposal

### Task 1.1: Add batch execution with checkpoints to spool-apply-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-apply-change-proposal/SKILL.md`
- **Action**:
  - Add batch execution pattern (default 3 tasks)
  - Add "report and wait for feedback" between batches
  - Document checkpoint flow
- **Done When**: spool-apply-change-proposal describes batch execution with review checkpoints
- **Status**: [x] completed

### Task 1.2: Add critical review step to spool-apply-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-apply-change-proposal/SKILL.md`
- **Action**:
  - Add pre-execution review step
  - Document raising concerns before starting
  - Require user confirmation or no concerns to proceed
- **Done When**: spool-apply-change-proposal includes critical review before execution
- **Status**: [x] completed

### Task 1.3: Add stop conditions to spool-apply-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-apply-change-proposal/SKILL.md`
- **Action**:
  - Add "When to stop and ask for help" section
  - List blockers: missing dependency, test fails, unclear instruction, repeated verification failure
  - Emphasize: stop and ask rather than guess
- **Done When**: spool-apply-change-proposal has explicit stop conditions
- **Status**: [x] completed

### Task 1.4: Add completion handoff to spool-apply-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-apply-change-proposal/SKILL.md`
- **Action**:
  - Add handoff to `spool-finishing-a-development-branch` after all tasks complete
  - Document the transition
- **Done When**: spool-apply-change-proposal hands off to completion skill
- **Status**: [x] completed

### Task 1.5: Add branch safety check to spool-apply-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-apply-change-proposal/SKILL.md`
- **Action**:
  - Add check for main/master branch
  - Require explicit consent before proceeding on protected branch
- **Done When**: spool-apply-change-proposal warns about protected branches
- **Status**: [x] completed

______________________________________________________________________

## Wave 2: Update referencing skills

### Task 2.1: Update writing-plans to reference spool-apply-change-proposal

- **Files**: `spool-skills/skills/writing-plans/SKILL.md`
- **Action**:
  - Replace references to `executing-plans` with `spool-apply-change-proposal`
  - Remove `superpowers:` prefix from any skill references
- **Verify**: `grep -E "executing-plans|superpowers:" spool-skills/skills/writing-plans/SKILL.md` returns no results
- **Done When**: writing-plans points to spool-apply-change-proposal
- **Status**: [x] completed

### Task 2.2: Update subagent-driven-development references

- **Files**: `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Action**:
  - Remove all `superpowers:*` references
  - Replace `executing-plans` with `spool-apply-change-proposal`
  - Update to modern skill names
- **Verify**: `grep -E "executing-plans|superpowers:" spool-skills/skills/subagent-driven-development/SKILL.md` returns no results
- **Done When**: No legacy references remain
- **Status**: [x] completed

______________________________________________________________________

## Wave 3: Remove executing-plans

### Task 3.1: Delete executing-plans from spool-skills

- **Files**: `spool-skills/skills/executing-plans/`
- **Action**:
  - Remove entire directory
- **Verify**: `ls spool-skills/skills/executing-plans` fails
- **Done When**: Directory deleted
- **Status**: [x] completed

### Task 3.2: Delete executing-plans from embedded templates

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-executing-plans/`
- **Action**:
  - Remove entire directory
- **Verify**: `ls spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-executing-plans` fails
- **Done When**: Directory deleted
- **Status**: [x] completed

### Task 3.3: Remove executing-plans from distribution.rs

- **Files**: `spool-rs/crates/spool-core/src/distribution.rs`
- **Action**:
  - Remove `"executing-plans"` from SPOOL_SKILLS array
- **Verify**: `grep executing-plans spool-rs/crates/spool-core/src/distribution.rs` returns no results
- **Done When**: executing-plans removed from distribution
- **Status**: [x] completed

______________________________________________________________________

## Wave 4: Verification

### Task 4.1: Build and test

- **Action**:
  - Run `cargo build --workspace`
  - Run `cargo test --workspace`
- **Done When**: All tests pass
- **Status**: [x] completed

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started
- `[ ] in-progress` - Currently working
- `[x] complete` - Finished and verified
- `[-] shelved` - Deferred
