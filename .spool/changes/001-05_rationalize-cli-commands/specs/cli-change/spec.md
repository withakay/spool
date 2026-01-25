## ADDED Requirements

### Requirement: Deprecated change command is hidden

The CLI SHALL treat `spool change ...` as a deprecated noun-based entrypoint.

#### Scenario: Deprecated change command remains callable
- **WHEN** users execute `spool change <subcommand>`
- **THEN** the command executes successfully with its existing behavior
- **AND** prints a deprecation warning pointing to verb-first alternatives (e.g., `spool show`, `spool list`, `spool validate`)

#### Scenario: Deprecated change command is not shown in help
- **WHEN** users execute `spool --help`
- **THEN** `change` is not listed as a top-level command

#### Scenario: Deprecated change command is not suggested in completion
- **WHEN** users use shell completion
- **THEN** `change` is not suggested as a top-level command
