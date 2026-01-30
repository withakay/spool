# rust-parity-harness Specification

## Purpose
Provide Rust-only tests/harness utilities that validate the CLI contract deterministically (stdout/stderr/exit codes and filesystem side effects).
## Requirements
### Requirement: Harness can execute the CLI and capture outputs

Tests MUST be able to execute the Rust CLI with arguments and capture stdout, stderr, and exit code.

#### Scenario: Execute CLI
- WHEN the harness runs a command with args
- THEN it MUST execute the Rust CLI and capture stdout/stderr/exit code

### Requirement: Parity comparisons are deterministic

Tests MUST avoid nondeterminism by controlling environment and normalizing outputs.

#### Scenario: Normalized outputs compare consistently
- WHEN the harness compares outputs
- THEN ANSI codes MUST be removed when color is disabled
- AND unstable path segments (like temp dirs) MUST be normalized if present

### Requirement: Baseline parity tests exist

The workspace MUST include tests for `--help`, `--version`, and at least one non-mutating command.

#### Scenario: Baseline parity tests pass
- WHEN running `cargo test --workspace`
- THEN tests for `spool --help` MUST pass
- AND tests for `spool --version` MUST pass
- AND tests for one non-mutating command MUST pass

### Requirement: Harness compares outputs and exit codes

The harness MUST be able to compare stdout, stderr, and exit code.

#### Scenario: Compare help output
- WHEN the harness runs `spool --help`
- THEN it records stdout/stderr and exit codes
- AND the test fails if any differ from expected

### Requirement: Harness supports fixture repositories

The harness MUST run commands inside isolated fixture repos and support deterministic snapshots.

#### Scenario: Run list in a fixture repo
- WHEN the harness runs `spool list --json` in a fixture directory
- THEN it captures stable JSON output for comparison

### Requirement: Harness can test interactive flows via PTY

The harness MUST support PTY-driven tests for commands that require TTY interaction.

#### Scenario: Interactive command is executed under PTY
- WHEN a test marks a command as interactive
- THEN it runs it under a PTY and can feed deterministic input
