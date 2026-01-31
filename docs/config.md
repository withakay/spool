# Configuration

Spool reads configuration from a few different places, depending on what you're trying to control.

## Configuration Layers

Spool has a few different config locations with different purposes:

- **Repo root config**: `spool.json` and `.spool.json`
- **Project Spool-dir config**: `<spool-dir>/config.json`
- **User (global) config**: `<config-dir>/config.json`
- **Per-change metadata**: `<spool-dir>/changes/<change-id>/.spool.yaml`

## Project Config: `spool.json`

Location:

- `<repo-root>/spool.json`

Purpose:

- Configure project-level Spool behavior.
- Today, this file is primarily used to control the Spool working directory name.

This file also participates in cascading config merging (see `<spool-dir>/config.json`).

## Project Config: `.spool.json`

Location:

- `<repo-root>/.spool.json`

Purpose:

- Same role as `spool.json`, but higher precedence for repo-local overrides.

Supported keys:

- `projectPath` (string): overrides the directory name used for the Spool working directory in this repo.
  - Default is `.spool`.
  - This is useful for compatibility with older docs that refer to `spool/` instead of `.spool/`.

Example:

```json
{
  "projectPath": ".spool"
}
```

## Global Config: `config.json`

Location (directory):

- If `XDG_CONFIG_HOME` is set: `$XDG_CONFIG_HOME/spool/`
- Otherwise on Unix/macOS: `~/.config/spool/`
- On Windows: `%APPDATA%\spool\`

Location (file):

- `<config-dir>/config.json`

Environment variables used for resolution:

- `XDG_CONFIG_HOME`
- `HOME` (and `USERPROFILE` as a fallback)
- `APPDATA` (Windows)

Supported keys (Rust CLI today):

- `projectPath` (string): default Spool working directory name used when the repo does not have a `spool.json` override.

Spool directory name resolution for `projectPath` (highest precedence first):

1. `<repo-root>/.spool.json` `projectPath`
1. `<repo-root>/spool.json` `projectPath`
1. `<config-dir>/config.json` `projectPath`
1. default: `.spool`

Example:

```json
{
  "projectPath": ".spool"
}
```

Notes:

- If `config.json` is missing, Spool falls back to defaults.
- If `config.json` contains invalid JSON, Spool falls back to defaults (and prints a warning).

## Project Config: `<spool-dir>/config.json`

Location:

- `<spool-dir>/config.json` (default: `.spool/config.json`)

Purpose:

- Configure project-level Spool behavior (including AI tool and agent preferences).
- This file is intended to be checked into version control so teams get consistent behavior.

Cascading config (merged in order, later overrides earlier):

1. `<repo-root>/spool.json`
1. `<repo-root>/.spool.json`
1. `<spool-dir>/config.json`
1. If `PROJECT_DIR` is set: `$PROJECT_DIR/config.json`

Merge semantics:

- objects: recursively merged
- scalars: later source overrides earlier
- arrays: later source replaces earlier

Note: `projectPath` (the Spool working directory name) is resolved from repo-level config and global config. It does not consult `<spool-dir>/config.json` to avoid a resolution cycle.

Related commands (planned):

```bash
spool agent-config init
spool agent-config summary
spool agent-config get tools.opencode.default_model
spool agent-config set tools.opencode.context_budget 100000
```

## Per-Change Metadata: `.spool.yaml`

Location:

- `<repo-root>/.spool/changes/<change-id>/.spool.yaml`

Purpose:

- Store per-change metadata (such as schema choice) alongside the change.

Common fields:

- `schema` (string): workflow schema for the change (e.g. `spec-driven`).
- `created` (date): creation date (`YYYY-MM-DD`).

Optional fields used by validation:

- `ignore_warnings` (array of strings): suppress specific validator warnings for this change.
  - Example: `ignore_warnings: ["max_deltas"]`

Example:

```yaml
schema: spec-driven
created: 2026-01-31
ignore_warnings: ["max_deltas"]
```

## Where To Put Extra Guidance (Avoiding Overwrites)

Some files are installed/updated by Spool (`spool init`, `spool update`) and may be overwritten.

If you want to add project-specific guidance for humans and LLMs, prefer:

- `.spool/user-guidance.md` (injected into agent instruction outputs)
- `AGENTS.md` and/or `CLAUDE.md` (project-level guidance)
