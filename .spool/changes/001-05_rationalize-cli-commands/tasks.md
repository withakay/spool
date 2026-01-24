# Tasks for: 001-05_rationalize-cli-commands

## Execution Notes
- **Tool**: OpenCode
- **Mode**: Sequential
- **Note**: Do not implement until proposal is approved

---

## Wave 1: CLI Command Surface

### Task 1.1: Rename artifact workflow commands to `x-*`
- **Files**: `src/commands/artifact-workflow.ts`
- **Dependencies**: None
- **Action**:
  - Register `x-status`, `x-instructions`, `x-templates`, `x-schemas`, `x-new`, `x-artifact-experimental-setup`
  - Keep legacy names as hidden deprecated wrappers that print a warning and delegate to the same handler
  - Ensure `spool --help` only shows the `x-*` commands (legacy hidden)
- **Verify**: `spool --help`; run each command once (`spool x-status --change <id>` etc.)
- **Done When**: commands work under new names; old names still work but warn
- **Status**: [ ] pending

### Task 1.2: Rename research entrypoint to `x-research`
- **Files**: `src/commands/research.ts`
- **Dependencies**: Task 1.1 (optional)
- **Action**:
  - Register `x-research [type] [topic]`
  - Keep `spool-research` as hidden deprecated wrapper
  - Update usage strings printed by the command to reference `spool x-research`
- **Verify**: `spool x-research --help`; `spool x-research` runs without errors
- **Done When**: `x-research` is discoverable and functional; `spool-research` still works but warns
- **Status**: [ ] pending

### Task 1.3: Rename ralph entrypoint to `x-ralph`
- **Files**: `src/commands/ralph.ts`
- **Dependencies**: None
- **Action**:
  - Register `x-ralph [prompt]` as the visible command
  - Provide hidden deprecated wrappers for `ralph` and `loop` (no visible alias in help output)
  - Preserve existing flags and behavior
- **Verify**: `spool --help` shows `x-ralph` (not `ralph|loop`); `spool x-ralph --help`
- **Done When**: `x-ralph` works; legacy names still work but warn
- **Status**: [ ] pending

---

## Wave 2: Shell Completion Alignment

### Task 2.1: Update completion registry for visible commands
- **Files**: `src/core/completions/command-registry.ts`
- **Dependencies**: Wave 1 complete
- **Action**:
  - Add missing visible commands (`module`, `split`, `skills`, `x-*` commands)
  - Update/remove outdated entries to match `spool --help`
  - Ensure hidden legacy wrappers are not listed
- **Verify**: `spool completion generate zsh > /tmp/spool.zsh` (and other shells as needed)
- **Done When**: completions include the new `x-*` commands and the overall surface matches help
- **Status**: [ ] pending

---

## Wave 3: Docs + QA Script Updates

### Task 3.1: Update QA scripts to use `x-ralph`
- **Files**: `qa/test-ralph-loop.sh` (or any equivalent)
- **Dependencies**: Task 1.3
- **Action**: replace `spool ralph` invocations with `spool x-ralph` (or rely on deprecated wrapper only temporarily)
- **Verify**: run the script locally
- **Done When**: QA script passes using `x-ralph`
- **Status**: [ ] pending

---

## Wave 4: Verification

### Task 4.1: Run lint/tests/build
- **Files**: (repo-wide)
- **Dependencies**: Waves 1-3 complete
- **Action**: run `make lint`, `make test`, `make build`
- **Verify**: commands succeed
- **Done When**: all checks pass
- **Status**: [ ] pending

### Task 4.2: Validate change artifacts
- **Files**: `.spool/changes/001-05_rationalize-cli-commands/**`
- **Dependencies**: Waves 1-4 complete
- **Action**: `spool validate "001-05_rationalize-cli-commands" --strict --no-interactive`
- **Verify**: validation succeeds (warnings acceptable)
- **Done When**: validation passes
- **Status**: [ ] pending
