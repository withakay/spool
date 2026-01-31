# Cli Init Specification

## Purpose

Define the `cli-init` capability, including required behavior and validation scenarios, so it remains stable and testable.


## Requirements

### Requirement: Worktree workspace layout (opt-in)

`spool init` SHALL support an opt-in mode that prepares a Git worktree-based workspace layout under the repository root.

#### Scenario: Initialize in worktree mode
- **WHEN** the user runs `spool init` with worktree mode enabled
- **THEN** Spool prepares a workspace layout that includes a default-branch worktree at `./main`
- **AND** the layout is created without modifying tracked project files beyond normal Spool initialization outputs

#### Scenario: Worktree mode is idempotent
- **GIVEN** the repository already has a `./main` worktree created by Spool
- **WHEN** the user runs `spool init` again with worktree mode enabled
- **THEN** Spool does not create duplicate worktrees
- **AND** Spool reports that the workspace layout is already configured
