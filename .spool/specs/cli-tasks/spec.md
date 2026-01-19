# CLI Tasks Specification

## Purpose

The `spool tasks` command group provides enhanced task management capabilities for change execution, including waves, verification criteria, completion tracking, and status management optimized for long-running AI-assisted development.

## Requirements

### Requirement: Tasks initialization

The CLI SHALL initialize an enhanced tasks.md file in a change directory with structured format for waves, verification, and status tracking.

#### Scenario: Initialize tasks for a change

- **WHEN** executing `spool tasks init <change-id>`
- **THEN** create `.spool/changes/<change-id>/tasks.md` if it does not exist
- **AND** generate the enhanced tasks format with:
  - Header section with change ID, tool compatibility notes, and execution mode
  - Wave 1 section with placeholder tasks
  - Instructions for adding waves, verification commands, and status tracking
- **AND** display a success message with the path to the tasks file
- **AND** print guidance on how to structure tasks with waves, dependencies, verification, and done-when criteria
- **AND** display an error if the change directory does not exist

### Requirement: Tasks status display

The CLI SHALL display the current status of all tasks in a change, including wave progress and completion counts.

#### Scenario: Show tasks status

- **WHEN** executing `spool tasks status <change-id>`
- **THEN** parse `.spool/changes/<change-id>/tasks.md`
- **AND** extract all tasks with their wave, status, dependencies, and done-when criteria
- **AND** display a summary showing:
  - Total number of tasks
  - Number of tasks by status (pending, in-progress, complete)
  - Current wave and wave progress
  - Next task(s) ready to execute (dependencies satisfied)
- **AND** display a table with tasks grouped by wave showing status, files affected, and dependencies
- **AND** print an error if the tasks file does not exist

### Requirement: Task execution management

The CLI SHALL provide commands to start, complete, and move to the next task, with automatic dependency validation.

#### Scenario: Start a task

- **WHEN** executing `spool tasks start <change-id> <task-id>`
- **THEN** read `.spool/changes/<change-id>/tasks.md`
- **AND** find the task with the specified ID
- **AND** verify that all dependencies for the task have status "complete"
- **AND** update the task status to "in-progress"
- **AND** write the updated tasks.md file
- **AND** display a confirmation that the task has been started
- **AND** print an error if the task ID is not found
- **AND** print an error if any dependencies are not complete

#### Scenario: Complete a task

- **WHEN** executing `spool tasks complete <change-id> <task-id>`
- **THEN** read `.spool/changes/<change-id>/tasks.md`
- **AND** find the task with the specified ID
- **AND** update the task status to "complete"
- **AND** update the timestamp for the task
- **AND** write the updated tasks.md file
- **AND** display a confirmation that the task has been completed
- **AND** print an error if the task ID is not found

#### Scenario: Move to next task

- **WHEN** executing `spool tasks next <change-id>`
- **THEN** read `.spool/changes/<change-id>/tasks.md`
- **AND** find all tasks with status "pending" that have all dependencies marked "complete"
- **AND** display the list of ready tasks with their IDs, descriptions, and affected files
- **AND** if exactly one ready task exists, automatically start it and display confirmation
- **AND** if multiple ready tasks exist, display them and ask user which to start
- **AND** if no ready tasks exist, display a message indicating all complete or blockers remain

### Requirement: Task structure validation

The CLI SHALL validate that tasks.md follows the enhanced format and provide guidance on corrections.

#### Scenario: Validate tasks file

- **WHEN** the tasks file is loaded or modified
- **THEN** check that the file includes required sections: header, waves, tasks
- **AND** verify that each task has: ID, description, files, dependencies (or "None"), action, verify, done-when, status
- **AND** check that status values are valid: pending, in-progress, complete
- **AND** display warnings for any structural issues found
- **AND** suggest corrections and provide examples

### Requirement: Wave management

The CLI SHALL support organizing tasks into waves that enable parallel execution and checkpointing.

#### Scenario: Add a wave

- **WHEN** editing tasks.md to add a new wave
- **THEN** ensure the wave has a clear number and optional description
- **AND** specify dependencies on previous waves (e.g., "after Wave 1 complete")
- **AND** include tasks under the wave with proper hierarchy
- **AND** support checkpoint tasks that require human approval

#### Scenario: Wave dependency validation

- **WHEN** executing `spool tasks next <change-id>` or `spool tasks start <change-id> <task-id>`
- **THEN** check that all tasks in previous waves are complete before allowing tasks in the current wave to start
- **AND** display an error if a previous wave has incomplete tasks
- **AND** list which tasks in previous waves need to be completed first

### Requirement: Verification integration

The CLI SHALL support executing verification commands to validate task completion.

#### Scenario: Verify task completion

- **WHEN** completing a task with a verification command specified
- **THEN** prompt user whether to run the verification command
- **AND** if user confirms, execute the command and display output
- **AND** if the command succeeds (exit code 0), mark the task as complete
- **AND** if the command fails (non-zero exit code), ask user whether to still mark the task as complete
- **AND** display the verification command and its output for user review

### Requirement: Status tracking

The CLI SHALL maintain accurate status tracking for all tasks and support status transitions.

#### Scenario: Validate status transitions

- **WHEN** a task status is updated
- **THEN** verify that the transition is valid:
  - pending → in-progress
  - in-progress → complete
  - complete (no transitions allowed)
- **AND** display an error for invalid status transitions
- **AND** maintain status history if specified in the task format

#### Scenario: Display task progress

- **WHEN** executing `spool tasks status <change-id>`
- **THEN** calculate and display overall progress percentage based on completed tasks
- **AND** show wave-specific progress percentages
- **AND** indicate estimated time remaining if duration information is available

### Requirement: Error handling

The CLI SHALL provide clear error messages and recovery suggestions when tasks commands encounter issues.

#### Scenario: Tasks file cannot be read

- **WHEN** `.spool/changes/<change-id>/tasks.md` cannot be read due to permissions or missing file
- **THEN** display an error message explaining the failure
- **AND** suggest checking file permissions or running `spool tasks init <change-id>` if the file is missing
- **AND** exit with code 1

#### Scenario: Tasks file is malformed

- **WHEN** tasks.md exists but has unexpected or malformed content
- **THEN** display an error message indicating parsing failed
- **AND** suggest running `spool tasks init <change-id>` to recreate with proper format
- **AND** provide specific details about what was malformed

#### Scenario: Task not found

- **WHEN** executing `spool tasks start <change-id> <task-id>` or complete with an invalid task ID
- **THEN** display an error message that the task ID was not found
- **AND** list available task IDs in the change
- **AND** suggest running `spool tasks status <change-id>` to see all tasks

### Requirement: Template quality

The CLI SHALL generate high-quality tasks templates that provide clear guidance for structuring waves, dependencies, verification, and status tracking.

#### Scenario: Tasks template includes required structure

- **WHEN** generating tasks.md
- **THEN** include a header section with change ID, tool compatibility notes, and execution mode
- **AND** include at least one wave with example tasks showing the full structure
- **AND** for each example task, include: ID, description, files, dependencies, action, verify, done-when, and status
- **AND** provide inline comments or guidance explaining each field
- **AND** include a section explaining waves and checkpoint tasks
- **AND** follow the format documented in project-planning-research-proposal.md

#### Scenario: Example task shows all fields

- **WHEN** generating example tasks in the template
- **THEN** include a complete example task with realistic content
- **AND** demonstrate proper dependency specification (e.g., "None" or task IDs)
- **AND** show a verification command with clear syntax
- **AND** provide a meaningful "done-when" criterion
- **AND** set status to "pending" for all example tasks

## Why

Enhanced task management is essential for long-running AI-assisted development where work spans multiple sessions and requires explicit verification. These commands provide:

1. **Wave-based execution**: Group tasks into parallelizable chunks and enforce dependencies
2. **Explicit verification**: Define verification commands to validate task completion
3. **Status tracking**: Maintain progress across sessions and enable resumption
4. **Done-when clarity**: Clear acceptance criteria prevent ambiguity
5. **Checkpoint support**: Pause for human review before proceeding

Without these tools, teams must use simple checklists that lack verification, dependencies, and status persistence, leading to incomplete work, missed requirements, and difficulty resuming after interruptions.
