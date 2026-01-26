# Spec Delta: rust-foundations

## Purpose

Provide the shared foundations for the Rust CLI to match TypeScript behavior.

## MODIFIED Requirements

### Requirement: Flexible ID parsing matches TypeScript

The Rust implementation MUST accept the same flexible ID forms as the TypeScript CLI.

#### Scenario: Parse module, change, and spec identifiers
- **WHEN** the Rust ID parser is given numeric and full-name forms
- **THEN** it MUST resolve to the same canonical IDs as the TypeScript implementation

### Requirement: Spool directory discovery matches TypeScript

The Rust implementation MUST resolve the same spool directory path as the TypeScript CLI for a given project root.

#### Scenario: Resolve spool path from working directory (no ancestor search)
- **WHEN** the Rust CLI is run from a subdirectory
- **THEN** it MUST resolve the same spool directory path as TypeScript

#### Scenario: Resolve spool path with overrides
- **WHEN** a repo config overrides the spool directory name
- **THEN** Rust MUST resolve the overridden spool directory name

## ADDED Requirements

### Requirement: Output controls match (`--json`, `--no-color`, `NO_COLOR`)

Rust MUST match TypeScript output modes for JSON vs text and color enablement.

#### Scenario: `--json` output is selected
- **WHEN** the user passes `--json`
- **THEN** Rust MUST output the same JSON shape as TypeScript for that command

#### Scenario: NO_COLOR disables ANSI styling
- **WHEN** `NO_COLOR` is set in the environment
- **THEN** Rust produces the same uncolored output as TypeScript
