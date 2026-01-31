## Context

The Spool CLI has drifted into an overly broad and inconsistent surface:

- many top-level verbs (including config and completion verbs)
- noun-group command families (`config`, `module`, `completion`, `skills`, plus deprecated `spec`/`change`)
- experimental `x-*` commands visible in help

This makes the CLI harder to learn and document, and it increases the likelihood that shell completion drifts from the actual UX.

We want a small, stable help surface with clear deprecation and visibility rules.

## Goals / Non-Goals

**Goals:**

- Make `spool --help` small and stable
- Keep the existing core UX (`init/update/list/show/validate/archive/split/...`) as the primary UX
- Keep experimental commands callable but hidden by default; only `x-templates` and `x-schemas` remain visible
- Remove skills as a user-facing CLI surface; skills are refreshed via `spool init` and `spool update`
- Align completion generation with the visible CLI surface

**Non-Goals:**

- Redesigning Spool behavior (this change is command-surface only)
- Auto-generating completions directly from Commander
- Defining the long-term policy for promoting experimental commands to stable (only provide a consistent naming path)

## Decisions

### Stable surface first

- `spool --help` is the only supported public UX.
- Deprecated and internal commands remain callable for compatibility, but are hidden from help and excluded from shell completions.

### Deprecation + visibility policy

- Preferred commands SHOULD be the ones shown in `spool --help`.
- Deprecated shims:
  - remain callable
  - print a deprecation warning to stderr
  - are hidden from help and omitted from completion suggestions

### Experimental commands

- **Experimental command naming**: `x-*`.
- **Visibility**:
  - only `x-templates` and `x-schemas` are visible in `spool --help`
  - other `x-*` commands remain callable but hidden
- **Backward compatibility**: keep legacy entrypoints as hidden deprecated wrappers that delegate to the same handler.
- **Completions**: include visible commands only.

## Command mapping

The target UX is to make every command read like “do the verb to the noun”.

**Stable commands (visible in help)**

- `spool init`, `spool update`
- `spool dashboard`
- `spool status`, `spool ralph`
- `spool create`, `spool list`, `spool show`, `spool validate`, `spool archive`, `spool split`
- `spool config <subcommand>`
- `spool completions <subcommand>`

**Experimental commands (`x-*`)**

- visible: `spool x-templates`, `spool x-schemas`
- hidden but callable:
  - `spool x-instructions`
  - `spool x-artifact-experimental-setup`
  - `spool x-research`
  - `spool x-status` (deprecated; prefer `spool status`)
  - `spool x-ralph` (deprecated; prefer `spool ralph`)

**Stable groups**

- Config (preferred): `spool config paths|get|set|list|unset|reset|edit`
- Completions (preferred): `spool completions generate|install|uninstall`

**Deprecated legacy noun commands (hidden shims)**

- `spool spec ...` (hidden deprecated shim; prefer `spool show`, `spool validate --specs`, `spool list --specs`)
- `spool change ...` (hidden deprecated shim; prefer `spool show`, `spool validate --changes`, `spool list`)
- `spool view` (hidden deprecated shim; prefer `spool dashboard`)
- `spool completion ...` (hidden deprecated shim; prefer `spool completions ...`)
- `spool skills ...` (hidden deprecated shim; no replacement; use `spool init`/`spool update`)
- legacy verb shims (`get/set/unset/reset/edit/path/generate/install/uninstall`) are hidden deprecated shims that point to `spool config ...` or `spool completions ...`.

## Risks / Trade-offs

- **User scripts may break** if we remove deprecated noun-group commands too quickly -> keep shims for at least one release.
- **Temporary surface area increase** during transition -> hide deprecated shims from help and completions.
- **Parsing ambiguity**: adding `spool show module <id>` introduces an extra parsing path for `show` -> treat the noun positional set (`module`) as a reserved first argument.

## Migration Plan

1. Define the stable help surface and encode it in the change spec.
1. Hide deprecated shims and internal commands from help and completions.
1. Flip `status` and `ralph` to stable (and make `x-status`/`x-ralph` deprecated hidden aliases).
1. Make `spool update` refresh installed skills.
1. Update completion registry to match the preferred visible surface.
1. Update docs/tests that reference legacy entrypoints.
1. After a deprecation period, remove deprecated wrappers.

Rollback: keep the old command registrations and remove the new verb-first equivalents (no data migration).

## Open Questions

- (none)
