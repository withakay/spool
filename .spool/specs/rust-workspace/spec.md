# rust-workspace Specification

## Purpose

Define the Rust `spool-rs/` Cargo workspace layout and baseline quality gates for the port.

## Requirements

### Requirement: Workspace exists at `spool-rs/` and passes baseline checks

The repository MUST contain a Cargo workspace rooted at `spool-rs/` and it MUST be formatted, lint-clean, and testable.

#### Scenario: Workspace is present and builds

- **WHEN** running workspace checks in `spool-rs/`
- **THEN** `cargo test --workspace` MUST pass
- **AND** `cargo fmt --check` MUST pass
- **AND** `cargo clippy --workspace -- -D warnings` MUST pass

### Requirement: Planned crate directories exist

The workspace MUST include crate directories for the planned port layers.

#### Scenario: Crate directories exist

- **WHEN** inspecting `spool-rs/crates/`
- **THEN** `spool-cli` MUST exist
- **AND** `spool-core` MUST exist
- **AND** `spool-fs` MUST exist
- **AND** `spool-templates` MUST exist
- **AND** `spool-schemas` MUST exist
- **AND** `spool-workflow` MUST exist
- **AND** `spool-harness` MUST exist
- **AND** `spool-test-support` MUST exist

### Requirement: Coverage command is documented

The workspace MUST document a command to measure coverage across the workspace.

#### Scenario: Coverage documentation exists

- **WHEN** reading `spool-rs/README.md`
- **THEN** it MUST include a coverage command (for example, `cargo llvm-cov --workspace`)

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
