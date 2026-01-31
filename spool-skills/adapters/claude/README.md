# Claude Code Adapter

This directory contains Claude Code-specific adapters for Spool integration.

## Files

- `session-start.sh` - Minimal SessionStart hook shim
- `hooks.json` - Hook configuration for Claude Code

## Migration from `hooks/`

The old `spool-skills/hooks/` implementation embedded full workflow content in the SessionStart hook. This approach is being **deprecated** in favor of:

1. **Project templates** (preferred) - `.claude/skills/spool-workflow/SKILL.md` that delegates to `spool agent instruction`
2. **Minimal hook shim** (this file) - For non-project contexts, only prints a pointer to the bootstrap artifact

## Why the Change?

The old approach:
- ❌ Duplicated workflow content in hooks
- ❌ Made synchronization harder
- ❌ Required hook updates for workflow changes

The new approach:
- ✅ Single source of truth in Spool CLI
- ✅ Minimal Claude-side assets
- ✅ Workflow changes only require CLI updates

## Installation

To use the new adapter:

1. Copy `hooks.json` to `${CLAUDE_PLUGIN_ROOT}/hooks.json`
2. Ensure `session-start.sh` is executable
3. Restart Claude Code

## Deprecation Timeline

- **Now**: Use project templates (`.claude/skills/`) when possible
- **Future**: Old `spool-skills/hooks/` will be removed
- **Recommended**: Update to the adapter approach to prepare for removal

## See Also

- `.claude/skills/spool-workflow/SKILL.md` - Project template skill
- `spool agent instruction bootstrap --tool claude` - Bootstrap workflow artifacts
