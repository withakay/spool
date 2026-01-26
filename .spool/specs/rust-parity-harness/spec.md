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

### Requirement: Harness compares outputs and exit codes

The harness MUST be able to execute both CLIs and compare stdout, stderr, and exit code.

#### Scenario: Compare help output
- **WHEN** the harness runs `spool --help` via TypeScript and Rust
- **THEN** it records stdout/stderr and exit codes
- **AND** the parity test fails if any differ

### Requirement: Harness supports fixture repositories

The harness MUST run commands inside isolated fixture repos and support deterministic snapshots.

#### Scenario: Run list in a fixture repo
- **WHEN** the harness runs `spool list --json` in a fixture directory
- **THEN** it captures stable JSON output for comparison

### Requirement: Harness can test interactive flows via PTY

The harness MUST support PTY-driven tests for commands that require TTY interaction.

#### Scenario: Interactive command is executed under PTY
- **WHEN** a parity test marks a command as interactive
- **THEN** it runs it under a PTY and can feed deterministic input

