## Context

The `finishing-a-development-branch` skill presents 4 options after implementation:
1. Merge to main
2. Create PR
3. Keep working
4. Discard

It references `executing-plans` which is being removed, and doesn't include spool-archive for completing spool changes.

## Goals / Non-Goals

**Goals:**
- Update reference from `executing-plans` to `spool-apply-change-proposal`
- Add option 5: Archive spool change
- Detect spool changes and highlight archive option when relevant

**Non-Goals:**
- Changing the other 4 options
- Making spool-archive mandatory

## Decisions

### 1. Add as option 5

**Decision**: Add spool-archive as a fifth option, not a replacement.

**Rationale**: The original 4 options are still valid. Archive is additive for spool projects.

### 2. Conditional highlighting

**Decision**: When a spool change is detected, highlight option 5 as relevant.

**Rationale**: Helps users in spool projects discover the archive workflow.

## Migration Plan

1. Replace `executing-plans` with `spool-apply-change-proposal`
2. Add option 5 for spool-archive
3. Add spool change detection logic
4. Update embedded template
