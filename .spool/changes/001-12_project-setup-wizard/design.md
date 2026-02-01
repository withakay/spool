## Context

Spool currently provides scaffolding via `spool init`, and workflow content via `spool agent instruction <artifact>`. The missing piece is a first-run, repo-specific setup step that produces a consistent set of dev commands (build/test/lint) and captures tooling preferences (runtime, package manager, version manager). This step should be agent-driven (interactive) without making `spool init` itself interactive.

## Goals / Non-Goals

**Goals:**

- Provide a first-class “project setup” workflow that can be run in any supported harness.
- Keep `spool init` non-interactive but able to nudge users into the setup flow when needed.
- Generate a reasonable `Makefile` (or Windows alternative) with common targets mapped to the project stack.
- Make stack detection best-effort and safe (no destructive edits without explicit user confirmation in the agent workflow).

**Non-Goals:**

- Perfectly detect every language/toolchain.
- Enforce a single task runner across all platforms.
- Overwrite an existing `Makefile` by default.

## Decisions

- Add a new `spool agent instruction project-setup` artifact.
  - Rationale: instruction artifacts are the right place for interactive workflows in agent harnesses.
- Use `.spool/project.md` as the “setup completeness” signal.
  - Proposed marker (template-installed and machine-checkable):
    - `<!-- SPOOL:PROJECT_SETUP:INCOMPLETE -->`
    - `<!-- SPOOL:PROJECT_SETUP:COMPLETE -->`
  - Rationale: aligns with request (“check `.spool/project.md`”) and avoids introducing new files.
- Generate dev command scaffolding via the agent workflow.
  - Rationale: the agent can ask questions and tailor outputs; the CLI stays deterministic.
- Windows alternative: generate `scripts/dev.ps1` (or similar) that provides `build/test/lint/help` entrypoints.
  - Rationale: `make` is not universally present on Windows; PowerShell is.

## Risks / Trade-offs

- Overly chatty setup prompts -> Mitigation: a small “core interview” plus optional advanced questions.
- Conflicting task-runner opinions -> Mitigation: prefer additive outputs and avoid overwriting existing files.
- Marker drift in `.spool/project.md` -> Mitigation: treat marker as advisory; init only hints.

## Migration Plan

- New templates and artifact are additive.
- Existing projects can opt-in by running `/spool-project-setup`.
- Projects that already have Makefiles are left untouched unless explicitly requested.

## Open Questions

- Exact scope of stack detection in v1 (Rust/Node/Python/Go?)
- Whether to store chosen preferences in `.spool/config.json` in addition to updating `.spool/project.md`.
