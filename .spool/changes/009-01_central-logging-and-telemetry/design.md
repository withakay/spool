## Context

Spool execution can fail in ways that are hard to debug from a single CLI output. Additionally, without instrumentation it is difficult to know which CLI entrypoints are used in practice (to prioritize improvements and identify dead code paths). We want a local-only logging and telemetry foundation that is useful for debugging while being privacy-preserving by default.

## Goals / Non-Goals

**Goals:**

- Central, per-user logging location with structured (machine-readable) events.
- Group logs by project without storing raw absolute paths.
- Group logs by session to correlate a sequence of commands.
- Provide a `spool stats` command that summarizes usage locally and can include unused commands.
- Best-effort logging: logging failures must not break command execution.

**Non-Goals:**

- Network telemetry/reporting.
- Capturing full CLI arguments or environment by default.
- Windows-specific log directory conventions (can be added later).

## Decisions

### Decision: Structured JSONL event logs

Write one JSON object per line (JSONL) for append-friendly logging, easy parsing, and robust partial writes.

### Decision: Central log directory

Use Spool's per-user config directory and add `logs/` beneath it.

- Linux (XDG): `~/.config/spool/logs`
- macOS: use the platform config dir (documented), with a stable `spool/logs` subdirectory

### Decision: Privacy-preserving project identifier

Derive `project_id` as a salted hash of the canonical project root path:

- Salt is generated once and stored in the per-user config dir (e.g. `telemetry_salt`).
- Hash uses a stable algorithm (e.g. SHA-256) and is encoded (hex/base32).
- Logs store only `project_id`, not the raw path.

This avoids embedding the full path while still allowing grouping.

### Decision: Session identity and persistence

Create `session_id` at the start of a project session and persist it in the project's `.spool/` directory (e.g. `.spool/session.json`).

- Session id is time-based (start timestamp) plus randomness for uniqueness.
- If `.spool/` is not present, use a process-scoped session id.

### Decision: CLI entrypoint auditing

Each CLI entrypoint is assigned a stable `command_id` string (e.g. `spool.init`, `spool.proposal.create`). Execution events record `command_id` and outcome.

`spool stats` enumerates the known `command_id` list (from the CLI definition) so it can show both used and unused commands.

### Decision: `command_id` format and known ids

Treat `command_id` as an API.

- Format: `spool.<segment>(.<segment>...)?`
- Allowed characters per segment: `a-z0-9_` (hyphens are normalized to `_`).
- Segments are derived from the CLI tokens: top-level command + any subcommand tokens.

Known ids (from `spool-rs/crates/spool-cli/src/main.rs`):

- `spool.create.module`
- `spool.create.change`
- `spool.new.change`
- `spool.init`
- `spool.update`
- `spool.list`
- `spool.plan.init`
- `spool.plan.status`
- `spool.state.show`
- `spool.state.decision`
- `spool.state.blocker`
- `spool.state.note`
- `spool.state.focus`
- `spool.state.question`
- `spool.tasks.init`
- `spool.tasks.status`
- `spool.tasks.next`
- `spool.tasks.start`
- `spool.tasks.complete`
- `spool.tasks.shelve`
- `spool.tasks.unshelve`
- `spool.tasks.add`
- `spool.tasks.show`
- `spool.workflow.init`
- `spool.workflow.list`
- `spool.workflow.show`
- `spool.status`
- `spool.templates`
- `spool.instructions`
- `spool.agent`
- `spool.x_instructions`
- `spool.show`
- `spool.validate`
- `spool.ralph`
- `spool.loop`

Notes:

- `spool templates` and `spool x-templates` are aliases today; both map to `spool.templates`.
- `spool loop` is a deprecated alias for `spool ralph`; it still has its own `command_id` so we can measure deprecation usage.

### Decision: Execution event schema (v1)

Execution logs use JSONL: one JSON object per line.

Each command emits two events:

- `command_start` at the beginning of execution.
- `command_end` at the end of execution.

Common fields:

- `event_version`: integer schema version (start with `1`).
- `event_id`: unique identifier (UUIDv4).
- `timestamp`: RFC 3339 UTC timestamp of when the event was recorded.
- `event_type`: `command_start` | `command_end`.
- `spool_version`: CLI version string.
- `command_id`: stable id (see above).
- `session_id`: stable within a project session.
- `project_id`: salted hash of the project root.
- `pid`: process id.

End-event fields:

- `outcome`: `success` | `error`.
- `duration_ms`: integer milliseconds from command start to end.

Non-goals for v1:

- Logging full argv, raw absolute paths, or environment variables.

Example (end event):

```json
{"event_version":1,"event_id":"b5400d1a-6c4c-4e6d-ae78-7f8f22a8a0dd","timestamp":"2026-01-31T17:14:02Z","event_type":"command_end","spool_version":"0.0.0","command_id":"spool.tasks.status","session_id":"01JH...","project_id":"c6a8...","pid":12345,"outcome":"success","duration_ms":42}
```

### Decision: On-disk layout and file naming

Log root: Spool per-user config directory, with a `logs/` child.

- Root: `<config_dir>/spool/logs/`
- Schema/versioning: `<config_dir>/spool/logs/execution/v1/`
- Grouping: per-project, per-session file

Layout:

- `<config_dir>/spool/logs/execution/v1/projects/<project_id>/sessions/<session_id>.jsonl`

File naming rules:

- `<project_id>`: lowercase hex string.
- `<session_id>`: opaque, url-safe string.
- Files are append-only; a partial final line is permitted and should be ignored by readers.

### Decision: Project hashing and salt storage

`project_id` is computed from the canonical project root path using a per-user random salt.

- Salt file: `<config_dir>/spool/telemetry_salt` (32 random bytes, created on first use)
- Hash: `sha256(salt || 0x00 || canonical_project_root_utf8)` encoded as lowercase hex
- The raw project path MUST NOT be written to logs by default

## Risks / Trade-offs

- Local data growth: logs can grow unbounded if unmanaged.
  - Mitigation: retention policy (time- or size-based) and/or user-invoked cleanup.
- Privacy: even hashed paths can leak information in limited cases.
  - Mitigation: use a per-user salt; do not log args/paths by default.
- Behavioral drift: keeping `command_id` stable over time requires discipline.
  - Mitigation: treat `command_id` as an API and add CI checks/tests.

## Migration Plan

1. Add `spool-logging` crate with event schema and file writing.
1. Integrate logging into `spool-rs` entrypoints and ensure failures are best-effort.
1. Add session/project id logic and state storage under `.spool/`.
1. Add `spool stats` and document usage.
1. Add basic retention/cleanup behavior and tests.

## Open Questions

- Should retention be purely time-based, size-based, or both?
- Should `spool stats` be a stable public command or namespaced (e.g. `spool debug stats`)?
