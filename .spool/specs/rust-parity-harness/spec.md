# rust-parity-harness Specification

## Purpose
Provide a Rust parity test harness that executes the TypeScript CLI (oracle) and Rust CLI (candidate) and compares results deterministically.

## Requirements

### Requirement: Harness can run oracle and candidate

Parity tests MUST be able to execute both CLIs with the same arguments and capture stdout, stderr, and exit code.

#### Scenario: Execute both CLIs
- **WHEN** the parity harness runs a command with args
- **THEN** it MUST execute the TypeScript CLI and capture stdout/stderr/exit code
- **AND** it MUST execute the Rust CLI and capture stdout/stderr/exit code

### Requirement: Parity comparisons are deterministic

Parity tests MUST avoid nondeterminism by controlling environment and normalizing outputs.

#### Scenario: Normalized outputs compare consistently
- **WHEN** the parity harness compares outputs
- **THEN** ANSI codes MUST be removed when color is disabled
- **AND** unstable path segments (like temp dirs) MUST be normalized if present

### Requirement: Baseline parity tests exist

The workspace MUST include parity tests for `--help`, `--version`, and at least one non-mutating command.

#### Scenario: Baseline parity tests pass
- **WHEN** running `cargo test --workspace`
- **THEN** parity tests for `spool --help` MUST pass
- **AND** parity tests for `spool --version` MUST pass
- **AND** parity tests for one non-mutating command MUST pass
