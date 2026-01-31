# spool-skills for Codex

> **Note:** This is a fork of [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://github.com/obra).

Complete guide for using spool-skills with OpenAI Codex.

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/withakay/spool-skills/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenAI Codex access
- Shell access to install files

### Installation Steps

#### 1. Clone spool-skills

```bash
mkdir -p ~/.codex/spool-skills
git clone https://github.com/withakay/spool-skills.git ~/.codex/spool-skills
```

#### 2. Install Bootstrap

The bootstrap file is included in the repository at `.codex/superpowers-bootstrap.md`. Codex will automatically use it from the cloned location.

#### 3. Verify Installation

Tell Codex:

```
Run ~/.codex/spool-skills/.codex/spool-skills-codex find-skills to show available skills
```

You should see a list of available skills with descriptions.

## Usage

### Finding Skills

```
Run ~/.codex/spool-skills/.codex/spool-skills-codex find-skills
```

### Loading a Skill

```
Run ~/.codex/spool-skills/.codex/spool-skills-codex use-skill spool-skills:brainstorming
```

### Bootstrap All Skills

```
Run ~/.codex/spool-skills/.codex/spool-skills-codex bootstrap
```

This loads the complete bootstrap with all skill information.

### Personal Skills

Create your own skills in `~/.codex/skills/`:

```bash
mkdir -p ~/.codex/skills/my-skill
```

Create `~/.codex/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override spool-skills with the same name.

## Architecture

### Codex CLI Tool

**Location:** `~/.codex/spool-skills/.codex/spool-skills-codex`

A Node.js CLI script that provides three commands:
- `bootstrap` - Load complete bootstrap with all skills
- `use-skill <name>` - Load a specific skill
- `find-skills` - List all available skills

### Shared Core Module

**Location:** `~/.codex/spool-skills/lib/skills-core.js`

The Codex implementation uses the shared `skills-core` module (ES module format) for skill discovery and parsing. This is the same module used by the OpenCode plugin, ensuring consistent behavior across platforms.

### Tool Mapping

Skills written for Claude Code are adapted for Codex with these mappings:

- `TodoWrite` → `update_plan`
- `Task` with subagents → Use collab `spawn_agent` + `wait` when available; if collab is disabled, say so and proceed sequentially
- `Subagent` / `Agent` tool mentions → Map to `spawn_agent` (collab) or sequential fallback when collab is disabled
- `Skill` tool → `~/.codex/spool-skills/.codex/spool-skills-codex use-skill`
- File operations → Native Codex tools

## Updating

```bash
cd ~/.codex/spool-skills
git pull
```

## Troubleshooting

### Skills not found

1. Verify installation: `ls ~/.codex/spool-skills/skills`
2. Check CLI works: `~/.codex/spool-skills/.codex/spool-skills-codex find-skills`
3. Verify skills have SKILL.md files

### CLI script not executable

```bash
chmod +x ~/.codex/spool-skills/.codex/spool-skills-codex
```

### Node.js errors

The CLI script requires Node.js. Verify:

```bash
node --version
```

Should show v14 or higher (v18+ recommended for ES module support).

## Getting Help

- Report issues: https://github.com/withakay/spool-skills/issues
- Original author: [Jesse Vincent](https://github.com/obra)
- Original Superpowers repo: https://github.com/obra/superpowers
- Original blog post: https://blog.fsck.com/2025/10/09/superpowers/

## Note

Codex support is experimental and may require refinement based on user feedback. If you encounter issues, please report them on GitHub.
