---
name: spool-apply
description: Implement tasks from a completed Spool change proposal. Use when the user wants to start coding or implementing an approved change.
---

Implement tasks from a completed Spool change proposal.

**Input**: Optionally specify a change name. If omitted, MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `spool list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show changes that are implementation-ready (have tasks artifact and all required artifacts).
   Mark recently modified changes as "(Recent)".

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check change is ready for implementation**
   ```bash
    spool status --change "<change-id>" --json
   ```
   - Verify all required artifacts are complete (proposal, specs, design, tasks)
   - If artifacts are missing, suggest using `spool-continue-change` first

3. **Get implementation context**
   ```bash
   spool agent instruction apply --change "<change-id>" --json
   ```
   - This returns context files, task list, and progress
   - Parse the JSON to understand the current state

4. **Read all context files**
   - proposal.md: Understand the high-level goals
   - specs/*/spec.md: Understand the detailed requirements
   - design.md: Understand the technical approach
   - tasks.md: Get the task list to implement

5. **Show current implementation plan**
   - Display the change summary and schema used
   - Show task progress: "N/M tasks complete"
   - List the remaining tasks to implement

6. **Implement tasks systematically**

   For each pending task in tasks.md:
   - **Start the task**: Mark as in-progress if the task format supports it
   - **Understand the task**: Read relevant specs and design sections
   - **Implement the changes**: Write code, tests, documentation as needed
   - **Verify the implementation**: Run tests, check functionality
   - **Mark the task complete**: Change `- [ ]` to `- [x]` in tasks.md
   - **Show progress**: Briefly report what was completed

   **Pause if:**
   - Task requirements are unclear → ask for clarification
   - Implementation reveals design issues → suggest updating artifacts
   - Tests are failing → debug and fix
   - User interrupts or wants to review progress

7. **After completing tasks, validate**
   ```bash
   spool validate --changes <name>
   ```
   - Run validation to ensure the change meets all requirements
   - Fix any issues found during validation

**Output During Implementation**

```
## Implementing: <change-name>

Working on task 3/7: <task description>
[Implementation details...]
✓ Task complete: <summary of what was done>

Working on task 4/7: <task description>
[Implementation details...]
✓ Task complete: <summary of what was done>
```

**Output On Completion**

```
## Implementation Complete: <change-name>

**Progress:** 7/7 tasks complete ✓
**Validation:** All checks passed

### Summary
- [x] Task 1: <description>
- [x] Task 2: <description>
...
- [x] Task 7: <description>

Ready to archive this change with: `spool archive <name>`
```

**Guardrails**
- Always read context files before starting implementation
- Follow the technical approach defined in design.md
- Implement tasks in order unless there's a good reason not to
- Mark tasks complete immediately after finishing each one
- If implementation reveals issues, pause and suggest artifact updates
- Run validation before considering the change complete
