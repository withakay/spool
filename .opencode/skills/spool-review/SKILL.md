______________________________________________________________________

## name: spool-review description: Review and validate Spool changes, specs, or implementations. Use when the user wants a quality check, code review, or validation of project artifacts.

Run the CLI-generated review instructions for a specific change.

Note: This file is installed/updated by Spool (`spool init`, `spool update`) and may be overwritten. Put project-specific guidance in `.spool/user-guidance.md`, `AGENTS.md`, and/or `CLAUDE.md`.

**Steps**

1. Determine the target change ID (ask the user if unclear).

1. Generate instructions (source of truth):

   ```bash
   spool agent instruction review --change "<change-id>"
   ```

1. Follow the printed instructions exactly.
