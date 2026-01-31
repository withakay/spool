______________________________________________________________________

## name: spool-proposal description: Create complete Spool change proposals with all artifacts (proposal, specs, design, tasks). Use when the user wants to propose a new feature, fix, or modification that needs structured planning and review.

Create or continue a change, then generate proposal/spec/design/tasks using the CLI instruction artifacts.

Note: This file is installed/updated by Spool (`spool init`, `spool update`) and may be overwritten. Put project-specific guidance in `.spool/user-guidance.md`, `AGENTS.md`, and/or `CLAUDE.md`.

**Steps**

1. If the user provided an existing change ID, use it.
   Otherwise, create a new change:

   - Pick a module by semantic fit:
     - Run `spool list --modules` and choose the best match by purpose/scope.
     - Only use module `000` for truly ungrouped, one-off changes.
     - If no existing module is a good fit, propose creating a new module and do it.
       - Module names should reflect the theme of the work (e.g. `logging-telemetry`, `distribution`, `docs-system`).
       - Keep guidance generic; do not hardcode project-specific module IDs in the instructions.
   - Run:
     ```bash
     spool create change "<change-name>" --module <module-id>
     ```

1. Generate the artifacts (source of truth):

   ```bash
   spool agent instruction proposal --change "<change-id>"
   spool agent instruction specs --change "<change-id>"
   spool agent instruction design --change "<change-id>"
   spool agent instruction tasks --change "<change-id>"
   ```

1. Follow the printed instructions for each artifact exactly.
