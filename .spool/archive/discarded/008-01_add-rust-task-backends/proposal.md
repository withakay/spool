## Why

Spool’s TypeScript CLI already supports an “enhanced” `tasks.md` workflow (waves, statuses, dependencies, readiness/diagnostics), but the Rust port currently only has checkbox-level parsing. Adding a Rust task backend abstraction unblocks parity work and enables optional integrations like Taskwarrior without rewriting workflow logic.

## What Changes

- Add a backend-agnostic Rust task model and `TaskBackend` trait used by spool-rs workflow features that need task tracking.
- Implement a `MarkdownTaskBackend` that supports the enhanced `tasks.md` format shipped by Spool templates (waves, status updates, dependency validation).
- Implement an optional `TaskwarriorTaskBackend` that shells out to the `task` CLI, uses JSON export, and maps tasks by UUID.
- Add Rust tests/fixtures to keep task parsing and status updates stable.

## Capabilities

### New Capabilities
- `rust-task-backends`: Rust-side backend abstraction for task tracking, including markdown (default) and optional Taskwarrior.

### Modified Capabilities
- (none)

## Impact

- Affected code: `spool-rs/crates/spool-core` (task model/parsing), `spool-rs/crates/*` that read/compute task progress/readiness.
- External dependency: optional runtime dependency on the `task` binary when Taskwarrior backend is enabled.
- Compatibility: default behavior remains file-backed `tasks.md`; Taskwarrior is opt-in.
