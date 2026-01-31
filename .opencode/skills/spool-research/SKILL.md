______________________________________________________________________

## name: spool-research description: Conduct structured research for feature development, technology evaluation, or problem investigation. Use when the user needs to explore options, analyze trade-offs, or investigate technical approaches.

Run the CLI-generated research instructions for a specific change.

Note: This file is installed/updated by Spool (`spool init`, `spool update`) and may be overwritten. Put project-specific guidance in `.spool/user-guidance.md`, `AGENTS.md`, and/or `CLAUDE.md`.

**Steps**

1. Determine the target change ID (ask the user if unclear).

1. Generate instructions (source of truth):

   ```bash
   spool agent instruction research --change "<change-id>"
   ```

1. Follow the printed instructions exactly.
