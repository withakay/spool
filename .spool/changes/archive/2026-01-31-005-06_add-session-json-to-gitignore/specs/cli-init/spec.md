## ADDED Requirements

### Requirement: Gitignore local session state

`spool init` SHALL ensure the repository root `.gitignore` ignores `.spool/session.json`.

#### Scenario: Adding ignore entry during initialization
- **WHEN** `spool init` completes successfully
- **THEN** the repository root `.gitignore` file contains a line `.spool/session.json`

#### Scenario: Creating .gitignore when missing
- **GIVEN** the repository root `.gitignore` file does not exist
- **WHEN** `spool init` completes successfully
- **THEN** `.gitignore` is created
- **AND** the created `.gitignore` contains a line `.spool/session.json`

#### Scenario: Idempotent ignore entry
- **GIVEN** the repository root `.gitignore` file already contains a line `.spool/session.json`
- **WHEN** `spool init` runs again
- **THEN** `.gitignore` is not modified
