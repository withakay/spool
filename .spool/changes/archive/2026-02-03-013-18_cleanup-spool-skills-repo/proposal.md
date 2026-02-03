## Why

The `spool-skills/` directory contains files and directories that are not used by Spool's distribution mechanism. Spool only distributes skills from `spool-skills/skills/` via the `SPOOL_SKILLS` list in `distribution.rs`. The additional directories (adapters, agents, commands, hooks, lib, tests, docs) create confusion about what's actually part of Spool vs. what's legacy/external tooling.

## What Changes

Remove directories and files from `spool-skills/` that are not used by Spool:

### To Remove

| Path | Reason |
|------|--------|
| `spool-skills/adapters/` | Not used by distribution - adapter templates are embedded in spool-templates |
| `spool-skills/agents/` | Not used by distribution |
| `spool-skills/commands/` | Not used by distribution |
| `spool-skills/hooks/` | Not used by distribution |
| `spool-skills/lib/` | Not used by distribution |
| `spool-skills/tests/` | Test infrastructure, not distributed |
| `spool-skills/docs/` | Documentation, not distributed |
| `spool-skills/.claude-plugin/` | Claude plugin, not distributed |
| `spool-skills/.codex/` | Codex config, not distributed |
| `spool-skills/.github/` | GitHub config, not distributed |
| `spool-skills/.opencode/` | OpenCode config, not distributed |
| `spool-skills/README.md` | Repo readme, not distributed |
| `spool-skills/RELEASE-NOTES.md` | Release notes, not distributed |
| `spool-skills/LICENSE` | Keep - needed for attribution |
| `spool-skills/.gitignore` | Keep if skills/ remains a git repo |
| `spool-skills/.gitattributes` | Keep if skills/ remains a git repo |

### To Keep

| Path | Reason |
|------|--------|
| `spool-skills/skills/` | Source of truth for distributed skills |
| `spool-skills/LICENSE` | Legal requirement |
| `spool-skills/.gitignore` | Git config (optional) |
| `spool-skills/.gitattributes` | Git config (optional) |

## Capabilities

### New Capabilities

None - this is a cleanup/maintenance change.

### Modified Capabilities

None - no behavior changes.

## Impact

- **Code**: Only `spool-skills/` directory structure
- **Distribution**: No impact - only `skills/` is distributed
- **Risk**: Low - removing unused files
- **Dependencies**: None
