---
name: spool-archive
description: Archive a completed change and update main specifications. Use when the user has finished implementing and wants to integrate the change into the main codebase.
---

Archive a completed change and update main specifications.

**Input**: Optionally specify a change name. If omitted, MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `spool list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show completed changes (all artifacts done) that are ready for archiving.
   Mark recently completed changes as "(Recent)".

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Validate the change is ready**
   ```bash
   spool validate --changes <name>
   ```
   - Ensure all requirements are met
   - Check that implementation is complete
   - Verify tests are passing

3. **Show what will be archived**
   - Display the change summary from proposal.md
   - List the capabilities that will be integrated into main specs
   - Show any breaking changes or migration requirements

4. **Confirm with user**
   - Ask: "Ready to archive <name>? This will integrate the change into main specs."
   - Wait for explicit confirmation before proceeding

5. **Archive the change**
   ```bash
   spool archive <name>
   ```
   - This will:
     - Move change directory to `.spool/changes/archive/`
     - Update main specs with delta specs from the change
     - Update any relevant project documentation

6. **Verify the archive**
   - Check that the change is in the archive
   - Verify main specs were updated correctly
   - Confirm no artifacts were lost

**Output On Success**

```
## Change Archived: <change-name>

**Summary:** <brief description of the change>

**Integrated Capabilities:**
- **<capability-1>**: Updated main spec with new requirements
- **<capability-2>**: Added new scenarios to existing requirements

**Archive Location:** .spool/changes/archive/<name>/

**Next Steps:**
- Commit the updated main specs
- Consider updating documentation
- Communicate changes to team

The change is now part of the main codebase specifications!
```

**Output If Not Ready**

```
## Change Not Ready to Archive

**Issues Found:**
- [ ] Some tasks are not complete
- [ ] Validation failed: <specific issues>
- [ ] Tests are not passing

**Recommended Actions:**
1. Complete remaining tasks with `spool-apply-change-proposal`
2. Fix validation issues
3. Run tests and ensure they pass
4. Try archiving again

Ready to fix these issues, or want to review the change first?
```

**Guardrails**
- Always validate before archiving
- Get explicit user confirmation before proceeding
- Ensure all delta specs are properly integrated
- Verify the archive process completed successfully
