# Tasks for: 013-17_update-finishing-branch-skill

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Depends On**: 013-14 (rename skills) should be done first

```bash
spool tasks status 013-17_update-finishing-branch-skill
spool tasks next 013-17_update-finishing-branch-skill
```

______________________________________________________________________

## Wave 1: Update references

### Task 1.1: Replace executing-plans reference

- **Files**: `spool-skills/skills/finishing-a-development-branch/SKILL.md`
- **Action**:
  - Replace `executing-plans` with `spool-apply-change-proposal`
  - Replace `subagent-driven-development` reference if needed (skill is being updated separately)
- **Verify**: `grep executing-plans spool-skills/skills/finishing-a-development-branch/SKILL.md` returns no results
- **Done When**: No executing-plans references
- **Status**: [x] completed

______________________________________________________________________

## Wave 2: Add spool-archive option

### Task 2.1: Add option 5 for spool-archive

- **Files**: `spool-skills/skills/finishing-a-development-branch/SKILL.md`
- **Action**:
  - Add option 5: "Archive spool change"
  - Document: invokes `spool-archive` skill
  - Explain: integrates completed work into spool specs, marks change complete
- **Done When**: Option 5 documented
- **Status**: [x] completed

### Task 2.2: Add spool change detection

- **Files**: `spool-skills/skills/finishing-a-development-branch/SKILL.md`
- **Action**:
  - Add detection: check for `.spool/changes/` with in-progress changes
  - When detected: highlight option 5 as relevant
  - When not detected: note option 5 is not applicable
- **Done When**: Detection logic documented
- **Status**: [x] completed

______________________________________________________________________

## Wave 3: Update embedded template

### Task 3.1: Sync embedded template

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-finishing-a-development-branch/SKILL.md`
- **Action**:
  - Copy updated skill from `spool-skills/skills/finishing-a-development-branch/SKILL.md`
- **Done When**: Embedded template updated
- **Status**: [x] completed

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started
- `[ ] in-progress` - Currently working
- `[x] complete` - Finished and verified
- `[-] shelved` - Deferred
