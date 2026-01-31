# Tasks for: 001-10_comprehensive-cli-help-system

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Use the tasks CLI to drive status updates and pick work

```bash
spool tasks status 001-10_comprehensive-cli-help-system
spool tasks next 001-10_comprehensive-cli-help-system
spool tasks start 001-10_comprehensive-cli-help-system 1.1
spool tasks complete 001-10_comprehensive-cli-help-system 1.1
```

______________________________________________________________________

## Wave 1: Fix Subcommand Help Routing

- **Depends On**: None

### Task 1.1: Fix agent instruction help routing

- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: None
- **Action**:
  In `handle_agent()`, ensure that when `instruction` subcommand is detected, the help check happens on the subcommand args, not the parent args. The pattern:
  1. Extract subcommand args first
  2. Check for help flag in subcommand args
  3. Show `AGENT_INSTRUCTION_HELP` if found
  4. Otherwise proceed with handler
- **Verify**: `spool agent instruction -h` shows instruction-specific help with artifacts list
- **Done When**: `spool agent instruction -h` shows `AGENT_INSTRUCTION_HELP` content
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 1.2: Audit and fix all nested command help routing

- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: Task 1.1
- **Action**:
  Review all commands with subcommands and ensure help routing is correct:
  - `tasks` (init, status, next, start, complete, shelve, unshelve, add, show)
  - `plan` (init, status)
  - `state` (show, decision, blocker, note, focus, question)
  - `workflow` (init, list, show)
  - `config` (path, list, get, set, unset)
  - `create` (module, change)
  - `show` (module)
  - `validate` (module)
  Apply the same fix pattern as Task 1.1 where needed.
- **Verify**: Test `-h` on several subcommands: `spool tasks status -h`, `spool config get -h`
- **Done When**: All subcommands show their own help when `-h` is passed
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2: Add Help All Dump

- **Depends On**: Wave 1

### Task 2.1: Create help dump data structure

- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: None
- **Action**:
  Create a struct or vector that collects all help texts in order. This could be:
  ```rust
  struct CommandHelp {
      path: &'static str,  // e.g., "spool agent instruction"
      help: &'static str,  // the help constant
  }

  const ALL_HELP: &[CommandHelp] = &[
      CommandHelp { path: "spool", help: HELP },
      CommandHelp { path: "spool init", help: INIT_HELP },
      // ...
  ];
  ```
- **Verify**: The data structure compiles and contains all commands
- **Done When**: `ALL_HELP` constant defined with all command paths and help texts
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 2.2: Implement help --all command

- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: Task 2.1
- **Action**:
  Add handling for `spool help --all`:
  1. Check if first arg is "help" and second is "--all"
  2. Iterate through `ALL_HELP` and print each with separator
  3. Format with headers showing command path
- **Verify**: `spool help --all | head -100` shows formatted output
- **Done When**: `spool help --all` outputs complete CLI reference
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 2.3: Add --help-all global flag

- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: Task 2.2
- **Action**:
  Add handling for `spool --help-all` as an alias:
  1. Check if first arg is "--help-all"
  2. Call the same function as `help --all`
- **Verify**: `spool --help-all | head -100` shows same output as `spool help --all`
- **Done When**: Both forms work identically
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 2.4: Add JSON output for help dump

- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: Task 2.2
- **Action**:
  Add `--json` flag support to `help --all`:
  1. Parse help constants to extract structure (or maintain a separate structured version)
  2. Output as JSON with commands, options, subcommands
  3. Consider using serde for serialization
- **Verify**: `spool help --all --json | jq '.commands[0].name'` returns valid JSON
- **Done When**: JSON output includes all commands with their options
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3: Improve Help Text

- **Depends On**: Wave 2

### Task 3.1: Add navigation footer to help constants

- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: None
- **Action**:
  Update each `*_HELP` constant to include appropriate footer:
  - For commands with subcommands: `\n\nRun 'spool <cmd> <subcmd> -h' for subcommand options.`
  - For leaf commands: `\n\nRun 'spool -h' to see all commands.`
  - For top-level: `\n\nRun 'spool <command> -h' for command options, or 'spool help --all' for complete reference.`
- **Verify**: `spool -h` shows footer hint
- **Done When**: All help outputs include navigation hints
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 3.2: Update top-level HELP with better option hints

- **Files**: `spool-rs/crates/spool-cli/src/main.rs`
- **Dependencies**: None
- **Action**:
  Update the main `HELP` constant to show key options inline for common commands. For example:
  ```
  list [--json|--specs|--modules]   List items (changes by default)
  init [--tools <...>] [path]       Initialize Spool in your project
  ```
  Focus on the most commonly used 5-6 commands.
- **Verify**: `spool -h` shows option hints for key commands
- **Done When**: Top-level help shows inline option hints
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

______________________________________________________________________

## Wave 4: Testing & Validation

- **Depends On**: Wave 3

### Task 4.1: Add tests for help system

- **Files**: `spool-rs/crates/spool-cli/tests/` or integration tests
- **Dependencies**: None
- **Action**:
  Add tests that verify:
  1. `spool agent instruction -h` shows instruction help (not agent help)
  2. `spool help --all` outputs non-empty content
  3. `spool --help-all` outputs same as `spool help --all`
  4. `spool help --all --json` outputs valid JSON
- **Verify**: `cargo test -p spool-cli`
- **Done When**: All new tests pass
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

### Task 4.2: Manual validation of help walkthrough

- **Files**: None (manual testing)
- **Dependencies**: Task 4.1
- **Action**:
  Walk through the entire command tree with `-h`:
  1. Start at `spool -h`
  2. For each command, run `spool <cmd> -h`
  3. For each subcommand, run `spool <cmd> <subcmd> -h`
  4. Verify all show appropriate help with footers
  5. Test `spool help --all` outputs complete reference
- **Verify**: Manual verification
- **Done When**: All commands show correct help at every level
- **Updated At**: 2026-01-31
- **Status**: [ ] pending

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified
- `[-] shelved` - Intentionally not-to-be-done (reversible)
