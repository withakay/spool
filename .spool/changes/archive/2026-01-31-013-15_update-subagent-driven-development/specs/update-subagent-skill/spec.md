## Purpose

Update `subagent-driven-development` skill to use spool workflow patterns, removing all deprecated references.

## MODIFIED Requirements

### Requirement: No superpowers references

The skill SHALL NOT reference deprecated `superpowers:*` skill syntax.

#### Scenario: Modern skill references

- **WHEN** the skill references other skills
- **THEN** it uses `spool-*` prefixed names without `superpowers:` prefix

### Requirement: References spool-apply-change-proposal for execution

The skill SHALL reference `spool-apply-change-proposal` for task execution instead of `executing-plans`.

#### Scenario: Execution handoff

- **WHEN** the skill describes how subagents execute tasks
- **THEN** it references `spool-apply-change-proposal`

### Requirement: References spool-write-change-proposal for planning

The skill SHALL reference `spool-write-change-proposal` for task creation instead of `writing-plans`.

#### Scenario: Planning reference

- **WHEN** the skill describes plan creation
- **THEN** it references `spool-write-change-proposal`

### Requirement: Uses spool tasks CLI for tracking

The skill SHALL use `spool tasks` CLI instead of TodoWrite.

#### Scenario: Task status updates

- **WHEN** the skill or subagents update task status
- **THEN** they use `spool tasks start/complete/shelve` commands

### Requirement: Uses spool change artifacts

The skill SHALL reference `.spool/changes/<id>/tasks.md` instead of `docs/plans/`.

#### Scenario: Task source

- **WHEN** the skill loads tasks
- **THEN** it reads from `.spool/changes/<id>/tasks.md`

### Requirement: Subagent context from spool CLI

The skill SHALL provide subagents with context from `spool agent instruction apply`.

#### Scenario: Subagent prompt

- **WHEN** the skill dispatches a subagent
- **THEN** the subagent receives context via `spool agent instruction apply --change <id>`
