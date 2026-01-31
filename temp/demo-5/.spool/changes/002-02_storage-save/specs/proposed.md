# Storage Save Proposed Spec

## ADDED Requirements

### Requirement: Save tasks to disk

The storage module MUST save tasks to `temp/demo-5/.data/tasks.txt` using the core line format and an atomic temp-file rename.

#### Scenario: Save tasks

- **GIVEN** a task list with one task id 1 text "buy milk"
- **WHEN** saving tasks
- **THEN** the data file contains `1|0|buy milk`
