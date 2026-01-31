## Context

Spool’s TypeScript implementation already treats `tasks.md` as a structured workflow artifact (waves, statuses, dependency readiness). The Rust port is currently behind on this capability, which blocks parity and makes it hard to add alternative task stores.

## Goals / Non-Goals

**Goals:**

- Define a stable Rust task data model aligned with Spool’s enhanced `tasks.md` template.
- Introduce a `TaskBackend` trait with a markdown backend as the default.
- Add an optional Taskwarrior backend that maps tasks using UUIDs and interacts through the `task` CLI.
- Ensure errors and diagnostics are actionable (missing file, parse errors, missing `task` binary, invalid dependencies).

**Non-Goals:**

- Implement Taskwarrior sync/server configuration (e.g. `task sync`) inside Spool.
- Require users to configure Taskwarrior UDAs; zero-config operation is preferred.
- Redesign the TypeScript task format or change the default `tasks.md` workflow.

## Decisions

- **Decision: Backend abstraction with a shared in-memory model**

  - Rationale: Keeps workflow consumers independent of storage; enables parity and future backends.
  - Alternatives: keep parsing inline per-command (duplicates logic, blocks new backends).

- **Decision: Markdown backend supports enhanced format parity**

  - Rationale: This is the canonical format shipped by Spool templates; parity unlocks Rust port completeness.
  - Alternatives: only support checkbox tasks (insufficient for current Spool workflow state).

- **Decision: Taskwarrior integration via `task` CLI + JSON export**

  - Rationale: Most reliable surface area and matches real user installations; avoids betting on lightly-maintained crates.
  - Alternatives: link to internal Taskwarrior storage libraries (higher complexity/maintenance risk).

- **Decision: Store richer Spool fields in Taskwarrior annotations (payload)**

  - Rationale: Works without requiring UDAs; maintains a loss-minimizing mapping for `files`, `verify`, `done when`.
  - Alternatives: UDAs (better structure but requires local Taskwarrior config).

## Risks / Trade-offs

- Parsing parity drift (TS vs Rust) → Mitigation: add shared fixtures (template-derived `tasks.md`) and round-trip tests for status updates.
- Taskwarrior semantic mismatch (cancelled/blocked vs completed/deleted/active) → Mitigation: keep Spool status mapping minimal and derive blocked from dependencies.
- CLI dependency on external binary (`task`) → Mitigation: backend is opt-in; provide precise error messaging and backend fallback guidance.
