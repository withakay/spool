## Purpose

Provide a canonical set of `.spool/` path builders in `spool-core` so other crates do not duplicate path construction.


## Requirements

### Requirement: Canonical path builder for `.spool/` root

The system SHALL provide a reusable API that returns the `.spool/` root for a workspace.

#### Scenario: Compute spool root

- **GIVEN** a workspace root directory
- **WHEN** requesting the spool root
- **THEN** the API returns `<root>/.spool`

### Requirement: Canonical path builders for key directories

The system SHALL provide reusable APIs for commonly used directories.

#### Scenario: Compute changes and modules directories

- **GIVEN** a spool root
- **WHEN** requesting changes and modules directories
- **THEN** the API returns `<spool>/changes` and `<spool>/modules`

### Requirement: Call sites avoid string-based path formatting

Call sites SHALL avoid `format!("{}/...", path.display())` for constructing filesystem paths.

#### Scenario: Spec path construction

- **GIVEN** a spec id
- **WHEN** constructing the spec file path
- **THEN** code uses `PathBuf::join` (or equivalent) rather than string formatting
