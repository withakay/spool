## Purpose

Merge `executing-plans` skill into `spool-apply-change-proposal-change-proposal` and remove the duplicate skill. Enhance `spool-apply-change-proposal-change-proposal` with valuable execution patterns.

## ADDED Requirements

### Requirement: spool-apply-change-proposal supports batch execution with checkpoints

The `spool-apply-change-proposal` skill SHALL execute tasks in batches with review checkpoints between batches.

#### Scenario: Batch execution

- **WHEN** `spool-apply-change-proposal` executes tasks
- **THEN** it processes tasks in batches (default: 3 tasks)
- **AND** reports progress after each batch
- **AND** waits for user feedback before continuing

### Requirement: spool-apply-change-proposal includes critical review step

The `spool-apply-change-proposal` skill SHALL critically review the tasks before starting execution.

#### Scenario: Pre-execution review

- **WHEN** `spool-apply-change-proposal` loads tasks for a change
- **THEN** it reviews the tasks critically
- **AND** raises any concerns with the user before starting
- **AND** only proceeds after user confirmation or if no concerns

### Requirement: spool-apply-change-proposal has explicit stop conditions

The `spool-apply-change-proposal` skill SHALL stop execution and ask for help when encountering blockers.

#### Scenario: Blocker encountered

- **WHEN** execution hits a blocker (missing dependency, test fails, unclear instruction, repeated verification failure)
- **THEN** the skill stops immediately
- **AND** reports the blocker to the user
- **AND** waits for guidance rather than guessing

### Requirement: spool-apply-change-proposal hands off to completion skill

The `spool-apply-change-proposal` skill SHALL invoke `spool-finishing-a-development-branch` after all tasks complete.

#### Scenario: All tasks complete

- **WHEN** all tasks in the change are marked complete
- **THEN** the skill announces handoff to completion workflow
- **AND** invokes `spool-finishing-a-development-branch` skill

### Requirement: spool-apply-change-proposal has branch safety check

The `spool-apply-change-proposal` skill SHALL NOT start implementation on main/master without explicit user consent.

#### Scenario: On protected branch

- **WHEN** current branch is main or master
- **THEN** the skill warns the user
- **AND** requires explicit consent before proceeding

## REMOVED Requirements

### Requirement: executing-plans skill removed

The `executing-plans` skill SHALL be removed from the spool-skills collection.

#### Scenario: Skill no longer exists

- **WHEN** a user or skill references `executing-plans` or `spool-executing-plans`
- **THEN** the skill is not found
- **AND** users should use `spool-apply-change-proposal` instead

## MODIFIED Requirements

### Requirement: writing-plans references spool-apply-change-proposal

The `writing-plans` skill SHALL reference `spool-apply-change-proposal` for execution instead of `executing-plans`.

#### Scenario: Handoff guidance

- **WHEN** `writing-plans` completes a task list
- **THEN** it directs the user to `spool-apply-change-proposal` for execution

### Requirement: subagent-driven-development uses modern references

The `subagent-driven-development` skill SHALL NOT reference deprecated `superpowers:*` syntax.

#### Scenario: Modern skill references

- **WHEN** `subagent-driven-development` references other skills
- **THEN** it uses `spool-*` prefixed names without `superpowers:` prefix
