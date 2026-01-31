## Why

The `executing-plans` skill duplicates functionality that `spool-apply-change-proposal` provides. Both execute tasks from a plan with progress tracking. Maintaining two parallel execution skills creates confusion and inconsistent behavior.

## What Changes

- **Merge `executing-plans` into `spool-apply-change-proposal`**: Add valuable patterns from `executing-plans`:
  - Batch execution with review checkpoints (default: 3 tasks per batch)
  - Critical review step before starting
  - Explicit "when to stop and ask for help" guidance
  - Handoff to `spool-finishing-a-development-branch` on completion
  - Safety check: never start on main/master without consent
- **Remove `executing-plans`**: Delete from `spool-skills/skills/` and embedded templates
- **Update `subagent-driven-development`**: Remove `superpowers:*` references, point to `spool-apply-change-proposal`

## Capabilities

### Modified Capabilities

- `spool-apply-change-proposal`: Enhanced with batch execution, review checkpoints, stop conditions, and completion handoff

### Removed Capabilities

- `executing-plans`: Merged into `spool-apply-change-proposal` and removed

## Impact

- **spool-apply-change-proposal skill**: Enhanced with executing-plans patterns (lives in spool workflow skills, not spool-skills)
- **spool-skills/skills/executing-plans/**: Deleted
- **spool-skills/skills/subagent-driven-development/SKILL.md**: Update references
- **Embedded templates**: Remove `spool-executing-plans`
- **distribution.rs**: Remove `executing-plans` from SPOOL_SKILLS list
