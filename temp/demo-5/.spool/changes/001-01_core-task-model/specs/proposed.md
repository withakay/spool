# Task Model Proposed Spec

## ADDED Requirements

### Requirement: Provide a line-based task format

The core module MUST format and parse tasks as `id|0|text` where `0` means not done and `1` means done.

#### Scenario: Format and parse task lines

- **WHEN** formatting a task with id 1, text "buy milk", done false
- **THEN** the stored line is `1|0|buy milk`
- **WHEN** parsing `1|1|buy milk`
- **THEN** the task has id 1, done true, text "buy milk"
