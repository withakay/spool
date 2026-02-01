______________________________________________________________________

## name: spool-apply-change-proposal description: Use when implementing, executing, applying, building, coding, or developing a feature, change, requirement, enhancement, fix, or modification. Use when running tasks from a spec or proposal.

Run the CLI-generated apply instructions for a specific change.

**Steps**

1. Determine the target change ID.

   - If the user provides one, use it.
   - Otherwise run `spool list` and ask the user which change to apply.

1. Generate instructions (source of truth):

   ```bash
   spool agent instruction apply --change "<change-id>"
   ```

1. Follow the printed instructions exactly.
