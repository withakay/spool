## Why

Users need a way to view and modify their global Spool settings without manually editing JSON files. The `global-config` spec provides the foundation, but there's no user-facing interface to interact with the config. A dedicated `spool config` command provides discoverability and ease of use.

## What Changes

Add `spool config` subcommand with the following operations:

```bash
spool config path                          # Show config file location
spool config list [--json]                 # Show all current settings
spool config get <key>                     # Get a specific value (raw, scriptable)
spool config set <key> <value> [--string]  # Set a value (auto-coerce types)
spool config unset <key>                   # Remove a key (revert to default)
spool config reset --all [-y]              # Reset everything to defaults
spool config edit                          # Open config in $EDITOR
```

**Key design decisions:**

- **Key naming**: Use camelCase to match JSON structure (e.g., `featureFlags.someFlag`)
- **Nested keys**: Support dot notation for nested access
- **Type coercion**: Auto-detect types by default; `--string` flag forces string storage
- **Scriptable output**: `get` prints raw value only (no labels) for easy piping
- **Zod validation**: Use zod for config schema validation and type safety
- **Future-proofing**: Reserve `--scope global|project` flag for potential project-local config

**Example usage:**

```bash
$ spool config path
/Users/me/.config/spool/config.json

$ spool config list
featureFlags: {}

$ spool config set featureFlags.enableTelemetry false
Set featureFlags.enableTelemetry = false

$ spool config get featureFlags.enableTelemetry
false

$ spool config list --json
{
  "featureFlags": {}
}

$ spool config unset featureFlags.enableTelemetry
Unset featureFlags.enableTelemetry (reverted to default)

$ spool config edit
# Opens $EDITOR with config.json
```

## Impact

- Affected specs: New `cli-config` capability
- Affected code:
  - New `src/commands/config.ts`
  - New `src/core/config-schema.ts` (zod schema)
  - Update CLI entry point to register config command
- Dependencies: Requires `global-config` spec (already implemented)
