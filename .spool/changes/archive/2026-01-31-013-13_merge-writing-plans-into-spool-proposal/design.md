## Context

The `writing-plans` skill and `spool-write-change-proposal` skill both create structured task lists for implementation. Having two planning skills creates confusion. The solution is to merge them.

`writing-plans` has valuable patterns that `spool-write-change-proposal` lacks:
- Bite-sized task granularity (2-5 min steps)
- TDD flow per task (failing test → run → implement → run → commit)
- Task structure guidance (exact file paths, complete code, exact commands)
- Plan header template (goal, architecture, tech stack)

`spool-write-change-proposal` is currently thin - it delegates to CLI output. It should be enhanced with these patterns.

## Goals / Non-Goals

**Goals:**
- Enhance `spool-write-change-proposal` with valuable task authoring patterns from `writing-plans`
- Remove `writing-plans` to eliminate duplication
- Update referencing skills (`subagent-driven-development`)

**Non-Goals:**
- Changing spool CLI behavior or task format
- Modifying other spool workflow skills beyond `spool-write-change-proposal`

## Decisions

### 1. Merge direction: writing-plans into spool-write-change-proposal

**Decision**: Enhance `spool-write-change-proposal` with writing-plans patterns, then delete writing-plans.

**Rationale**: `spool-write-change-proposal` is the canonical planning skill in the spool workflow. It should have the best task authoring guidance.

### 2. Task granularity: 2-5 minute steps

**Decision**: Keep the "2-5 minute" task size guidance from writing-plans.

**Rationale**: Proven pattern that enables steady progress and easy verification.

### 3. TDD flow: Include in task guidance

**Decision**: Add TDD flow guidance to spool-write-change-proposal task creation.

**Rationale**: TDD ensures verifiable tasks and prevents untested code.

### 4. spool-write-change-proposal location

**Decision**: `spool-write-change-proposal` lives in spool workflow skills (embedded templates), not spool-skills.

**Rationale**: It's a core spool workflow skill.

## Risks / Trade-offs

**[Risk] Breaking references** → Skills that reference `writing-plans` will break. Mitigation: Update `subagent-driven-development` in same change.

**[Trade-off] spool-write-change-proposal becomes longer** → More content in one skill. Acceptable for consolidation benefits.

## Migration Plan

1. Enhance `spool-write-change-proposal` with writing-plans patterns
2. Update `subagent-driven-development` to reference `spool-write-change-proposal`
3. Delete `writing-plans` from spool-skills
4. Remove from embedded templates
5. Update distribution.rs SPOOL_SKILLS list
