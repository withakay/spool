## Context

The Spool CLI currently exposes multiple experimental or one-off commands at the top level (e.g., `status`, `instructions`, `templates`, `schemas`, `new`, `artifact-experimental-setup`, `spool-research`, `ralph|loop`). This pollutes `spool --help`, creates inconsistent naming, and makes it harder to promote or remove experimental functionality.

Separately, shell completion is generated from a static registry (`src/core/completions/command-registry.ts`), which has drifted from the real CLI surface.

This change standardizes how experimental commands are named and ensures the completion registry reflects the visible CLI.

## Goals / Non-Goals

**Goals:**
- Establish a single experimental naming convention: `spool x-<command>`
- Remove experimental commands from top-level help output by renaming them to `x-*`
- Preserve usability for existing users via a transition period (deprecated, hidden aliases)
- Align completion generation with the actual CLI surface shown in `spool --help`

**Non-Goals:**
- Auto-generating completions from Commander at runtime
- Removing or redesigning the underlying artifact workflow, research, or ralph implementations
- Defining long-term policies for promoting experimental commands to stable (only provide a naming path)

## Decisions

- **Experimental command naming**: experimental commands are hyphen-prefixed as `x-*` (e.g., `x-status`, `x-instructions`, `x-templates`).
- **Help output cleanliness**: legacy names remain callable but SHOULD be hidden from `spool --help`.
- **Backward compatibility**: keep legacy entrypoints as deprecated aliases implemented as separate `hidden` commands that:
  - print a deprecation warning to stderr
  - delegate to the same underlying handler as the `x-*` command
- **Completions reflect help surface**: completion registry will include the visible commands (including `x-*`), but will NOT intentionally expose hidden/deprecated legacy names.

### Command mapping

- Artifact workflow:
  - `status` -> `x-status` (hidden deprecated: `status`)
  - `instructions` -> `x-instructions` (hidden deprecated: `instructions`)
  - `templates` -> `x-templates` (hidden deprecated: `templates`)
  - `schemas` -> `x-schemas` (hidden deprecated: `schemas`)
  - `new` -> `x-new` (hidden deprecated: `new`)
  - `artifact-experimental-setup` -> `x-artifact-experimental-setup` (hidden deprecated: `artifact-experimental-setup`)
- Research:
  - `spool-research` -> `x-research` (hidden deprecated: `spool-research`)
- Ralph:
  - `ralph|loop` -> `x-ralph` (hidden deprecated: `ralph`, `loop`)

## Risks / Trade-offs

- **User scripts may break** if they depend on legacy commands and we remove them too early -> keep deprecated hidden aliases for at least one release cycle.
- **Two entrypoints per command** increases registration code slightly -> keep handlers shared and wrappers thin.
- **Completion expectations**: users may expect deprecated names to autocomplete -> intentionally omit hidden commands from completions to push adoption.

## Migration Plan

1. Add `x-*` commands and update help output to only expose the `x-*` names for experimental commands.
2. Keep legacy commands as hidden wrappers that print a deprecation warning.
3. Update completion registry to include the new `x-*` commands and any other visible commands missing from the registry.
4. Update documentation/tests that reference legacy entrypoints (notably any QA scripts referencing `spool ralph`).
5. After a deprecation period, remove legacy wrappers.

Rollback: revert command registrations to their original names (no data migration required).

## Open Questions

- What is the deprecation window for legacy command names (one minor release vs longer)?
- Should `skills` help text be updated to remove legacy “OPSX” phrasing as part of this change or a follow-up?
