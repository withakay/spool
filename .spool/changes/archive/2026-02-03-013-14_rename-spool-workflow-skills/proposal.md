## Why

The current spool workflow skill names (`spool-proposal`, `spool-apply`) are too terse and don't trigger on common user language. Users asking to "create a feature", "design a change", "write a spec", "implement tasks", or "execute a plan" won't discover these skills.

## What Changes

- **Rename `spool-proposal` to `spool-write-change-proposal`**
- **Rename `spool-apply` to `spool-apply-change-proposal`**
- **Keyword-stuff descriptions** for discoverability:
  - `spool-write-change-proposal`: "Use when creating, designing, planning, proposing, specifying a feature, change, requirement, enhancement, fix, modification, spec, or writing tasks"
  - `spool-apply-change-proposal`: "Use when implementing, executing, applying, building, coding, developing a feature, change, requirement, enhancement, fix, modification, spec, or running tasks"

## Capabilities

### Modified Capabilities

- `spool-proposal` → `spool-write-change-proposal`: Renamed with keyword-rich description
- `spool-apply` → `spool-apply-change-proposal`: Renamed with keyword-rich description

## Impact

- **Embedded templates**: Rename skill directories
- **spool skill (router)**: Update routing logic to use new names
- **Other spool-* skills**: Update any references to old names
- **013-12 and 013-13**: Update to reference new skill names
