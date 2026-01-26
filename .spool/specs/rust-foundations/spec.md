# rust-foundations Specification

## Purpose

Provide the shared foundations required for the Rust CLI to match TypeScript behavior (ID parsing, spool directory discovery, and config/environment precedence).

## Requirements
### Requirement: Flexible ID parsing matches TypeScript

The Rust implementation MUST accept the same flexible ID forms as the TypeScript CLI.

#### Scenario: Parse module and change identifiers
- **WHEN** the Rust ID parser is given numeric and full-name forms
- **THEN** it MUST resolve to the same canonical ID as the TypeScript implementation

### Requirement: Spool directory discovery matches TypeScript

The Rust implementation MUST resolve the same spool directory path as the TypeScript CLI for a given project root.

#### Scenario: Resolve spool path from working directory (no ancestor search)
- **WHEN** the Rust CLI is run from a subdirectory
- **THEN** it MUST resolve the same spool directory path as TypeScript

### Requirement: Config and environment precedence matches TypeScript

The Rust implementation MUST apply the same precedence rules as TypeScript for global flags and environment variables.

#### Scenario: `--no-color` and `NO_COLOR`
- **WHEN** `NO_COLOR=1` is set
- **THEN** output MUST be uncolored
- **WHEN** `--no-color` is passed
- **THEN** output MUST be uncolored regardless of other settings
