# Change: Distribution and Fetch Mechanics for Spool Skills

## Why

Normal Spool use (released version) should fetch required adapter files over HTTP from GitHub. Development mode should support copying from `./spool-skills/` without symlinks. This ensures adapters can be installed/updated consistently across both scenarios.

## What Changes

- Implement GitHub URL scheme for fetching raw files:
  - Tagged: `https://raw.githubusercontent.com/withakay/spool/<spool-version-tag>/spool-skills/<path>`
  - Fallback: `https://raw.githubusercontent.com/withakay/spool/main/spool-skills/<path>`
- Implement per-user cache to avoid repeated downloads:
  - Cache location: `~/.config/spool/cache/spool-skills/<spool-version-tag>/<path>`
- Update `spool init` to:
  - Accept `--tools opencode,claude,codex` flag (or similar)
  - Fetch/copy required adapter files for selected tools
- Update `spool update` to refresh managed adapter files for the current version
- Implement development local source mode:
  - Detect `./spool-skills/` in repo root
  - Copy files (no symlinks) into cache/install locations
  - Use `main`-equivalent semantics (latest local working tree)

## Capabilities

### New Capabilities

- `distribution`: Fetch, cache, and install mechanics for Spool skill adapters

### Modified Capabilities

- `spool-init`: Extended to install tool-specific adapters
- `spool-update`: Extended to refresh adapter files

## Impact

- Affected specs: `distribution` (new), `spool-init` (modified), `spool-update` (modified)
- Affected code:
  - `spool-rs/crates/spool-core/src/installers/`
  - `spool-rs/crates/spool-cli/` (init/update commands)
  - New: HTTP fetch utilities, cache management
- This is a dependency for 013-01, 013-02, 013-03 (they need install mechanics)
- Parallelization: Can be developed in parallel; adapters can be tested with manual file copies

## Parallel Execution Notes

This change provides infrastructure for:
- 013-01 (OpenCode adapter) - installs plugin and skills
- 013-02 (Claude Code integration) - installs skills/hooks
- 013-03 (Codex bootstrap) - installs bootstrap files

All adapter tracks can proceed in parallel by:
1. Defining their required file sets
2. Implementing the adapter logic
3. This change delivers the install/fetch plumbing

For testing during parallel development, adapters can be manually copied to their destinations.

## File Manifest (Per Tool)

### OpenCode
- Plugin: `spool-skills/adapters/opencode/spool-skills.js` -> `${OPENCODE_CONFIG_DIR}/plugins/spool-skills.js`
- Skills: `spool-skills/skills/` -> `${OPENCODE_CONFIG_DIR}/skills/spool-skills/`

### Claude Code
- Skill: `.claude/skills/spool-workflow.md` (via templates)
- Optional hook: `spool-skills/adapters/claude/session-start.sh`

### Codex
- Bootstrap: `spool-skills/.codex/spool-skills-bootstrap.md` -> `~/.codex/instructions/spool-skills-bootstrap.md`
