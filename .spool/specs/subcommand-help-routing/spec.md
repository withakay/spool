# Subcommand Help Routing Specification

## Purpose

Define the `subcommand-help-routing` capability, including required behavior and validation scenarios, so it remains stable and testable.


## Requirements

### Requirement: Help flag works at every command level

The system SHALL display context-appropriate help when `-h` or `--help` is passed at any command or subcommand level.

#### Scenario: Subcommand help shows subcommand details

- **WHEN** user runs `spool agent instruction -h`
- **THEN** the system SHALL display help for `agent instruction` (not parent `agent` help)
- **AND** the help SHALL include all options specific to `instruction`

#### Scenario: Parent command help shows parent details

- **WHEN** user runs `spool agent -h`
- **THEN** the system SHALL display help for `agent` command
- **AND** the help SHALL list available subcommands

#### Scenario: Deeply nested subcommand help

- **WHEN** a command has deeply nested subcommands (e.g., `spool tasks status`)
- **AND** user runs `spool tasks status -h`
- **THEN** the system SHALL display help specific to `tasks status`

### Requirement: Help flag position is flexible

The system SHALL recognize help flags regardless of position in the argument list.

#### Scenario: Help flag at end

- **WHEN** user runs `spool agent instruction --change foo -h`
- **THEN** the system SHALL display help for `agent instruction`

#### Scenario: Help flag at beginning after command

- **WHEN** user runs `spool agent -h instruction`
- **THEN** the system SHALL display help for `agent` (not instruction)
- **BECAUSE** `-h` appears before the subcommand is specified
