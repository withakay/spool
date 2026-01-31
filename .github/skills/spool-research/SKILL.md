---
name: spool-research
description: Conduct structured research for feature development, technology evaluation, or problem investigation. Use when the user needs to explore options, analyze trade-offs, or investigate technical approaches.
---

Run the CLI-generated research instructions for a specific change.

**Steps**

1. Determine the target change ID (ask the user if unclear).

2. Generate instructions (source of truth):
   ```bash
   spool agent instruction research --change "<change-id>"
   ```

3. Follow the printed instructions exactly.
