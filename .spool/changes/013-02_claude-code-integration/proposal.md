# Change: Claude Code Integration for Spool Skills

## Why

The vendored `spool-skills` uses Claude Code's `SessionStart` hook to inject bootstrap context. However, Spool's preferred approach is to use project templates (`AGENTS.md`/`CLAUDE.md`) and `.claude/skills/*` that delegate to `spool agent instruction`. This minimizes hook complexity and keeps workflow content in a single source of truth.

## What Changes

- Document that Claude Code integration should prefer project templates over hooks
- Create minimal `.claude/skills/spool-workflow.md` skill file that:
  - Points to `spool agent instruction <artifact>` for workflow bodies
  - Avoids embedding long policy text
- Optional: Create a minimal `SessionStart` hook shim that only prints a pointer to an instruction artifact (for cases where project files are not loaded)
- Remove or deprecate the existing `spool-skills/hooks/` bash scripts in favor of the template-based approach

## Capabilities

### New Capabilities

- `claude-code-adapter`: Claude Code skill/hook integration for Spool workflows

### Modified Capabilities

None

## Impact

- Affected specs: `tool-adapters` (new)
- Affected code:
  - New: `.claude/skills/spool-workflow.md` (template)
  - Optional: `spool-skills/adapters/claude/session-start.sh` (minimal shim)
  - Deprecate: `spool-skills/hooks/`
- Embedded in: `spool-rs/crates/spool-templates/assets/`
- Parallelization: Can be developed in parallel with 013-01, 013-03

## Parallel Execution Notes

This change can be implemented in parallel with:
- 013-01 (OpenCode adapter) - no shared code paths
- 013-03 (Codex bootstrap) - no shared code paths

Soft dependency on:
- 013-04 (bootstrap artifact CLI) - for the `spool agent instruction bootstrap --tool claude` content
- 013-05 (distribution) - for install/fetch mechanics
