# Tasks for: 013-15_update-subagent-driven-development

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Depends On**: 013-14 (rename skills) should be done first

```bash
spool tasks status 013-15_update-subagent-driven-development
spool tasks next 013-15_update-subagent-driven-development
```

______________________________________________________________________

## Wave 1: Remove deprecated references

### Task 1.1: Replace superpowers:* references

- **Files**: `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Action**:
  - Replace all `superpowers:*` skill references with `spool-*` names
  - e.g., `superpowers:verification-before-completion` → `spool-verification-before-completion`
- **Verify**: `grep -i superpowers spool-skills/skills/subagent-driven-development/SKILL.md` returns no results
- **Done When**: No superpowers references remain
- **Status**: [ ] pending

### Task 1.2: Replace executing-plans references

- **Files**: `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Action**:
  - Replace `executing-plans` with `spool-apply-change-proposal`
- **Verify**: `grep executing-plans spool-skills/skills/subagent-driven-development/SKILL.md` returns no results
- **Done When**: No executing-plans references remain
- **Status**: [ ] pending

### Task 1.3: Replace writing-plans references

- **Files**: `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Action**:
  - Replace `writing-plans` with `spool-write-change-proposal`
- **Verify**: `grep writing-plans spool-skills/skills/subagent-driven-development/SKILL.md` returns no results
- **Done When**: No writing-plans references remain
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2: Update to spool workflow

### Task 2.1: Replace docs/plans/ with spool artifacts

- **Files**: `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Action**:
  - Replace `docs/plans/` references with `.spool/changes/<id>/tasks.md`
- **Verify**: `grep "docs/plans" spool-skills/skills/subagent-driven-development/SKILL.md` returns no results
- **Done When**: No docs/plans references remain
- **Status**: [ ] pending

### Task 2.2: Replace TodoWrite with spool tasks CLI

- **Files**: `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Action**:
  - Replace `TodoWrite` with `spool tasks start/complete/shelve` commands
  - Update any task tracking examples
- **Verify**: `grep -i todowrite spool-skills/skills/subagent-driven-development/SKILL.md` returns no results
- **Done When**: No TodoWrite references remain
- **Status**: [ ] pending

### Task 2.3: Update subagent context

- **Files**: `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Action**:
  - Update subagent prompt to use `spool agent instruction apply --change <id>` for context
- **Done When**: Subagent context uses spool CLI
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3: Update embedded template

### Task 3.1: Sync embedded template

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-subagent-driven-development/SKILL.md`
- **Action**:
  - Copy updated skill from `spool-skills/skills/subagent-driven-development/SKILL.md`
- **Verify**: Files match
- **Done When**: Embedded template updated
- **Status**: [ ] pending

______________________________________________________________________

## Wave 4: Verification

### Task 4.1: Verify no deprecated references

- **Action**:
  - `grep -E "superpowers:|executing-plans|writing-plans|docs/plans|TodoWrite" spool-skills/skills/subagent-driven-development/SKILL.md`
- **Done When**: Grep returns no results
- **Status**: [ ] pending

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started
- `[ ] in-progress` - Currently working
- `[x] complete` - Finished and verified
- `[-] shelved` - Deferred
