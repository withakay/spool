______________________________________________________________________

## name: spool-archive description: Archive a completed change and update main specifications. Use when the user has finished implementing and wants to integrate the change into the main codebase.

Run the CLI-generated archive instructions for a specific change.

Note: This file is installed/updated by Spool (`spool init`, `spool update`) and may be overwritten. Put project-specific guidance in `.spool/user-guidance.md`, `AGENTS.md`, and/or `CLAUDE.md`.

**Rules**

- Do NOT archive without explicit user confirmation.

**Steps**

1. Determine the target change ID (ask the user if unclear).

1. Generate instructions (source of truth):

   ```bash
   spool agent instruction archive --change "<change-id>"
   ```

1. Follow the printed instructions exactly.
