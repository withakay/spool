# Tasks for: 001-12_project-setup-wizard

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Prefer the tasks CLI to drive status updates and pick work

```bash
spool tasks status 001-12_project-setup-wizard
spool tasks next 001-12_project-setup-wizard
spool tasks start 001-12_project-setup-wizard 1.1
spool tasks complete 001-12_project-setup-wizard 1.1
spool tasks show 001-12_project-setup-wizard
```

______________________________________________________________________

## Wave 1

- **Depends On**: None

### Task 1.1: Add new instruction artifact template (project-setup)

- **Files**:
  - `spool-rs/crates/spool-schemas/schemas/spec-driven/` (artifact graph + template)
  - `spool-rs/crates/spool-schemas/schemas/spec-driven/templates/project-setup.md` (new)
- **Dependencies**: None
- **Action**:
  - Define a new instruction artifact `project-setup` in the spec-driven schema.
  - Add a template that guides the agent through:
    - Stack detection (Cargo/package.json/pyproject/go.mod)
    - A short interview for runtime/package manager/version manager
    - Generating a Makefile (help/build/test/lint) without overwriting existing files
    - Generating a Windows alternative when appropriate
    - Updating `.spool/project.md` marker from INCOMPLETE -> COMPLETE
- **Verify**: `make test`
- **Done When**: `spool agent instruction project-setup` renders and includes an output path.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 1.2: Add harness command /spool-project-setup (all harnesses)

- **Files**:
  - `spool-rs/crates/spool-templates/assets/default/project/.opencode/commands/spool-project-setup.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.claude/commands/spool/project-setup.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.codex/prompts/spool-project-setup.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.github/prompts/spool-project-setup.prompt.md`
- **Dependencies**: Task 1.1
- **Action**:
  - Add a command prompt that delegates workflow content to:
    - `spool agent instruction project-setup`
  - Ensure wording is consistent across harnesses and matches existing Spool command style.
- **Verify**: `make test`
- **Done When**: `spool init` installs `/spool-project-setup` command for each harness.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 1.3: Update `spool init` to hint when setup is incomplete

- **Files**: `spool-rs/` (`spool-cli` init command + project.md installer)
- **Dependencies**: Task 1.1
- **Action**:
  - After init, read `.spool/project.md` (respecting configured spoolDir).
  - If it contains `<!-- SPOOL:PROJECT_SETUP:INCOMPLETE -->`, print a hint:
    - “Run `/spool-project-setup` (or `spool agent instruction project-setup`) to generate your Makefile/dev commands.”
  - Keep behavior non-fatal and non-interactive.
- **Verify**: `make test`
- **Done When**: an integration test asserts the hint is printed only when marker is present.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2

- **Depends On**: Wave 1

### Task 2.1: Update docs/bootstrap listings to include project-setup

- **Files**:
  - `spool-rs/crates/spool-templates/assets/default/project/AGENTS.md`
  - `spool-rs/crates/spool-templates/assets/default/project/CLAUDE.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.codex/instructions/*` (if needed)
- **Dependencies**: Task 1.2
- **Action**:
  - Mention `/spool-project-setup` and `spool agent instruction project-setup`.
  - Briefly describe what outputs it produces (Makefile/PowerShell script + project marker).
- **Verify**: `make test`
- **Done When**: docs in installed templates reference the new setup flow.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3 (Checkpoint)

- **Depends On**: Wave 2

### Task 3.1: Human review of default interview + generated Makefile shape

- **Type**: checkpoint (requires human approval before proceeding)
- **Files**:
  - `spool-rs/crates/spool-schemas/schemas/spec-driven/templates/project-setup.md`
- **Dependencies**: Task 2.1
- **Action**: Validate that the interview is short, the Makefile targets match expectations, and Windows guidance is reasonable.
- **Done When**: reviewer approves the template content.
- **Updated At**: 2026-02-01
- **Status**: [ ] pending
