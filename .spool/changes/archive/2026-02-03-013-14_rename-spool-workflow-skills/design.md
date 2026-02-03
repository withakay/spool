## Context

The spool workflow skills have terse names that don't match how users naturally describe tasks:
- `spool-proposal` - users say "create a feature", "design a change", "write a spec"
- `spool-apply` - users say "implement this", "execute the plan", "build the feature"

Skills are discovered by matching user language against skill descriptions. Poor discoverability means users don't find the right skill.

## Goals / Non-Goals

**Goals:**
- Rename skills to be more descriptive
- Keyword-stuff descriptions for discoverability
- Update all cross-references

**Non-Goals:**
- Changing skill behavior
- Changing spool CLI commands (still `spool proposal`, `spool apply`)

## Decisions

### 1. New names

**Decision**:
- `spool-proposal` → `spool-write-change-proposal`
- `spool-apply` → `spool-apply-change-proposal`

**Rationale**: Verbose names that describe the action (write/apply) and the object (change proposal).

### 2. Description keywords

**Decision**: Stuff descriptions with synonyms:
- Write skill: create, design, plan, propose, specify, write, feature, change, requirement, enhancement, fix, modification, spec, tasks, proposal
- Apply skill: implement, execute, apply, build, code, develop, feature, change, requirement, enhancement, fix, modification, spec, tasks

**Rationale**: Maximizes chance of matching user language.

### 3. Router compatibility

**Decision**: `spool` router accepts both short (`proposal`, `apply`) and full names.

**Rationale**: Backward compatibility for users who learned short names.

## Risks / Trade-offs

**[Trade-off] Longer names** → More typing. Mitigated by router accepting short aliases.

**[Risk] Missed references** → Some skills may still reference old names. Mitigation: grep for old names after changes.

## Migration Plan

1. Rename skill directories in embedded templates
2. Update SKILL.md frontmatter (name, description)
3. Update spool router
4. Update all cross-references in spool-* skills
5. Update 013-12 and 013-13 to use new names
