## Purpose

Rename spool workflow skills to be more descriptive and discoverable. Keyword-stuff descriptions to trigger on common user language.

## MODIFIED Requirements

### Requirement: spool-proposal renamed to spool-write-change-proposal

The skill formerly known as `spool-proposal` SHALL be renamed to `spool-write-change-proposal`.

#### Scenario: Skill directory name

- **WHEN** the skill is installed
- **THEN** it lives at `.opencode/skills/spool-write-change-proposal/` (or equivalent for other harnesses)

#### Scenario: Skill frontmatter name

- **WHEN** the skill SKILL.md is read
- **THEN** the `name` field is `spool-write-change-proposal`

### Requirement: spool-apply renamed to spool-apply-change-proposal

The skill formerly known as `spool-apply` SHALL be renamed to `spool-apply-change-proposal`.

#### Scenario: Skill directory name

- **WHEN** the skill is installed
- **THEN** it lives at `.opencode/skills/spool-apply-change-proposal/` (or equivalent for other harnesses)

#### Scenario: Skill frontmatter name

- **WHEN** the skill SKILL.md is read
- **THEN** the `name` field is `spool-apply-change-proposal`

### Requirement: spool-write-change-proposal has keyword-rich description

The `spool-write-change-proposal` skill SHALL have a description that triggers on planning/design language.

#### Scenario: Description content

- **WHEN** the skill description is read
- **THEN** it contains keywords: create, design, plan, propose, specify, write, feature, change, requirement, enhancement, fix, modification, spec, tasks, proposal

### Requirement: spool-apply-change-proposal has keyword-rich description

The `spool-apply-change-proposal` skill SHALL have a description that triggers on implementation language.

#### Scenario: Description content

- **WHEN** the skill description is read
- **THEN** it contains keywords: implement, execute, apply, build, code, develop, feature, change, requirement, enhancement, fix, modification, spec, tasks

### Requirement: spool router updated

The `spool` skill (router) SHALL route to the new skill names.

#### Scenario: Routing to write skill

- **WHEN** user invokes `spool proposal` or `spool write-change-proposal`
- **THEN** the router invokes `spool-write-change-proposal`

#### Scenario: Routing to apply skill

- **WHEN** user invokes `spool apply` or `spool apply-change-proposal`
- **THEN** the router invokes `spool-apply-change-proposal`

### Requirement: Cross-references updated

All spool-* skills that reference the old names SHALL be updated.

#### Scenario: No old references

- **WHEN** any spool skill is read
- **THEN** it does not reference `spool-proposal` or `spool-apply` (uses new names)
