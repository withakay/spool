## Context

Released Spool should fetch adapter files over HTTP; development should use the local `./spool-skills/` tree without symlinks. Both modes should share the same manifests and install destinations.

## Goals / Non-Goals

- Goals:
  - Fetch raw files via GitHub URLs with a version tag.
  - Cache downloads per-user.
  - Support local-dev copy fallback.
  - Install tool-specific files into their expected config locations.
- Non-Goals:
  - Packaging adapters inside the binary beyond the existing templates mechanism.

## Rust Style

All Rust implementation for this change follows the `rust-style` skill.

## Decisions

- URL scheme:
  - Primary: `https://raw.githubusercontent.com/withakay/spool/<tag>/spool-skills/<path>`
  - Fallback: `https://raw.githubusercontent.com/withakay/spool/main/spool-skills/<path>`
- Cache directory:
  - `~/.config/spool/cache/spool-skills/<tag>/<path>`

## File Manifests

### OpenCode

- Source: `spool-skills/adapters/opencode/spool-skills.js`
- Dest: `${OPENCODE_CONFIG_DIR}/plugins/spool-skills.js`
- Source: `spool-skills/skills/`
- Dest: `${OPENCODE_CONFIG_DIR}/skills/spool-skills/`

### Claude Code

- Source: `.claude/skills/spool-workflow.md`
- Dest: `<project>/.claude/skills/spool-workflow.md`
- Optional source: `spool-skills/adapters/claude/session-start.sh`

### Codex

- Source: `spool-skills/.codex/spool-skills-bootstrap.md`
- Dest: `~/.codex/instructions/spool-skills-bootstrap.md`

## Open Questions

- Should Codex bootstrap be installed per-project instead of globally (if Codex supports it reliably)?
