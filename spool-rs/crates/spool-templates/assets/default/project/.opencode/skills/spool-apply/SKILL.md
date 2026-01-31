---
name: spool-apply
description: Implement tasks from a completed Spool change proposal. Use when the user wants to start coding or implementing an approved change.
---

Run the CLI-generated apply instructions for a specific change.

Note: This file is installed/updated by Spool (`spool init`, `spool update`) and may be overwritten. Put project-specific guidance in `.spool/user-guidance.md`, `AGENTS.md`, and/or `CLAUDE.md`.

**Steps**

1. Determine the target change ID.
   - If the user provides one, use it.
   - Otherwise run `spool list` and ask the user which change to apply.

2. Generate instructions (source of truth):
   ```bash
   spool agent instruction apply --change "<change-id>"
   ```

3. Follow the printed instructions exactly.
