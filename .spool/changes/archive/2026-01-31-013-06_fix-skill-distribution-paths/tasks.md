# Tasks for: 013-06_fix-skill-distribution-paths

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Use the tasks CLI to drive status updates

```bash
spool tasks status 013-06_fix-skill-distribution-paths
spool tasks next 013-06_fix-skill-distribution-paths
spool tasks start 013-06_fix-skill-distribution-paths 1.1
spool tasks complete 013-06_fix-skill-distribution-paths 1.1
```

______________________________________________________________________

## Wave 1: Restructure Embedded Assets

- **Depends On**: None

### Task 1.1: Rename embedded skill folders with spool- prefix

- **Files**: `spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/`
- **Dependencies**: None
- **Action**:
  - Move `spool-skills/brainstorming/` → `spool-brainstorming/`
  - Move `spool-skills/dispatching-parallel-agents/` → `spool-dispatching-parallel-agents/`
  - (etc. for all 14 skills)
  - Remove empty `spool-skills/` directory
- **Verify**: `ls spool-rs/crates/spool-templates/assets/default/project/.opencode/skills/ | grep spool-`
- **Done When**: All skills are directly under `skills/` with `spool-` prefix, no `spool-skills/` folder exists
- **Updated At**: 2026-01-31
- **Status**: [x] complete

______________________________________________________________________

## Wave 2: Update Distribution Code

- **Depends On**: Wave 1

### Task 2.1: Create SPOOL_SKILLS constant and spool_skills_manifests() function

- **Files**: `spool-rs/crates/spool-core/src/distribution.rs`
- **Dependencies**: None
- **Action**:
  - Added `SPOOL_SKILLS` const listing all 14 skill names
  - Created `spool_skills_manifests()` function that generates FileManifest entries with:
    - Source: `skills/<name>/SKILL.md` (relative to spool-skills/)
    - Dest: `spool-<name>/SKILL.md` (under target skills dir)
- **Verify**: `cargo test -p spool-core`
- **Done When**: Function generates correct manifests with spool- prefix
- **Updated At**: 2026-01-31
- **Status**: [x] complete

### Task 2.2: Fix opencode_manifests() to use flat structure

- **Files**: `spool-rs/crates/spool-core/src/distribution.rs`
- **Dependencies**: Task 2.1
- **Action**:
  - Changed to use `spool_skills_manifests(&skills_dir)` for flat structure
  - Skills go to `.opencode/skills/spool-<skill>/SKILL.md`
- **Verify**: `cargo test -p spool-core`
- **Done When**: OpenCode skills install to flat path structure with prefix
- **Updated At**: 2026-01-31
- **Status**: [x] complete

### Task 2.3: Add skill distribution to claude_manifests()

- **Files**: `spool-rs/crates/spool-core/src/distribution.rs`
- **Dependencies**: Task 2.1
- **Action**:
  - Added `spool_skills_manifests(&skills_dir)` call
  - Skills go to `.claude/skills/spool-<skill>/SKILL.md`
- **Verify**: `cargo test -p spool-core`
- **Done When**: Claude harness receives skills on `spool init --tools claude`
- **Updated At**: 2026-01-31
- **Status**: [x] complete

### Task 2.4: Add skill distribution to codex_manifests()

- **Files**: `spool-rs/crates/spool-core/src/distribution.rs`
- **Dependencies**: Task 2.1
- **Action**:
  - Added `spool_skills_manifests(&skills_dir)` call
  - Skills go to `.codex/skills/spool-<skill>/SKILL.md`
- **Verify**: `cargo test -p spool-core`
- **Done When**: Codex harness receives skills on `spool init --tools codex`
- **Updated At**: 2026-01-31
- **Status**: [x] complete

______________________________________________________________________

## Wave 3: Update Documentation

- **Depends On**: Wave 2

### Task 3.1: Rewrite README.opencode.md

- **Files**: `spool-skills/docs/README.opencode.md`
- **Dependencies**: None
- **Action**:
  - Removed all symlink instructions (symlinks are forbidden)
  - Documented the flat `spool-<skill>` structure
  - Explained skills are installed via `spool init --tools opencode`
  - Added cleanup instructions for old `skills/spool-skills/` path
- **Verify**: Read the file and confirm no symlink references exist
- **Done When**: Documentation is correct and mentions only copying/flat structure
- **Updated At**: 2026-01-31
- **Status**: [x] complete

______________________________________________________________________

## Wave 4: Verification

- **Depends On**: Wave 3

### Task 4.1: Build and test full distribution

- **Files**: N/A
- **Dependencies**: All prior tasks
- **Action**:
  - Ran `cargo build --workspace` - ✓ passed
  - Ran `cargo test --workspace` - ✓ passed
  - Tested `spool init --tools opencode` - ✓ skills installed to `.opencode/skills/spool-*`
  - Tested `spool init --tools claude` - ✓ skills installed to `.claude/skills/spool-*`
  - Tested `spool init --tools codex` - ✓ skills installed to `.codex/skills/spool-*`
- **Verify**: `cargo test --workspace && cargo build --release`
- **Done When**: All tests pass, manual verification confirms correct paths
- **Updated At**: 2026-01-31
- **Status**: [x] complete

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified
- `[-] shelved` - Intentionally not-to-be-done (reversible)
