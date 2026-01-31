# Proposal

## Why

- Establish a Rust CLI crate so subsequent core and storage changes have a build target.
- Keep the CLI surface small while validating Spool workflow.

## What Changes

- Initialize a `todo-demo` binary crate under `temp/demo-5`.
- Add clap derive dependency and define subcommand scaffolding.

## Impact

- Affects `Cargo.toml` and `src/main.rs`.
