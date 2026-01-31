## ADDED Requirements

### Requirement: Configure worktree workspace defaults

The config command SHALL allow setting and retrieving configuration keys related to worktree workspace behavior.

#### Scenario: Set default branch for worktrees
- **WHEN** the user executes `spool config set worktrees.defaultBranch <value>`
- **THEN** Spool stores the value in global configuration

#### Scenario: Set local file copy patterns
- **WHEN** the user executes `spool config set worktrees.localFiles <json-array>`
- **THEN** Spool stores the list in global configuration
- **AND** the list is used when generating worktree-aware apply instructions
