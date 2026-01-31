# Research: Interface/Trait-Based Task System + Taskwarrior Backend

## Executive Summary

Spool already has a structured task model (`tasks.md`) and parsing logic in TypeScript, but it is file-backed and not abstracted behind a backend interface. Rust currently has only checkbox-style task parsing, so the TS “enhanced tasks” format (waves, status, dependencies, diagnostics) is not yet feature-parity.

To support alternative backends (like Taskwarrior) without breaking existing workflows, the safest path is:

1. **Define a stable in-memory “Spool Task Model”** (IDs, status, deps, metadata) shared conceptually across TS and Rust.
1. **Introduce a `TaskBackend` interface/trait** with a default **Markdown backend** (current behavior).
1. **Add an optional Taskwarrior backend** that implements the same interface by shelling out to the `task` CLI and mapping Spool task fields onto Taskwarrior attributes.

This yields a clean extension point (interface/trait) while preserving today’s `tasks.md` workflows and enabling power-user integrations.

## Key Findings

- **Current Spool Task Tracking (TS)**: `src/core/tasks/task-tracking.ts` parses both checkbox and “enhanced” wave-based tasks, includes diagnostics and readiness checks, and can update task status in-place.
- **Current Spool Task Tracking (Rust)**: `spool-rs/crates/spool-core/src/workflow/mod.rs` models apply instructions but currently only supports checkbox parsing (not the enhanced format).
- **Canonical Task Format**: `src/core/templates/tasks-template.ts` ships the enhanced `tasks.md` template (waves, action/verify/done-when, dependencies).
- **Taskwarrior Feasibility**: Taskwarrior supports JSON `export`/`import`, built-in `depends`, and custom metadata via UDAs, making it workable as a backend if we carefully handle configuration and ID mapping.

## Recommendation

Implement a backend abstraction with these two initial backends:

- **`MarkdownTaskBackend` (default)**: backed by `.spool/changes/<change>/tasks.md` using the existing enhanced format.
- **`TaskwarriorTaskBackend` (optional)**: backed by Taskwarrior tasks filtered by a stable scope key (e.g., `project:` prefix + tags), using `uuid` as the backend ID.

Keep the Spool task model “loss-minimizing”: preserve fields that don’t map cleanly to Taskwarrior (e.g., `Files`, `Verify`, `Done When`) via annotations or a single “payload” field.

## Next Steps

1. Define a cross-language task data model (TS types + Rust structs) and status enum mapping.
1. Add a backend interface/trait + Markdown backend adapter.
1. Prototype a Taskwarrior backend with a minimal command set: list/get/add/start/stop/done/modify.
1. Decide on metadata strategy: **UDAs** (best structure, requires config) vs **tags/annotations** (zero-config, less structured).

## Research Files

- `.spool/research/investigations/todo-task-interface-taskwarrior.md`
