# Tasks for: 013-16_fix-using-spool-skills-naming

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential

```bash
spool tasks status 013-16_fix-using-spool-skills-naming
spool tasks next 013-16_fix-using-spool-skills-naming
```

______________________________________________________________________

## Wave 1: Fix frontmatter

### Task 1.1: Update frontmatter name and description

- **Files**: `spool-skills/skills/using-spool-skills/SKILL.md`
- **Action**:
  - Change `name: using-superpowers` to `name: using-spool-skills`
  - Update description to: "Use when discovering, finding, invoking, or loading skills. Ensures skills are invoked BEFORE responding. Establishes skill priority and usage patterns for OpenCode, Claude Code, and Codex."
- **Done When**: Frontmatter updated
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2: Add multi-harness support

### Task 2.1: Add OpenCode skill instructions

- **Files**: `spool-skills/skills/using-spool-skills/SKILL.md`
- **Action**:
  - Add section: "## Using Skills in OpenCode"
  - Document: `skill list` to discover skills, `skill load <name>` to invoke
  - Note skill locations: `.opencode/skills/` (project), `~/.config/opencode/skills/` (user)
- **Done When**: OpenCode instructions added
- **Status**: [ ] pending

### Task 2.2: Add Claude Code skill instructions

- **Files**: `spool-skills/skills/using-spool-skills/SKILL.md`
- **Action**:
  - Add section: "## Using Skills in Claude Code"
  - Document: `mcp_skill` function with `name` parameter
  - Note skill locations: `.claude/skills/` (project)
- **Done When**: Claude Code instructions added
- **Status**: [ ] pending

### Task 2.3: Add Codex skill instructions

- **Files**: `spool-skills/skills/using-spool-skills/SKILL.md`
- **Action**:
  - Add section: "## Using Skills in Codex"
  - Document: read skill files from `.codex/skills/spool-<name>/SKILL.md`
  - Note how Codex discovers and uses skill content
- **Done When**: Codex instructions added
- **Status**: [ ] pending

### Task 2.4: Add harness detection guidance

- **Files**: `spool-skills/skills/using-spool-skills/SKILL.md`
- **Action**:
  - Add section: "## Detecting Your Harness"
  - Document hints: available tools, environment markers, directory structure
- **Done When**: Detection guidance added
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3: Clean content

### Task 3.1: Remove superpowers references

- **Files**: `spool-skills/skills/using-spool-skills/SKILL.md`
- **Action**:
  - Search for any `superpowers` references
  - Replace with `spool-skills` or remove as appropriate
- **Verify**: `grep -i superpowers spool-skills/skills/using-spool-skills/SKILL.md` returns no results
- **Done When**: No superpowers references
- **Status**: [ ] pending

______________________________________________________________________

## Wave 4: Update embedded template

### Task 4.1: Sync embedded template

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/spool-using-spool-skills/SKILL.md`
- **Action**:
  - Copy updated skill from `spool-skills/skills/using-spool-skills/SKILL.md`
- **Done When**: Embedded template updated
- **Status**: [ ] pending

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started
- `[ ] in-progress` - Currently working
- `[x] complete` - Finished and verified
- `[-] shelved` - Deferred
