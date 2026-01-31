---
name: spool-apply-change-proposal
description: Use when implementing, executing, applying, building, coding, or developing a feature, change, requirement, enhancement, fix, or modification. Use when running tasks from a spec, proposal, or plan.
---

# Apply Change Proposal

Run the CLI-generated apply instructions for a specific change, executing tasks with review checkpoints.

Note: This file is installed/updated by Spool (`spool init`, `spool update`) and may be overwritten. Put project-specific guidance in `.spool/user-guidance.md`, `AGENTS.md`, and/or `CLAUDE.md`.

**Announce at start:** "I'm using the spool-apply-change-proposal skill to implement this change."

## Steps

### Step 1: Determine Change and Get Context

1. Determine the target change ID:
   - If the user provides one, use it
   - Otherwise run `spool list` and ask the user which change to apply

2. Generate instructions (source of truth):
   ```bash
   spool agent instruction apply --change "<change-id>"
   ```

3. Follow the printed instructions to understand the tasks

### Step 2: Critical Review Before Starting

1. Review tasks critically - identify any questions or concerns
2. **If concerns:** Raise them with your human partner before starting
3. **If no concerns:** Proceed to execution

**Never start implementation on main/master branch without explicit user consent.**

### Step 3: Execute in Batches

**Default batch size: 3 tasks**

For each task:
1. Mark as in_progress: `spool tasks start <change-id> <task-id>`
2. Follow each step exactly (tasks should have bite-sized steps)
3. Run verifications as specified in the task
4. Mark as completed: `spool tasks complete <change-id> <task-id>`

### Step 4: Report After Each Batch

When batch complete:
- Show what was implemented
- Show verification output (test results, build status)
- Say: "Ready for feedback on this batch."

### Step 5: Continue Based on Feedback

Based on feedback:
- Apply changes if needed
- Execute next batch of 3 tasks
- Repeat until all tasks complete

### Step 6: Complete Development

After all tasks complete and verified:
- Announce: "All tasks complete. Using spool-finishing-a-development-branch skill to complete this work."
- **REQUIRED:** Invoke `spool-finishing-a-development-branch` skill
- Follow that skill to verify tests, present options (including spool-archive), execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Tasks have critical gaps preventing progress
- You don't understand an instruction
- Verification fails repeatedly (3+ times)

**Ask for clarification rather than guessing.**

## When to Shelve a Task

If a task is blocked but others can proceed:
```bash
spool tasks shelve <change-id> <task-id>
```

Document why it was shelved and continue with unblocked tasks.

## Remember

- Review tasks critically before starting
- Follow task steps exactly
- Don't skip verifications
- Between batches: report and wait for feedback
- Stop when blocked, don't guess
- Never start on main/master without explicit consent
- Use `spool tasks` CLI for all status updates
