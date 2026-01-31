# CLI Wire Deltas

## ADDED Requirements

### Requirement: Execute CLI commands against storage

The CLI MUST load tasks, apply core operations, and save results for add, list, done, and rm commands.

#### Scenario: Add and list tasks

- **WHEN** running `todo add "buy milk"`
- **THEN** the task list includes a new task and is persisted
- **WHEN** running `todo list`
- **THEN** the output includes the stored task with its id and done marker
