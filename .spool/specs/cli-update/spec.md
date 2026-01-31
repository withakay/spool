# Cli Update Specification

## Purpose

Define the `cli-update` capability, including required behavior and validation scenarios, so it remains stable and testable.


## Requirements

### Requirement: Update refreshes harness wrappers without duplicating instruction bodies

`spool update` SHALL refresh the managed blocks of harness prompt/command files so they remain thin wrappers that delegate to `spool agent instruction <artifact>` rather than embedding large duplicated instruction bodies.

#### Scenario: Refreshing OpenCode wrapper keeps delegation pattern

- **GIVEN** `.opencode/commands/` contains Spool command files
- **WHEN** a user runs `spool update`
- **THEN** each file's managed block SHALL be refreshed to delegate to `spool agent instruction <artifact>`
