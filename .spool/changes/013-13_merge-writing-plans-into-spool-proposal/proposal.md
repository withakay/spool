## Why

The `writing-plans` skill duplicates functionality that `spool-write-change-proposal` provides. Both create structured task lists for implementation. Maintaining two parallel planning skills creates confusion and inconsistent task formats.

## What Changes

- **Merge `writing-plans` into `spool-write-change-proposal`**: Add valuable patterns from `writing-plans`:
  - Bite-sized task granularity guidance (2-5 min steps)
  - TDD flow per task (failing test → run → implement → run → commit)
  - Task structure guidance: exact file paths, complete code, exact commands
  - Plan document header template (goal, architecture, tech stack)
- **Remove `writing-plans`**: Delete from `spool-skills/skills/` and embedded templates
- **Update `subagent-driven-development`**: Remove references to `writing-plans`

## Capabilities

### Modified Capabilities

- `spool-write-change-proposal`: Enhanced with task granularity guidance, TDD flow, task structure best practices

### Removed Capabilities

- `writing-plans`: Merged into `spool-write-change-proposal` and removed

## Impact

- **spool-write-change-proposal skill**: Enhanced with writing-plans patterns (lives in spool workflow skills)
- **spool-skills/skills/writing-plans/**: Deleted
- **spool-skills/skills/subagent-driven-development/SKILL.md**: Update references
- **Embedded templates**: Remove `spool-writing-plans`
- **distribution.rs**: Remove `writing-plans` from SPOOL_SKILLS list
