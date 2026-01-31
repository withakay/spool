---
name: spool-write-change-proposal
description: Use when creating, designing, planning, proposing, or specifying a feature, change, requirement, enhancement, fix, modification, or spec. Use when writing tasks, proposals, specifications, or requirements for new work.
---

# Write Change Proposal

Create or continue a change, then generate proposal/spec/design/tasks using the CLI instruction artifacts.

Note: This file is installed/updated by Spool (`spool init`, `spool update`) and may be overwritten. Put project-specific guidance in `.spool/user-guidance.md`, `AGENTS.md`, and/or `CLAUDE.md`.

**Announce at start:** "I'm using the spool-write-change-proposal skill to create this change proposal."

## Steps

### Step 1: Create or Select Change

If the user provided an existing change ID, use it. Otherwise, create a new change:

1. Pick a module by semantic fit:
   - Run `spool list --modules` and choose the best match by purpose/scope
   - Only use module `000` for truly ungrouped, one-off changes
   - If no existing module fits, propose creating a new module

2. Create the change:
   ```bash
   spool create change "<change-name>" --module <module-id>
   ```

### Step 2: Generate Artifacts

Generate the artifacts (source of truth):

```bash
spool agent instruction proposal --change "<change-id>"
spool agent instruction specs --change "<change-id>"
spool agent instruction design --change "<change-id>"
spool agent instruction tasks --change "<change-id>"
```

Follow the printed instructions for each artifact exactly.

## Task Writing Best Practices

When writing `tasks.md`, follow these guidelines for high-quality implementation plans:

### Bite-Sized Task Granularity

**Each step should be one action (2-5 minutes):**
- "Write the failing test" - one step
- "Run it to make sure it fails" - one step
- "Implement the minimal code" - one step
- "Run the tests" - one step
- "Commit" - one step

### TDD Flow Per Task

For implementation tasks, follow this pattern:

1. **Write the failing test** - Create test that specifies the behavior
2. **Run test to verify it fails** - Confirm the test fails for the right reason
3. **Write minimal implementation** - Just enough code to pass
4. **Run test to verify it passes** - Confirm the implementation works
5. **Commit** - Small, atomic commits

### Task Structure

Each task should specify:
- **Exact file paths** - `src/module/file.rs:45-67`
- **Complete code** - Not "add validation" but the actual code
- **Exact commands** - `cargo test tests::module_test -v`
- **Expected output** - What success/failure looks like
- **Verification** - How to confirm the task is done

### Example Task Format

```markdown
### Task 2.1: Add user validation

- **Files**: `src/user.rs`, `tests/user_test.rs`
- **Action**:
  - Write test for email validation in `tests/user_test.rs`
  - Run `cargo test user_test::test_email_validation` - expect FAIL
  - Implement `validate_email()` in `src/user.rs`
  - Run `cargo test user_test::test_email_validation` - expect PASS
  - Commit: `git commit -m "feat: add email validation"`
- **Verify**: `cargo test` passes
- **Done When**: Email validation rejects invalid formats
- **Status**: [ ] pending
```

## Execution Handoff

After completing all artifacts, the change is ready for implementation:

**"Change proposal complete. To implement, use `spool-apply-change-proposal` skill or run:**

```bash
spool agent instruction apply --change <change-id>
```

## Remember

- Exact file paths always
- Complete code in tasks (not vague descriptions)
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits
- Use wave structure for task dependencies
- Include verification steps in every task
