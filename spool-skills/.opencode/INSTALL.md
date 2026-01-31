# Installing spool-skills for OpenCode

> **Note:** This is a fork of [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent.

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed

## Installation Steps

### 1. Clone spool-skills

```bash
git clone https://github.com/withakay/spool-skills.git ~/.config/opencode/spool-skills
```

### 2. Register the Plugin

Create a symlink so OpenCode discovers the plugin:

```bash
mkdir -p ~/.config/opencode/plugins
rm -f ~/.config/opencode/plugins/spool-skills.js
ln -s ~/.config/opencode/spool-skills/.opencode/plugins/spool-skills.js ~/.config/opencode/plugins/spool-skills.js
```

### 3. Symlink Skills

Create a symlink so OpenCode's native skill tool discovers spool-skills:

```bash
mkdir -p ~/.config/opencode/skills
rm -rf ~/.config/opencode/skills/spool-skills
ln -s ~/.config/opencode/spool-skills/skills ~/.config/opencode/skills/spool-skills
```

### 4. Restart OpenCode

Restart OpenCode. The plugin will automatically inject spool-skills context.

Verify by asking: "do you have spool-skills?"

## Usage

### Finding Skills

Use OpenCode's native `skill` tool to list available skills:

```
use skill tool to list skills
```

### Loading a Skill

Use OpenCode's native `skill` tool to load a specific skill:

```
use skill tool to load spool-skills/brainstorming
```

### Personal Skills

Create your own skills in `~/.config/opencode/skills/`:

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

Create project-specific skills in `.opencode/skills/` within your project.

**Skill Priority:** Project skills > Personal skills > spool-skills

## Updating

```bash
cd ~/.config/opencode/spool-skills
git pull
```

## Troubleshooting

### Plugin not loading

1. Check plugin symlink: `ls -l ~/.config/opencode/plugins/spool-skills.js`
2. Check source exists: `ls ~/.config/opencode/spool-skills/.opencode/plugins/spool-skills.js`
3. Check OpenCode logs for errors

### Skills not found

1. Check skills symlink: `ls -l ~/.config/opencode/skills/spool-skills`
2. Verify it points to: `~/.config/opencode/spool-skills/skills`
3. Use `skill` tool to list what's discovered

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` → `update_plan`
- `Task` with subagents → `@mention` syntax
- `Skill` tool → OpenCode's native `skill` tool
- File operations → your native tools

## Getting Help

- Report issues: https://github.com/withakay/spool-skills/issues
- Original Superpowers: https://github.com/obra/superpowers
- Full documentation: https://github.com/withakay/spool-skills/blob/main/docs/README.opencode.md
