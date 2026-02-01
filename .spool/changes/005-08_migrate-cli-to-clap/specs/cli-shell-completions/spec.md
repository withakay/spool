## ADDED Requirements

### Requirement: Generate shell completion scripts

The CLI SHALL provide a `completions` subcommand that generates shell completion scripts for popular shells.

#### Scenario: Generate bash completions

- **WHEN** user executes `spool completions bash`
- **THEN** the system SHALL output a valid bash completion script to stdout
- **AND** the script SHALL provide completions for all spool commands, subcommands, and flags

#### Scenario: Generate zsh completions

- **WHEN** user executes `spool completions zsh`
- **THEN** the system SHALL output a valid zsh completion script to stdout
- **AND** the script SHALL provide completions for all spool commands, subcommands, and flags

#### Scenario: Generate fish completions

- **WHEN** user executes `spool completions fish`
- **THEN** the system SHALL output a valid fish completion script to stdout
- **AND** the script SHALL provide completions for all spool commands, subcommands, and flags

#### Scenario: Generate powershell completions

- **WHEN** user executes `spool completions powershell`
- **THEN** the system SHALL output a valid PowerShell completion script to stdout
- **AND** the script SHALL provide completions for all spool commands, subcommands, and flags

#### Scenario: Invalid shell argument

- **WHEN** user executes `spool completions <invalid-shell>`
- **THEN** the system SHALL display an error listing valid shell options
- **AND** SHALL exit with a non-zero status code

### Requirement: Completion scripts support all commands

The generated completion scripts SHALL include completions for all spool commands and their respective subcommands.

#### Scenario: Completions include all top-level commands

- **WHEN** user sources the generated completion script
- **AND** user types `spool <TAB>`
- **THEN** completions SHALL include: `init`, `create`, `list`, `show`, `tasks`, `agent`, `config`, `help`, `completions`

#### Scenario: Completions include subcommands

- **WHEN** user sources the generated completion script
- **AND** user types `spool tasks <TAB>`
- **THEN** completions SHALL include: `status`, `next`, `start`, `complete`, `shelve`, `unshelve`, `add`

#### Scenario: Completions include flags

- **WHEN** user sources the generated completion script
- **AND** user types `spool list --<TAB>`
- **THEN** completions SHALL include applicable flags for the command
