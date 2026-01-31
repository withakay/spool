## ADDED Requirements

### Requirement: Verb-first module entrypoints

The CLI SHALL expose verb-first command entrypoints for module operations, while keeping `spool module ...` as a deprecated compatibility shim.

#### Scenario: List modules via verb-first command

- **WHEN** user executes `spool list --modules`
- **THEN** behavior matches `spool module list`

#### Scenario: Create module via verb-first command

- **WHEN** user executes `spool create module <name>`
- **THEN** behavior matches `spool module new <name>`

#### Scenario: Show module via verb-first command

- **WHEN** user executes `spool show module <id>`
- **THEN** behavior matches `spool module show <id>`

#### Scenario: Validate module via verb-first command

- **WHEN** user executes `spool validate module <id>`
- **THEN** behavior matches `spool module validate <id>`

#### Scenario: Deprecated module shim remains callable

- **WHEN** user executes `spool module <subcommand>`
- **THEN** the command executes successfully
- **AND** prints a deprecation warning pointing to the equivalent verb-first command
