# Spec Delta: rust-foundations

## Purpose

Provide the shared foundations for the Rust CLI to match TypeScript behavior.

## ADDED Requirements

### Requirement: IDs are parsed and rendered identically

Rust MUST parse change IDs, module IDs, and spec IDs with the same accepted formats and produce the same normalization as TypeScript.

#### Scenario: Parse a change id with prefix
- **WHEN** the user supplies `006-05_port-list-show-validate`
- **THEN** Rust resolves it to the same on-disk path as TypeScript

### Requirement: Spool directory discovery matches TypeScript

Rust MUST resolve the spool directory (default `.spool`) and support any overrides supported by TypeScript.

#### Scenario: Default spool directory
- **WHEN** no override is provided
- **THEN** Rust uses `.spool` in the current repo

### Requirement: Output controls match (`--json`, `--no-color`, `NO_COLOR`)

Rust MUST match TypeScript output modes for JSON vs text and color enablement.

#### Scenario: NO_COLOR disables ANSI styling
- **WHEN** `NO_COLOR` is set in the environment
- **THEN** Rust produces the same uncolored output as TypeScript
