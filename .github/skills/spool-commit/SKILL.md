______________________________________________________________________

## name: spool-commit description: Create atomic git commits aligned to Spool changes. Use when you want to commit work after applying a change, optionally with auto-mode.

Create atomic git commits aligned to Spool changes.

This skill is intended to be installed by `spool init` so agents can commit work per Spool change in a consistent way.

**Concept:** In Spool-driven workflows, you typically make progress by creating/applying a change. After applying and verifying a change, you should usually create a git commit that corresponds to that change.

**Key behavior**

- Prefer 1 commit per applied Spool change (or a small number of commits if the change is large).
- Include the Spool change id in the commit message when practical (e.g. `001-02_add-tasks`).
- Use Spool inspection commands to anchor the commit to what was actually applied.

## Parameters to check

When invoking this skill, check for these parameters in context:

- **auto_mode**: boolean flag

  - `true`: create commits immediately without asking for confirmation
  - `false` or missing: ask for confirmation of each commit message
  - CRITICAL: this only applies to the current invocation and is reset afterwards

- **change_id**: optional, a Spool change id (recommended)

  - If missing, prompt the user to pick from `spool list --json`

- **stacked_mode**: optional boolean

  - If `true`, create stacked branches per commit (only if tooling exists)
  - If `false` or missing, commit on current branch

- **ticket_id**: optional identifier to include in commit messages

## Prerequisites

1. Verify repo has changes:

   - `git status --short`
   - If no changes, stop with: "No changes found to commit"

1. Identify Spool change context

   If `change_id` not provided:

   - Run `spool list --json`
   - Use AskUserQuestion to select a change (recommended: most recently modified)

   Then inspect the change:

   - `spool status --change "<change-id>"`
   - If available, prefer `--json` and parse it

1. Confirm the change is in a good commit state:

   - Ensure artifacts/tasks are complete enough that a commit makes sense
   - If the change is unfinished, ask user whether to commit "WIP" or wait

## Commit grouping strategy (Spool-first)

1. Default grouping: **one commit per change**

   - Use the change id + change name as the primary unit

1. If the change is too large:

   - Split into 2–3 commits based on task boundaries
   - Keep each commit independently buildable

## Generate commit message

Use conventional commit format:

- Format: `type(scope): description`
- Prefer scope = Spool module name or ticket id
- Description should mention the change goal
- Include Spool change id at end, in parentheses, when practical

Examples:

- `feat(todo): add task model and parsing (001-02_add-task-core)`
- `fix(storage): persist tasks atomically (002-01_storage-save)`

## Procedure

1. Read diffs

   - `git diff`
   - `git status --short`

1. Stage files for the selected change

   - Prefer staging only files touched by that change
   - If unsure which files belong, use Spool inspection output + git diff to decide

1. Decide commit messages

- If `auto_mode` is true:

  - Commit immediately: `git commit -m "<message>"`

- If `auto_mode` is false/missing:

  - Present 1 recommended message + 2 alternatives
  - Ask user to confirm or provide custom message

4. Verify after each commit
   - `git status --short`
   - Optionally run the smallest relevant verification (tests/build) if fast

## Output

After committing, show:

- Change committed: <change-id>
- Commit SHA + message (`git log -1 --oneline`)
- Remaining uncommitted changes (if any)

## Important: auto_mode reset

After this invocation finishes, auto commit behavior must be considered reset. Future operations require explicit `--auto` again.
