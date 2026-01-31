# Tasks for: 013-13_merge-writing-plans-into-spool-write-change-proposal

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

```bash
spool tasks status 013-13_merge-writing-plans-into-spool-write-change-proposal
spool tasks next 013-13_merge-writing-plans-into-spool-write-change-proposal
```

______________________________________________________________________

## Wave 1: Enhance spool-write-change-proposal

### Task 1.1: Add task granularity guidance to spool-write-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-write-change-proposal/SKILL.md`
- **Action**:
  - Add guidance on bite-sized tasks (2-5 min steps)
  - Explain why small tasks enable verification and steady progress
- **Done When**: spool-write-change-proposal describes task granularity best practices
- **Status**: [ ] pending

### Task 1.2: Add TDD flow guidance to spool-write-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-write-change-proposal/SKILL.md`
- **Action**:
  - Add TDD flow for implementation tasks: failing test → run → implement → run → commit
  - Document why TDD ensures verifiable tasks
- **Done When**: spool-write-change-proposal includes TDD task structure
- **Status**: [ ] pending

### Task 1.3: Add task structure best practices to spool-write-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-write-change-proposal/SKILL.md`
- **Action**:
  - Add guidance: tasks should specify exact file paths, what code to write, exact commands
  - Emphasize tasks should be self-contained and unambiguous
- **Done When**: spool-write-change-proposal includes task structure guidance
- **Status**: [ ] pending

### Task 1.4: Add plan header guidance to spool-write-change-proposal

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-write-change-proposal/SKILL.md`
- **Action**:
  - Add guidance on documenting context: goal, architecture, tech stack
  - Reference how this maps to spool's proposal.md and design.md
- **Done When**: spool-write-change-proposal includes context documentation guidance
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2: Update referencing skills

### Task 2.1: Update subagent-driven-development references

- **Files**: `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Action**:
  - Replace references to `writing-plans` with `spool-write-change-proposal`
  - Remove any remaining `superpowers:` prefixes
- **Verify**: `grep -E "writing-plans|superpowers:" spool-skills/skills/subagent-driven-development/SKILL.md` returns no results
- **Done When**: No legacy references remain
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3: Remove writing-plans

### Task 3.1: Delete writing-plans from spool-skills

- **Files**: `spool-skills/skills/writing-plans/`
- **Action**:
  - Remove entire directory
- **Verify**: `ls spool-skills/skills/writing-plans` fails
- **Done When**: Directory deleted
- **Status**: [ ] pending

### Task 3.2: Delete writing-plans from embedded templates

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-writing-plans/`
- **Action**:
  - Remove entire directory
- **Verify**: `ls spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-writing-plans` fails
- **Done When**: Directory deleted
- **Status**: [ ] pending

### Task 3.3: Remove writing-plans from distribution.rs

- **Files**: `spool-rs/crates/spool-core/src/distribution.rs`
- **Action**:
  - Remove `"writing-plans"` from SPOOL_SKILLS array
- **Verify**: `grep writing-plans spool-rs/crates/spool-core/src/distribution.rs` returns no results
- **Done When**: writing-plans removed from distribution
- **Status**: [ ] pending

______________________________________________________________________

## Wave 4: Verification

### Task 4.1: Build and test

- **Action**:
  - Run `cargo build --workspace`
  - Run `cargo test --workspace`
- **Done When**: All tests pass
- **Status**: [ ] pending

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started
- `[ ] in-progress` - Currently working
- `[x] complete` - Finished and verified
- `[-] shelved` - Deferred
