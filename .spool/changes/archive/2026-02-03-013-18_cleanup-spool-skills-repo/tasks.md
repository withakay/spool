# Tasks for: 013-18_cleanup-spool-skills-repo

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential (simple cleanup)
- **Risk**: Low - removing unused files

```bash
spool tasks status 013-18_cleanup-spool-skills-repo
spool tasks next 013-18_cleanup-spool-skills-repo
spool tasks start 013-18_cleanup-spool-skills-repo 1.1
spool tasks complete 013-18_cleanup-spool-skills-repo 1.1
```

---

## Wave 1: Remove Unused Directories

- **Depends On**: None

### Task 1.1: Remove unused directories from spool-skills

- **Files**: `spool-skills/`
- **Dependencies**: None
- **Action**:
  - Remove `spool-skills/adapters/`
  - Remove `spool-skills/agents/`
  - Remove `spool-skills/commands/`
  - Remove `spool-skills/hooks/`
  - Remove `spool-skills/lib/`
  - Remove `spool-skills/tests/`
  - Remove `spool-skills/docs/`
  - Remove `spool-skills/.claude-plugin/`
  - Remove `spool-skills/.codex/`
  - Remove `spool-skills/.github/`
  - Remove `spool-skills/.opencode/`
- **Verify**: `ls spool-skills/` shows only skills/, LICENSE, .gitignore, .gitattributes
- **Done When**: Only skills/ and essential files remain
- **Updated At**: 2026-02-01
- **Status**: [x] complete

### Task 1.2: Remove unused files from spool-skills

- **Files**: `spool-skills/`
- **Dependencies**: Task 1.1
- **Action**:
  - Remove `spool-skills/README.md`
  - Remove `spool-skills/RELEASE-NOTES.md`
  - Keep `spool-skills/LICENSE`
  - Keep `spool-skills/.gitignore`
  - Keep `spool-skills/.gitattributes`
- **Verify**: `ls -la spool-skills/` shows minimal structure
- **Done When**: Only essential files remain
- **Updated At**: 2026-02-01
- **Status**: [x] complete

---

## Wave 2: Verification

- **Depends On**: Wave 1

### Task 2.1: Verify distribution still works

- **Files**: `spool-rs/crates/spool-core/src/distribution.rs`
- **Dependencies**: Task 1.2
- **Action**:
  - Run `cargo test -p spool-core` to verify distribution tests pass
  - Run `spool init` in a test directory to verify skills install correctly
  - Verify all 12 skills are present after init
- **Verify**: `cargo test -p spool-core && spool init --force && ls .opencode/skills/spool-*`
- **Done When**: All distribution tests pass, skills install correctly
- **Updated At**: 2026-02-01
- **Status**: [x] complete

### Task 2.2: Review and checkpoint

- **Type**: checkpoint (requires human approval)
- **Files**: `spool-skills/`
- **Dependencies**: Task 2.1
- **Action**:
  - Human review of cleaned-up structure
  - Confirm no needed files were removed
  - Approve for archive
- **Done When**: Human approves cleanup
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

---

## Task Status Legend

- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified
- `[-] shelved` - Intentionally not-to-be-done (reversible)
