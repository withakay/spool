# spool-skills for OpenCode

> **Note:** This is a fork of [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://github.com/obra).

Complete guide for using spool-skills with [OpenCode.ai](https://opencode.ai).

## Installation

spool-skills are installed automatically when you initialize Spool in your project:

```bash
# Initialize Spool with OpenCode support
spool init --tools opencode

# Or with multiple tools
spool init --tools opencode,claude,codex
```

This copies all spool-skills directly to `.opencode/skills/` in your project with the `spool-` prefix (e.g., `spool-brainstorming`, `spool-systematic-debugging`).

### Verify Installation

```bash
ls .opencode/skills/ | grep spool-
```

You should see skills like:
- `spool-brainstorming/`
- `spool-dispatching-parallel-agents/`
- `spool-systematic-debugging/`
- etc.

## Upgrading

To update spool-skills to the latest version:

```bash
spool update --tools opencode
```

### Upgrading from Old Installation

If you previously had a nested structure (`.opencode/skills/spool-skills/`), remove it first:

```bash
# Remove old nested structure
rm -rf .opencode/skills/spool-skills

# Update with correct flat structure
spool update --tools opencode --force
```

## Usage

### Finding Skills

Use OpenCode's native `skill` tool to list all available skills:

```
use skill tool to list skills
```

### Loading a Skill

Use OpenCode's native `skill` tool to load a specific skill:

```
use skill tool to load spool-brainstorming
```

Note: Skills use the `spool-` prefix (e.g., `spool-brainstorming`, not `brainstorming`).

### Personal Skills

Create your own skills in your OpenCode user config:

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in your project:

```bash
mkdir -p .opencode/skills/my-project-skill
```

Create `.opencode/skills/my-project-skill/SKILL.md`:

```markdown
---
name: my-project-skill
description: Use when [condition] - [what it does]
---

# My Project Skill

[Your skill content here]
```

## Skill Locations

OpenCode discovers skills from these locations:

1. **Project skills** (`.opencode/skills/`) - Highest priority, includes spool-skills
2. **Personal skills** (`~/.config/opencode/skills/`) - User-level custom skills

Skills are organized flat under the skills directory (no subfolders of skill collections).

## Features

### Automatic Context Injection

The plugin automatically injects spool-skills context via the `experimental.chat.system.transform` hook. This adds the "using-spool-skills" skill content to the system prompt on every request.

### Native Skills Integration

spool-skills uses OpenCode's native `skill` tool for skill discovery and loading. Skills are copied to `.opencode/skills/spool-<name>/` so they appear alongside your project skills.

### Tool Mapping

Skills written for Claude Code are automatically adapted for OpenCode. The bootstrap provides mapping instructions:

- `TodoWrite` → `update_plan`
- `Task` with subagents → OpenCode's `@mention` system
- `Skill` tool → OpenCode's native `skill` tool
- File operations → Native OpenCode tools

## Plugin

The spool-skills OpenCode plugin (`spool-skills.js`) is installed to `.opencode/plugins/` and provides:

1. **Bootstrap injection**: Adds skill usage guidance to the system prompt
2. **Skill mapping**: Translates Claude Code tool names to OpenCode equivalents

## Troubleshooting

### Skills not found

1. Verify skills exist: `ls .opencode/skills/ | grep spool-`
2. Use OpenCode's `skill` tool to list available skills
3. Check skill structure: each skill needs a `SKILL.md` file with valid frontmatter

### Old nested structure still present

If you see `.opencode/skills/spool-skills/` (nested folder), this is the old structure. Remove it:

```bash
rm -rf .opencode/skills/spool-skills
spool update --tools opencode --force
```

### Plugin not loading

1. Check plugin exists: `ls .opencode/plugins/spool-skills.js`
2. Check OpenCode logs: `opencode run "test" --print-logs --log-level DEBUG`
3. Look for plugin loading message in logs

## Getting Help

- Report issues: https://github.com/withakay/spool-skills/issues
- Original author: [Jesse Vincent](https://github.com/obra)
- Original Superpowers repo: https://github.com/obra/superpowers
- OpenCode docs: https://opencode.ai/docs/

## Testing

Verify your installation:

```bash
# Check skills are discoverable
opencode run "use skill tool to list all skills" 2>&1 | grep spool-

# Check a specific skill loads
opencode run "use skill tool to load spool-brainstorming"
```

The agent should be able to list and load skills with the `spool-` prefix.
