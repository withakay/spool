## ADDED Requirements

### Requirement: Rust init matches TypeScript init interaction model

`spoolrs init` SHALL follow the same interaction model as the TypeScript CLI `spool init` as defined by the `cli-init` capability, specifically:

- If `--tools` is not provided and the command is running interactively, `spoolrs init` SHALL prompt the user to select tools.
- If `--tools` is provided, `spoolrs init` SHALL run non-interactively and MUST NOT prompt.

#### Scenario: Interactive selection when tools not provided

- **WHEN** the user runs `spoolrs init` in an interactive session without `--tools`
- **THEN** `spoolrs` prompts for which tools to configure and installs only the selected tools

#### Scenario: Non-interactive init when tools are provided

- **WHEN** the user runs `spoolrs init --tools all`
- **THEN** `spoolrs` configures all supported tools without prompting

### Requirement: Rust init supports the same --tools values and validation

`spoolrs init` SHALL accept the same `--tools` values and validation rules as the TypeScript CLI:

- `all`
- `none`
- a comma-separated list of tool IDs

`spoolrs init` MUST fail with a clear error message when `--tools` is provided but empty, or when any tool ID is unknown.

#### Scenario: Empty --tools value is rejected

- **WHEN** the user runs `spoolrs init --tools ""`
- **THEN** the command fails with an error describing valid `--tools` values

#### Scenario: Unknown tool ID is rejected

- **WHEN** the user runs `spoolrs init --tools "not-a-tool"`
- **THEN** the command fails with an error naming the unknown ID and listing available tool IDs

### Requirement: Rust init supports fresh and extend modes

`spoolrs init` SHALL support both:

- **Fresh init**: `.spool/` does not exist yet.
- **Extend mode**: `.spool/` exists and additional tools can be configured without reinitializing everything.

#### Scenario: Extend mode keeps existing tools configured

- **WHEN** `.spool/` already exists and the user runs `spoolrs init` (interactive) and selects additional tools
- **THEN** already-configured tools remain configured and only the newly selected tools are added/updated
