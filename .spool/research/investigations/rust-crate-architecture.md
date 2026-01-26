# Rust Workspace / Crate Architecture

## Goals

- Keep the CLI crate thin.
- Keep core logic testable by isolating side effects behind traits.
- Embed templates and keep installer outputs deterministic.

## Proposed Workspace Layout

Create a Cargo workspace under `spool-rs/`:

```text
spool-rs/
  Cargo.toml
  crates/
    spool-cli/           # binary crate; clap; wiring
    spool-core/          # domain logic; models; operations
    spool-fs/            # fs abstraction; marker-managed edits
    spool-templates/     # embedded templates + rendering
    spool-schemas/       # schema parsing, graphs, delta apply blocks
    spool-workflow/      # workflow yaml + state
    spool-harness/       # ralph harness invocation
    spool-test-support/  # shared test helpers (oracle/candidate runner, PTY)
```

## Trait Boundaries

- Filesystem: read/write, atomic writes, globbing
- Process execution: spawn oracle/candidate, harness runners
- Terminal: isatty, width, color choice
- Clock: timestamps for archive naming and status output

Design guideline:

- Prefer passing an `Env` + `Io` object into operations rather than using
  `std::env` and global IO directly.
