## Context

The `executing-plans` skill and `spool-apply-change-proposal` skill both execute tasks from a plan with progress tracking. Having two execution skills creates confusion. The solution is to merge them.

`executing-plans` has valuable patterns that `spool-apply-change-proposal` lacks:
- Batch execution with review checkpoints (3 tasks, report, wait for feedback)
- Critical review before starting
- Explicit stop conditions ("when to stop and ask for help")
- Handoff to finishing-a-development-branch
- Branch safety check (never start on main/master without consent)

`spool-apply-change-proposal` is currently thin - it delegates to CLI output. It should be enhanced with these patterns.

## Goals / Non-Goals

**Goals:**
- Enhance `spool-apply-change-proposal` with valuable execution patterns from `executing-plans`
- Remove `executing-plans` to eliminate duplication
- Update referencing skills (`writing-plans`, `subagent-driven-development`)
- Remove deprecated `superpowers:*` references

**Non-Goals:**
- Changing spool CLI behavior
- Modifying other spool workflow skills beyond `spool-apply-change-proposal`

## Decisions

### 1. Merge direction: executing-plans into spool-apply-change-proposal

**Decision**: Enhance `spool-apply-change-proposal` with executing-plans patterns, then delete executing-plans.

**Rationale**: `spool-apply-change-proposal` is the canonical execution skill in the spool workflow. It should have the best execution patterns.

### 2. Batch size: Default 3 tasks

**Decision**: Keep the "3 tasks per batch" pattern from executing-plans.

**Rationale**: Proven pattern that balances progress with review opportunities.

### 3. spool-apply-change-proposal location

**Decision**: `spool-apply-change-proposal` lives in spool workflow skills (embedded templates), not spool-skills.

**Rationale**: It's a core spool workflow skill, not a general-purpose skill.

### 4. Update location for spool-apply-change-proposal

**Decision**: Update the embedded template at `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-apply-change-proposal/SKILL.md`

**Rationale**: This is the source of truth for spool workflow skills.

## Risks / Trade-offs

**[Risk] Breaking references** → Skills that reference `executing-plans` will break. Mitigation: Update `writing-plans` and `subagent-driven-development` in same change.

**[Trade-off] spool-apply-change-proposal becomes longer** → More content in one skill. Acceptable for consolidation benefits.

## Migration Plan

1. Enhance `spool-apply-change-proposal` with executing-plans patterns
2. Update `writing-plans` to reference `spool-apply-change-proposal`
3. Update `subagent-driven-development` to remove superpowers references, use `spool-apply-change-proposal`
4. Delete `executing-plans` from spool-skills
5. Remove from embedded templates
6. Update distribution.rs SPOOL_SKILLS list
