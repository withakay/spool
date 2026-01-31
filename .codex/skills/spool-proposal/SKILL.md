---
name: spool-proposal
description: Create complete Spool change proposals with all artifacts (proposal, specs, design, tasks). Use when the user wants to propose a new feature, fix, or modification that needs structured planning and review.
---

Create or continue a change, then generate proposal/spec/design/tasks using the CLI instruction artifacts.

**Steps**

1. If the user provided an existing change ID, use it.
   Otherwise, create a new change:
   - Pick a module (default to `000` if unsure).
   - Run:
     ```bash
     spool create change "<change-name>" --module <module-id>
     ```

2. Generate the artifacts (source of truth):
   ```bash
   spool agent instruction proposal --change "<change-id>"
   spool agent instruction spec --change "<change-id>"
   spool agent instruction design --change "<change-id>"
   spool agent instruction tasks --change "<change-id>"
   ```

3. Follow the printed instructions for each artifact exactly.
