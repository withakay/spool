# Spec Delta: rust-workspace

## Purpose

Create the Rust `spool-rs/` workspace and baseline tooling required for the port.

## ADDED Requirements

### Requirement: Cargo workspace exists with defined crate structure

The repository MUST include a Cargo workspace at `spool-rs/` with the agreed crate structure.

#### Scenario: Workspace layout exists
- **WHEN** a developer lists `spool-rs/`
- **THEN** it contains a workspace `Cargo.toml` and `crates/`
- **AND** the crates include `spool-cli`, `spool-core`, `spool-fs`, `spool-templates`, `spool-test-support`

### Requirement: Baseline quality tooling is runnable

The workspace MUST support formatting, clippy linting, tests, and coverage measurement.

#### Scenario: Tooling commands succeed
- **WHEN** a developer runs formatting, clippy, and tests
- **THEN** `cargo fmt --check`, `cargo clippy --workspace`, and `cargo test --workspace` succeed

#### Scenario: Coverage command is documented
- **WHEN** a developer reads `spool-rs/README.md`
- **THEN** it documents running `cargo llvm-cov --workspace`
