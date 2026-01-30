## Overview

This change refactors the Rust CLI implementation to reduce duplication and centralize repeated patterns.

## Architecture

Add a small internal module (or modules) in `spool-rs/crates/spool-cli/src/` that provides:

- a shared `CliError` type (wrapping common error sources)
- a `type CliResult<T> = Result<T, CliError>`
- helper functions for:
  - printing diagnostics with `path:line` formatting
  - consistent error printing and exit codes
  - shared patterns like "read file -> parse -> block on errors"

The existing command dispatch remains, but individual handlers stop owning printing/exiting logic.

## Implementation Strategy

1) Introduce `cli_error.rs` (or similar) with `CliError` + conversions.
2) Introduce `diagnostics.rs` helper for printing `TaskDiagnostic` / validation issues consistently.
3) Refactor the highest-duplication command paths first (tasks + validate), then proceed to other subcommands.
4) Keep behavior stable by retaining existing messages where possible, only making output more consistent.

## What NOT to Change

- Do not change `.spool/` filesystem layout.
- Do not change tasks/spec formats.
- Do not switch argument parsing libraries.

## Testing Strategy

- Unit tests for helpers (formatting and failure paths).
- Integration tests for `spool-cli` subcommands to ensure exit codes and key outputs remain stable.
