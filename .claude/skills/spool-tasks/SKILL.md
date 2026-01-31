---
name: spool-tasks
description: Use Spool tasks CLI to manage tasks.md (status/next/start/complete/shelve/add).
---

Use the `spool tasks` CLI to track and update implementation tasks for a change.

**Rules**
- Prefer `spool tasks ...` over manual editing of `tasks.md`.
- Enhanced tasks.md supports `start`, `shelve`, `unshelve`, and `add`.
- Checkbox-only tasks.md is supported in compat mode (no in-progress or shelving); complete tasks by 1-based index.

**Common Commands**

```bash
spool tasks status <change-id>
spool tasks next <change-id>
spool tasks start <change-id> <task-id>
spool tasks complete <change-id> <task-id>
spool tasks complete <change-id> <index>
spool tasks shelve <change-id> <task-id>
spool tasks unshelve <change-id> <task-id>
spool tasks add <change-id> "<task name>" --wave <n>
spool tasks show <change-id>
```

**If tasks.md is missing**
- Create enhanced tracking file: `spool tasks init <change-id>`

**If the user asks "what should I do next?"**
- Run `spool tasks next <change-id>` and follow the printed Action/Verify/Done When.

**Guardrails**
- If a task is blocked, run `spool tasks status <change-id>` and either resolve blockers or shelve the task (enhanced only).
- If `spool tasks start` or `shelve` fails because the file is checkbox-only, explain the limitation and use `spool tasks complete` when done.
