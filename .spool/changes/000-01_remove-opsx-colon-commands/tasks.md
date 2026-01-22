# Tasks for: 000-01_remove-opsx-colon-commands

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Verify**: `node bin/spool.js validate --all` and `make build`

---

## Wave 1

### Task 1.1: Replace `/opsx:*` references with `/spool-*`
- **Files**: `src/**`, `docs/**`, `CHANGELOG.md`, `.github/workflows/polish-release-notes.yml`
- **Dependencies**: None
- **Action**:
  - Remove all `/opsx:*` references and standardize the experimental workflow to the hyphenated `/spool-*` commands.
  - Ensure generators/templates output `.claude/commands/spool-*.md` wrappers.
- **Verify**: `rg "/opsx:" src docs dist CHANGELOG.md .github/workflows`
- **Done When**: No `/opsx:*` references remain outside historical archives.
- **Status**: [x] complete

### Task 1.2: Standardize OpenCode directory to `.opencode/commands/`
- **Files**: `src/core/configurators/slash/opencode.ts`, `.spool/specs/cli-init/spec.md`, `.spool/specs/cli-update/spec.md`, `test/**`
- **Dependencies**: Task 1.1
- **Action**:
  - Update OpenCode configurator output path.
  - Update specs and tests to use `.opencode/commands/`.
- **Verify**: `rg "\\.opencode/command/" src test dist .spool/specs`
- **Done When**: No `.opencode/command/` references remain in active code/specs/tests.
- **Status**: [x] complete

### Task 1.3: Validate and build
- **Files**: `.spool/changes/000-01_remove-opsx-colon-commands/**`
- **Dependencies**: Task 1.1, Task 1.2
- **Action**:
  - Add change artifacts required by schema validation.
  - Ensure `spool validate --all` passes.
- **Verify**: `node bin/spool.js validate --all`
- **Done When**: All validations pass.
- **Status**: [x] complete
