## Why

The `subagent-driven-development` skill has extensive references to deprecated patterns:
- `superpowers:*` skill syntax (no longer exists)
- `executing-plans` skill (being removed in 013-12)
- `writing-plans` skill (being removed in 013-13)
- `docs/plans/` output location (spool uses `.spool/changes/`)
- `TodoWrite` for tracking (spool uses `spool tasks` CLI)

The skill needs a major update to work with the spool workflow.

## What Changes

- Replace all `superpowers:*` references with modern `spool-*` prefixed skill names
- Replace `executing-plans` references with `spool-apply-change-proposal`
- Replace `writing-plans` references with `spool-write-change-proposal`
- Replace `docs/plans/` with `.spool/changes/<id>/tasks.md`
- Replace `TodoWrite` with `spool tasks` CLI
- Update subagent context to use `spool agent instruction apply`

## Capabilities

### Modified Capabilities

- `subagent-driven-development`: Modernized to use spool workflow, removing all deprecated references

## Impact

- **spool-skills/skills/subagent-driven-development/SKILL.md**: Major rewrite
- **Embedded templates**: Update `spool-subagent-driven-development`
- Skill continues to provide value (dispatch subagent per task with two-stage review) but integrated with spool
