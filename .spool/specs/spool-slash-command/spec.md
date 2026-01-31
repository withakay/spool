# Spool Slash Command Specification

## Purpose

Define the `spool-slash-command` capability, including required behavior and validation scenarios, so it remains stable and testable.


## Requirements

### Requirement: Automatic installation during spool init

The spool.md slash command MUST be automatically installed in the agent harness when spool init is run. The installation SHALL place the command file in the correct location for the harness to recognize it.

#### Scenario: Slash command installed during init

- **WHEN** user runs 'spool init'
- **THEN** spool installs spool.md slash command to `.opencode/commands/spool.md`
- **AND** command file is created with proper format
- **AND** agent harness recognizes the command
- **AND** user can invoke '/spool <command>' syntax

#### Scenario: Command file creation

- **WHEN** spool init creates the slash command
- **THEN** file path is `.opencode/commands/spool.md`
- **AND** file contains slash command metadata and invocation logic
- **AND** file has correct permissions for agent harness to read
