______________________________________________________________________

## name: spool-write-change-proposal description: Use when creating, designing, planning, proposing, specifying a feature, change, requirement, enhancement, fix, modification, or spec. Use when writing tasks, proposals, or specifications for new work.

Create or continue a change, then generate proposal/spec/design/tasks using the CLI instruction artifacts.

**Steps**

1. If the user provided an existing change ID, use it.
   Otherwise, create a new change:

   - Pick a module (default to `000` if unsure).
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
