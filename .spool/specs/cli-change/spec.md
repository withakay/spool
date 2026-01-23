# cli-change Specification

## Purpose
TBD - created by archiving change add-change-commands. Update Purpose after archive.
## Requirements
### Requirement: Change Command

The system SHALL provide deprecated `change` command with subcommands for displaying, listing, and validating change proposals, while suggesting verb-first alternatives.

#### Scenario: Show change as JSON

- **WHEN** executing `spool show update-error --json`
- **THEN** parse the markdown change file
- **AND** extract change structure and deltas
- **AND** output valid JSON to stdout

#### Scenario: List all changes

- **WHEN** executing `spool list`
- **THEN** scan the spool/changes directory
- **AND** return list of all pending changes
- **AND** support JSON output with `--json` flag

#### Scenario: Show only requirement changes

- **WHEN** executing `spool show update-error --deltas-only`
- **THEN** display only the requirement changes (ADDED/MODIFIED/REMOVED/RENAMED)
- **AND** exclude why and what changes sections

#### Scenario: Validate change structure

- **WHEN** executing `spool validate update-error`
- **THEN** parse the change file
- **AND** validate against Zod schema
- **AND** ensure deltas are well-formed

### Requirement: Legacy Compatibility

The system SHALL maintain backward compatibility with the deprecated `spool change` noun-based commands while showing deprecation notices.

#### Scenario: Deprecated change commands still work

- **WHEN** executing deprecated commands like `spool change show`, `spool change list`, or `spool change validate`
- **THEN** the commands execute with their original behavior
- **AND** show deprecation notice pointing to verb-first alternatives: `spool show`, `spool list`, or `spool validate`

### Requirement: Interactive show selection

The change show command SHALL support interactive selection when no change name is provided.

#### Scenario: Interactive change selection for show

- **WHEN** executing `spool show` without arguments
- **THEN** display an interactive list of available items (changes and specs)
- **AND** allow the user to select an item type
- **AND** display the selected change content
- **AND** maintain all existing show options (--json, --deltas-only)

#### Scenario: Non-interactive fallback keeps current behavior

- **GIVEN** stdin is not a TTY or `--no-interactive` is provided or environment variable `SPOOL_INTERACTIVE=0`
- **WHEN** executing `spool show` without an item name
- **THEN** do not prompt interactively
- **AND** print a helpful hint with examples
- **AND** set `process.exitCode = 1`

### Requirement: Interactive validation selection

The change validate command SHALL support interactive selection when no change name is provided.

#### Scenario: Interactive change selection for validation

- **WHEN** executing `spool validate` without arguments
- **THEN** display an interactive list of available options (all, changes, specs, or specific item)
- **AND** allow the user to select what to validate
- **AND** validate the selected change

#### Scenario: Non-interactive fallback keeps current behavior

- **GIVEN** stdin is not a TTY or `--no-interactive` is provided or environment variable `SPOOL_INTERACTIVE=0`
- **WHEN** executing `spool validate` without an item name
- **THEN** do not prompt interactively
- **AND** print a helpful hint listing available commands/flags
- **AND** set `process.exitCode = 1`

