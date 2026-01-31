## Why

Spool configuration is starting to span multiple concerns (project layout, agent/tool settings, future `serve` settings). We need a predictable, testable cascading config system that can merge multiple project config files without hardcoding a single location.

## What Changes

- Support cascading project configuration with deterministic precedence across multiple files:
  - `<repo-root>/spool.json`
  - `<repo-root>/.spool.json`
  - `<spoolDir>/config.json`
  - `$PROJECT_DIR/config.json` (when `PROJECT_DIR` is set)
- Implement deep-merge semantics for JSON objects (later sources override earlier; arrays replaced).
- Extend spool directory selection to consider `.spool.json` in addition to `spool.json`.
- Expose an API in `spool-core` to load the merged effective project config.
- Add tests for precedence, merging, and path resolution.
- Update documentation/specs to match the implemented behavior.

## Capabilities

### New Capabilities
- `cascading-project-config`: Load and merge multiple project config sources with clear precedence.

### Modified Capabilities
- `global-config`: continues to exist as a user-level baseline but project config resolution becomes richer.

## Impact

- `spool-rs/crates/spool-core/src/config/mod.rs`: add merged project config loader + merge semantics.
- `spool-rs/crates/spool-core/src/spool_dir/mod.rs`: incorporate `.spool.json` for `projectPath` resolution.
- Docs/specs: align config documentation and agent-config expectations with JSON project config.
