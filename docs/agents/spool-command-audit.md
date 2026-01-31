# Spool CLI Command + Tasks Audit

Date: 2026-01-31

## Scope

This document summarizes how Spool commands are implemented and how the tasks system is stored/validated.

- Focus: `spool-rs/` (Rust CLI + libraries)
- Out of scope: Ralph/harness behavior (explicitly ignored)

## Key Findings

- The CLI command router is centralized in `spool-rs/crates/spool-cli/src/main.rs`.
- The tasks system is **file-based**: `.spool/changes/<change-id>/tasks.md` is the system of record.
- SQLite is **not** used as a persistent task store.
  - `rusqlite` appears only as an **in-memory** helper to detect dependency cycles.

## Architecture: CLI -> Libraries

### Command Routing

`spool-rs/crates/spool-cli/src/main.rs` dispatches commands into:

- `spool-core`: change/artifact management, schemas, template install/update, instruction generation
- `spool-workflow`: tasks parsing/updating, planning/state/workflow helpers

### Instruction Generation

Core workflow instructions are generated dynamically by:

`spool agent instruction <artifact> --change <id> [--schema <schema>]`

Most artifacts are schema-driven (template + schema.yaml). `apply` is assembled directly in Rust.

## Command Surface (High-Level)

This is a structured view of the major command groups. The exact set evolves, but routing lives in `spool-cli`.

### Change Lifecycle

- `spool create ...`, `spool new ...`
  - Creates module/change scaffolding under `.spool/`.
- `spool list ...`, `spool show ...`, `spool status ...`
  - Enumerates and displays changes/specs/modules.
- `spool validate ...`
  - Validates changes/specs against schema requirements.

### Templates

- `spool init`
  - Installs default templates (including agent harness files) into the project.
- `spool update`
  - Updates managed blocks in installed template files.

### Instructions

- `spool agent instruction <artifact> --change <id>`
  - Prints the instruction content the LLM should follow for proposal/spec/design/tasks/research/review/archive/apply.
- `spool instructions` / `spool x-instructions`
  - Deprecated aliases (still present for compatibility).

### Tasks

- `spool tasks init|status|next|start|complete|shelve|unshelve|add|show ...`
  - Operates on `.spool/changes/<change-id>/tasks.md`.
  - Reads/parses, computes readiness/blocking, updates task status, writes back.

### Planning / State / Workflow

- `spool plan`, `spool state`, `spool workflow`
  - Workflow planning and state operations (still file-based).

### Deprecated

- `spool loop`
  - Deprecated alias for Ralph.

## Tasks System Details

For deeper detail on tasks format/validation and how `spool tasks` works, see `docs/agents/spool-tasks-system.md`.

### Storage

- Source of truth: `.spool/changes/<change-id>/tasks.md`
- Supported formats:
  - Enhanced tasks.md (structured markdown blocks)
  - Checkbox tasks.md (`- [ ]` style)

### Validation + Readiness

The workflow tasks parser:

- Parses the tracking file
- Emits diagnostics for malformed/invalid states
- Computes readiness and blocked tasks via wave gating + explicit dependencies

### What “SQLite-based tasks” means in practice

There is no `.db` file and no persistent task database.

SQLite (`rusqlite`) is used only in `spool-rs/crates/spool-workflow/src/tasks.rs` for:

- In-memory cycle detection (temporary `edge` table + recursive CTE)
- Producing a readable cycle path (e.g. `1.1 -> 1.2 -> 1.1`)

This runs only when a dependency cycle is present/suspected.

## Implications / Instrumentation Targets

If we want to measure usage over time (for the logging proposal), the best stable points are:

- CLI entrypoints: `spool-cli` handlers by subcommand
  - Command name, flags, schema selection, change id
- Tasks operations: `spool-workflow::tasks` parse/update entrypoints
  - Detected format, diagnostics emitted, readiness computation outcomes
  - Whether cycle detection executed
- Instruction generation: `spool agent instruction ...`
  - Artifact requested, schema selected, whether guidance was injected
