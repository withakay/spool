# spool-slash-command Specification

## Purpose
TBD - created by archiving change 001-03_add-spool-skill. Update Purpose after archive.
## Requirements
### Requirement: Automatic installation during spool init
The spool.md slash command MUST be automatically installed in the agent harness when spool init is run. The installation SHALL place the command file in the correct location for the harness to recognize it.

#### Scenario: Slash command installed during init
- **WHEN** user runs 'spool init'
- **THEN** spool installs spool.md slash command to `.opencode/command/spool.md`
- **AND** command file is created with proper format
- **AND** agent harness recognizes the command
- **AND** user can invoke '/spool <command>' syntax

#### Scenario: Command file creation
- **WHEN** spool init creates the slash command
- **THEN** file path is `.opencode/command/spool.md`
- **AND** file contains slash command metadata and invocation logic
- **AND** file has correct permissions for agent harness to read

### Requirement: Slash command syntax and parsing
The spool.md slash command SHALL parse commands in the format '/spool <command> [args...]' and invoke the spool skill with the extracted command and arguments.

#### Scenario: Simple command parsing
- **WHEN** user types '/spool dashboard'
- **THEN** slash command extracts command as 'view'
- **AND** invokes spool skill with arguments ['view']
- **AND** spool skill handles routing

#### Scenario: Command with arguments parsing
- **WHEN** user types '/spool archive 123-45 --json'
- **THEN** slash command extracts command as 'archive'
- **AND** extracts arguments as ['123-45', '--json']
- **AND** invokes spool skill with arguments ['archive', '123-45', '--json']

#### Scenario: No arguments provided
- **WHEN** user types '/spool'
- **THEN** slash command detects missing command
- **AND** outputs usage information
- **AND** does not invoke spool skill

### Requirement: Output formatting
The spool.md slash command SHALL display output from the spool skill in a formatted manner suitable for the agent harness interface. The output MUST preserve markdown formatting and code blocks.

#### Scenario: Successful command output
- **WHEN** spool skill returns successful output
- **THEN** slash command displays output in harness
- **AND** markdown formatting is preserved
- **AND** code blocks are properly rendered
- **AND** response is clearly identified as spool output

#### Scenario: Error output formatting
- **WHEN** spool skill returns error output
- **THEN** slash command displays error in harness
- **AND** error is clearly distinguished from success output
- **AND** error details are preserved for debugging

### Requirement: Integration with agent harness
The spool.md slash command SHALL integrate seamlessly with agent harnesses (e.g., opencode) by following the harness's slash command format and conventions.

#### Scenario: Harness discovers slash command
- **WHEN** agent harness loads available commands
- **THEN** harness discovers spool.md slash command
- **AND** command is available via '/spool' syntax
- **AND** command appears in command list or help

#### Scenario: Harness invokes slash command
- **WHEN** user types '/spool dashboard change-123'
- **THEN** harness routes to spool.md slash command
- **AND** slash command invokes spool skill
- **AND** output is returned to harness for display

### Requirement: Manual installation support
The spool.md slash command MUST support manual installation via 'spool install spool' command for cases where automatic installation failed or needs to be reinstalled.

#### Scenario: Manual install command
- **WHEN** user runs 'spool install spool'
- **THEN** command installs spool.md to `.opencode/command/spool.md`
- **AND** reports successful installation
- **AND** slash command is immediately available

#### Scenario: Reinstall command
- **WHEN** spool.md slash command already exists
- **AND** user runs 'spool install spool'
- **THEN** command overwrites existing spool.md
- **AND** reports successful reinstallation
- **AND** latest version is installed

### Requirement: Command help and usage
The spool.md slash command SHALL provide help information when invoked with '--help' or '-help' flag. The help SHALL display available commands and usage examples.

#### Scenario: Help command
- **WHEN** user types '/spool --help'
- **THEN** slash command displays usage information
- **AND** shows command syntax
- **AND** lists common spool commands with brief descriptions
- **AND** provides examples of usage

#### Scenario: Unknown command help
- **WHEN** user types '/spool unknown-command'
- **AND** spool skill reports invalid command
- **THEN** output includes suggestion to use '--help'
- **AND** user is guided to available commands

