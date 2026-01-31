## Overview

This change introduces a small `.spool/` path helper in `spool-core` and migrates call sites to reduce repetition.

## Design

Create a module such as `spool-rs/crates/spool-core/src/paths.rs` (or `paths/mod.rs`) containing either:

- a `SpoolPaths` struct initialized from `(workspace_root, config_context)` that exposes `spool_dir`, `changes_dir`, `modules_dir`, etc.

or

- a set of free functions that take `&Path` and return `PathBuf` consistently.

Then replace duplicated path joins and string formatting in:

- `spool-rs/crates/spool-core/src/create/*`
- `spool-rs/crates/spool-core/src/list.rs`
- `spool-rs/crates/spool-cli/src/main.rs`

## What NOT to Change

- Do not change `.spool/` directory layout.
- Do not change id parsing rules.

## Testing Strategy

- Unit tests for path helpers.
- Integration tests to ensure commands still find the same files.
