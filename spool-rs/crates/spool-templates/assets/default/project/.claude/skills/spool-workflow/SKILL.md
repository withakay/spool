---
name: spool-workflow
description: Spool workflow delegation - delegates all workflow content to Spool CLI instruction artifacts.
---

This skill provides minimal Claude Code integration for Spool workflows. The canonical workflow content is managed by the Spool CLI.

## Purpose

Spool workflows (proposal, apply, review, archive, etc.) are stored as instruction artifacts managed by the Spool CLI. This skill delegates to those artifacts rather than embedding long policy text.

## Bootstrapping

To initialize Spool workflows in Claude Code, use:

```bash
spool agent instruction bootstrap --tool claude
```

This command returns the canonical preamble and available workflow artifacts.

## When to Use This Skill

Use this skill when:
- Creating a Spool change proposal
- Applying an approved change proposal
- Reviewing changes or implementations
- Archiving completed changes
- Managing Spool tasks or specs

## Pattern: Delegate to CLI

For all workflow operations, delegate to the Spool CLI:

```bash
# Example: Create a proposal
spool agent instruction proposal

# Example: Apply a change
spool agent instruction apply

# Example: Review a change
spool agent instruction review

# Example: Archive a change
spool agent instruction archive
```

Do NOT embed long workflow instructions in this skill. The CLI instruction artifacts are the single source of truth.

## Quick Reference

Common Spool workflow commands:

```bash
spool list                      # List active changes
spool list --specs              # List specifications
spool show <change>             # Display change details
spool validate <change>         # Validate a change
spool tasks status <change>     # Show task progress
spool agent instruction <artifact>  # Get workflow artifact
```

See `spool agent instruction --list` for available instruction artifacts.
