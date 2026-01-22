## Context

The experimental workflow previously used `/opsx:*` colon commands in Claude Code wrappers and documentation. This change removes the Claude-specific naming and standardizes on `/spool-*` hyphenated commands.

Separately, OpenCode command generation referenced `.opencode/command/`, but OpenCode documentation expects `.opencode/commands/`.

## Goals / Non-Goals

**Goals:**

- Remove `/opsx:*` command references from the codebase.
- Standardize the experimental workflow slash commands to the `/spool-*` set.
- Standardize OpenCode slash command output to `.opencode/commands/`.

**Non-Goals:**

- Backward compatibility for `/opsx:*`.
- Fixing unrelated test regressions.

## Decisions

- Use hyphenated `/spool-*` commands (no `/spool:...` colon commands for the experimental workflow).
- Treat `.opencode/commands/` as the only supported OpenCode directory (no dual-write).

## Risks / Trade-offs

- Breaking change for users relying on `/opsx:*`.
- Existing OpenCode users may have to move files from `.opencode/command/` to `.opencode/commands/`.
