# Spool Stats Specification

## Purpose

Define the `spool-stats` capability, including required behavior and validation scenarios, so it remains stable and testable.


## Requirements

### Requirement: Spool provides a local-only stats command

Spool SHALL provide a CLI command that summarizes local usage from execution logs.

#### Scenario: User views command usage

- **WHEN** a user runs `spool stats`
- **THEN** Spool reads local execution logs
- **AND** prints aggregated usage counts grouped by `command_id`

### Requirement: Stats can report unused commands

Spool SHALL be able to report commands with zero observed usage.

#### Scenario: Known commands are enumerated

- **WHEN** `spool stats` renders usage
- **THEN** it includes `command_id` entries for the known CLI entrypoints
- **AND** shows zero counts for commands not present in the logs

### Requirement: Stats are offline and do not require network

`spool stats` MUST operate solely on local data.

#### Scenario: Network unavailable

- **WHEN** a user runs `spool stats` without network connectivity
- **THEN** the command completes successfully (assuming local log access)
