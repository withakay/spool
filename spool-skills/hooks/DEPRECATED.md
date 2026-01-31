# DEPRECATED

This directory contains the old hooks implementation that embedded full workflow content in the SessionStart hook.

## Status

**This implementation is deprecated.**

## Migration

Please migrate to the new approach:

1. **Project templates (preferred)** - Use `.claude/skills/spool-workflow/SKILL.md`
   - Automatically installed by `spool init --tools claude`
   - Delegates to `spool agent instruction` for workflow content

2. **Minimal hook shim** - Use `adapters/claude/session-start.sh`
   - Only prints a pointer to the bootstrap command
   - For non-project contexts

See `spool-skills/adapters/claude/README.md` for detailed migration instructions.

## Why Deprecated?

The old approach:
- ❌ Duplicated workflow content in hooks
- ❌ Made synchronization harder
- ❌ Required hook updates for workflow changes

The new approach:
- ✅ Single source of truth in Spool CLI
- ✅ Minimal Claude-side assets
- ✅ Workflow changes only require CLI updates

## Next Steps

1. Review the new adapter in `spool-skills/adapters/claude/`
2. Update your Claude Code plugin configuration
3. Remove this directory after migration is complete

## Timeline

- Old hooks remain functional for backward compatibility
- Future version will remove this directory entirely
