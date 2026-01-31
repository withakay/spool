## Why

The `finishing-a-development-branch` skill has two issues:
1. References `executing-plans` (being removed in 013-12)
2. Missing `spool-archive` as an option for completing spool changes

## What Changes

- Replace `executing-plans` reference with `spool-apply-change-proposal`
- Add option 5: "Archive spool change" that invokes `spool-archive`
- Add detection: if working on a spool change, present archive option

## Capabilities

### Modified Capabilities

- `finishing-a-development-branch`: Updated references, added spool-archive option

## Impact

- **spool-skills/skills/finishing-a-development-branch/SKILL.md**: Minor updates
- **Embedded templates**: Update `spool-finishing-a-development-branch`
- Non-breaking: new option is additive
