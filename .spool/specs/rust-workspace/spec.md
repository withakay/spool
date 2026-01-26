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
