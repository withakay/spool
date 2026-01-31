______________________________________________________________________

## name: spool description: Unified entry point for spool commands with intelligent skill-first routing and CLI fallback.

Route spool commands to the best handler.

Note: This file is installed/updated by Spool (`spool init`, `spool update`) and may be overwritten. Put project-specific guidance in `.spool/user-guidance.md`, `AGENTS.md`, and/or `CLAUDE.md`.

## Goal

Users may type requests like `spool archive 001-03_add-spool-skill` or `spool dashboard`.

This skill MUST:

1. Prefer matching spool-\* skills (skill-first precedence)
1. Fall back to the spool CLI when no matching skill is installed
1. Preserve argument order and content

## Input

The requested command is provided either:

- As plain text following the word "spool" in the user request, or
- In prompt arguments (if your harness provides them), or
- In a <SpoolCommand> block

## Command Aliases

Some commands have verbose skill names for discoverability. Map short commands to full skill names:

| Short Command | Full Skill Name |
|---------------|-----------------|
| `proposal` | `spool-write-change-proposal` |
| `write-change-proposal` | `spool-write-change-proposal` |
| `apply` | `spool-apply-change-proposal` |
| `apply-change-proposal` | `spool-apply-change-proposal` |

## Steps

1. **Parse** the command:

   - Extract the primary command (first token) and the remaining args
   - If no command is provided, output a concise error: "Command is required" and show a one-line usage example

1. **Resolve skill target**:

   - Check the Command Aliases table first for mapped skill names
   - Otherwise build candidate skill id: `spool-${command}`
   - Determine if that skill is installed/available in this harness
     - OpenCode: check for a directory under `.opencode/skills/`
     - Claude: check for a directory under `.claude/skills/`
     - GitHub Copilot: check for a directory under `.github/skills/`
     - Codex: skills are global; if unsure, assume not installed and use CLI fallback

1. **Execute**:

   - If matching skill exists: follow that skill's instructions, passing along the original args
   - Otherwise: invoke the CLI using Bash:
     - `spool <command> <args...>`

1. **Error handling**:

   - If the invoked skill fails: prefix with `[spool-* skill error]` and preserve the original error
   - If the CLI fails: prefix with `[spool CLI error]` and preserve the original error
