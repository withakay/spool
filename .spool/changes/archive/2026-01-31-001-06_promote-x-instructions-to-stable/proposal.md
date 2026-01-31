## Why

The `x-instructions` command provides dynamic, context-aware instruction generation for AI agents creating artifacts. It's currently hidden as experimental (`x-` prefix), but has proven stable and essential for the Spool workflow. This change promotes it to a stable command while reorganizing it under a new `agent` namespace since this functionality is designed for agent consumption, not human use.

## What Changes

- **BREAKING**: Rename `spool x-instructions` to `spool agent instruction`
- Introduce new `spool agent` command group for agent-facing utilities
- Remove the hidden flag and experimental `x-` prefix from the instructions command
- Update all references in skills, commands, and documentation to use the new path
- Keep backward compatibility alias `spool x-instructions` with deprecation warning (optional)

## Capabilities

### New Capabilities

- `agent-command-group`: New CLI command group `spool agent` to namespace agent-facing utilities. This provides a home for commands that generate machine-readable output for AI agents rather than human users.
- `stable-instruction-generation`: Promote instruction generation from experimental to stable API. The command `spool agent instruction [artifact]` generates enriched, context-aware instructions for artifact creation.

### Modified Capabilities

- `cli-artifact-workflow`: Update experimental workflow commands to move `x-instructions` under the new `agent` namespace. Other `x-` commands (`x-templates`, `x-schemas`, `x-new`) can remain experimental for now.

## Impact

- **CLI**: New `agent` command group with `instruction` subcommand
- **Skills/Commands**: All Spool skills that call `spool x-instructions` must be updated to `spool agent instruction`
- **Deprecation**: `spool x-instructions` should emit a deprecation warning pointing to the new command
- **Documentation**: Agent instructions and workflow docs need updates
- **Templates**: skill-templates.ts contains raw instructions that reference `x-instructions`
