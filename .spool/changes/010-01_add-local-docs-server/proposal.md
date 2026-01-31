## Why

Reviewing Spool artifacts (changes/specs/modules) is currently file-based and fragmented across editors and terminals. A local web server makes it easy to browse and read Markdown with navigation, especially when collaborating or when an agent needs a consistent, clickable view of the current state.

## What Changes

- Add a per-project local web server command (`spool serve`) that serves:
  - `.spool/changes/`
  - `.spool/specs/`
  - `.spool/modules/`
  - `.spool/planning/` (if present)
  - `.spool/research/` (if present)
  - `docs/` (if present)
  - `documents/` (if present)
- Render Markdown as HTML with simple file-based navigation.
- Default bind/port: `127.0.0.1:9009` (configurable via project config at `.spool/config.json`).
- If the configured/default port is unavailable, auto-select the next available port by incrementing.
- Add a stop command to terminate the server for the current project.
- Require an external dependency (Caddy) and provide a clear error if it is not installed.
- Optional: support binding to non-loopback addresses (e.g. `0.0.0.0`) and include a tokenized URL (path prefix) to reduce casual exposure.

## Capabilities

### New Capabilities

- `cli-serve`: local docs server lifecycle + config.

### Modified Capabilities

<!-- None -->

## Impact

- Adds a new CLI entrypoint and background process management (per-project state directory, pid tracking).
- Introduces an external runtime dependency (Caddy) and related platform-specific install guidance.
- Touches project config reading (uses existing cascading config loading) to configure port/bind/token behavior.
