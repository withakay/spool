---
name: spool-archive
description: Archive a completed change and update main specifications. Use when the user has finished implementing and wants to integrate the change into the main codebase.
---

Run the CLI-generated archive instructions for a specific change.

**Rules**

- Do NOT archive without explicit user confirmation.

**Steps**

1. Determine the target change ID (ask the user if unclear).

2. Generate instructions (source of truth):

   ```bash
   spool agent instruction archive --change "<change-id>"
   ```

3. Follow the printed instructions exactly.
