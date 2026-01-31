## Context

The `subagent-driven-development` skill dispatches a fresh subagent per task with two-stage review (spec compliance then quality). This is valuable functionality that should be preserved.

However, the skill has extensive references to deprecated patterns that no longer exist or are being removed:
- `superpowers:*` skill syntax
- `executing-plans` and `writing-plans` skills
- `docs/plans/` output location
- `TodoWrite` for tracking

## Goals / Non-Goals

**Goals:**
- Update all references to use spool workflow patterns
- Preserve the core value: subagent-per-task with two-stage review
- Integrate with spool tasks CLI and change artifacts

**Non-Goals:**
- Changing the fundamental approach (subagent dispatch, two-stage review)
- Adding new functionality

## Decisions

### 1. Preserve subagent dispatch pattern

**Decision**: Keep the "fresh subagent per task" approach.

**Rationale**: Valuable for isolation and parallel execution. Aligns with spool-apply-change-proposal multi-agent patterns.

### 2. Preserve two-stage review

**Decision**: Keep spec compliance review then quality review.

**Rationale**: Effective quality gate that catches issues early.

### 3. Use spool CLI for subagent context

**Decision**: Subagents receive context via `spool agent instruction apply --change <id>`.

**Rationale**: Consistent with spool workflow. Subagents get proper context.

## Risks / Trade-offs

**[Risk] Extensive changes** → Many lines need updating. Mitigation: Systematic find/replace with verification.

## Migration Plan

1. Replace all `superpowers:*` with `spool-*` names
2. Replace `executing-plans` with `spool-apply-change-proposal`
3. Replace `writing-plans` with `spool-write-change-proposal`
4. Replace `docs/plans/` with `.spool/changes/<id>/tasks.md`
5. Replace `TodoWrite` with `spool tasks` CLI
6. Update subagent context to use spool CLI
7. Update embedded template
