<!-- SPOOL:START -->

# User Guidance

This file is for optional, user-authored guidance that Spool will inject into `spool agent instruction <artifact>` outputs.

Use this file for project-specific preferences (style, constraints, defaults). Avoid editing tool prompt files directly (`.opencode/`, `.github/`, `.codex/`, `.claude/`) unless you intend to maintain those changes across `spool update`.

- Spool may update this header block over time.
- Add your guidance below the `<!-- SPOOL:END -->` marker.

<!-- SPOOL:END -->

## Your Guidance

- Make use of subagents to delegate tasks to. Try and use appropriate subagents for a given task. This helps reduce load and managing context.

### Applying Changes

- When a change proposal is implemented (AKA applied) use the `rust-style` skill to ensure that the linting and formatting rules are followed.

### Archiving Changes

- When a change proposal is archived increase the patch portion of version string in `Cargo.toml`.
