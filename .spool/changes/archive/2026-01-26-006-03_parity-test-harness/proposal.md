## Why

Strict parity is only practical if we can continuously compare the Rust CLI against the existing TypeScript CLI across outputs, exit codes, and filesystem side effects.

## What Changes

- Build a Rust test harness that:
  - runs the TypeScript `spool` (oracle)
  - runs the Rust `spool` (candidate)
  - compares stdout/stderr/exit codes and selected filesystem diffs
- Add initial parity tests for `--help`, `--version`, and one non-mutating command.

## Capabilities

### New Capabilities

- `rust-parity-harness`: Rust parity test harness for comparing TS vs Rust `spool`.

### Modified Capabilities

<!-- None. New test infrastructure. -->

## Impact

- Adds test-support code under `spool-rs/crates/spool-test-support/`.
- Adds parity integration tests under `spool-rs/crates/spool-cli/tests/`.
