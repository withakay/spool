# Task Ops Proposed Spec

## ADDED Requirements

### Requirement: Provide task operation helpers

The core module MUST expose helpers to add a task, mark a task done by id, and remove a task by id.

#### Scenario: Manage task list

- **WHEN** adding a task to an empty list
- **THEN** the new task has id 1 and done false
- **WHEN** marking id 1 done
- **THEN** the task is done
- **WHEN** removing id 1
- **THEN** the list no longer includes that task
