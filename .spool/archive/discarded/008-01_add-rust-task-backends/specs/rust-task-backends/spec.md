## ADDED Requirements

### Requirement: Rust task backend abstraction

The spool-rs implementation SHALL provide a backend abstraction for task tracking that decouples task storage (e.g. markdown files, Taskwarrior) from task consumers (e.g. workflow progress and readiness evaluation).

#### Scenario: List tasks via backend

- **WHEN** the workflow requests tasks for a given change scope
- **THEN** the selected backend returns a list of tasks with stable identifiers, titles, and statuses

### Requirement: Enhanced tasks.md backend support

The spool-rs implementation SHALL support Spool’s enhanced `tasks.md` format as a first-party backend, including waves, task IDs, statuses, and dependency validation sufficient to compute readiness and progress.

#### Scenario: Readiness and dependency validation

- **WHEN** a task declares dependencies on other tasks
- **THEN** the backend surfaces dependency relationships such that the workflow can mark tasks blocked until dependencies are complete

### Requirement: Task status updates

The spool-rs implementation SHALL support updating task status via the backend without losing task metadata.

#### Scenario: Mark a task complete

- **WHEN** a task’s status is set to `complete`
- **THEN** subsequent reads reflect the updated status and preserve the task’s title and metadata fields

### Requirement: Optional Taskwarrior backend

The spool-rs implementation SHALL provide an optional backend implementation for Taskwarrior that uses the local `task` CLI to list and update tasks scoped to a Spool change.

#### Scenario: Taskwarrior backend selected but Taskwarrior missing

- **WHEN** the Taskwarrior backend is selected and the `task` binary is not available
- **THEN** Spool fails with a clear error describing how to install Taskwarrior or switch backends
