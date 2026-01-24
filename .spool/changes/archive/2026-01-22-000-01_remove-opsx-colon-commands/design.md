## Context

The experimental workflow previously used `/opsx:*` colon commands in Claude Code wrappers and documentation. This change removes the Claude-specific naming and standardizes on `/spool-*` hyphenated commands.

## Goals / Non-Goals

**Goals:**

- Remove `/opsx:*` command references from the codebase.
- Standardize the experimental workflow slash commands to the `/spool-*` set.

**Non-Goals:**

- Backward compatibility for `/opsx:*`.
- Fixing unrelated test regressions.

## Decisions

- Use hyphenated `/spool-*` commands (no `/spool:...` colon commands for the experimental workflow).

## Risks / Trade-offs

- Breaking change for users relying on `/opsx:*`.
