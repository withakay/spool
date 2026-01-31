# CLI Scaffold Proposed Spec

## ADDED Requirements

### Requirement: Provide a base Rust CLI crate

The project includes a `todo-demo` cargo binary that MUST use clap-based subcommands for add, list, done, and rm.

#### Scenario: Base CLI builds

- **WHEN** running `cargo build` in `temp/demo-5`
- **THEN** the binary compiles without errors
