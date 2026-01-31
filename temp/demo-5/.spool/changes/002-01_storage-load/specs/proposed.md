# Storage Load Proposed Spec

## ADDED Requirements

### Requirement: Load tasks from disk

The storage module MUST load tasks from `temp/demo-5/.data/tasks.txt` using the core line format.

#### Scenario: Load tasks

- **GIVEN** a data file containing `1|0|buy milk`
- **WHEN** loading tasks
- **THEN** the task list contains one task with id 1, done false, text "buy milk"
