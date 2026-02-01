# Tasks for: 005-08_migrate-cli-to-clap

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential (commands depend on infrastructure)
- **Template**: Enhanced task format with waves
- **Tracking**: Use `spool tasks` CLI for status updates

```bash
spool tasks status 005-08_migrate-cli-to-clap
spool tasks next 005-08_migrate-cli-to-clap
spool tasks start 005-08_migrate-cli-to-clap 1.1
spool tasks complete 005-08_migrate-cli-to-clap 1.1
```

______________________________________________________________________

## Wave 1: Setup and Infrastructure

- **Depends On**: None

### Task 1.1: Add clap dependencies to Cargo.toml

- **Files**: `spool-rs/crates/spool-cli/Cargo.toml`
- **Dependencies**: None
- **Action**:
  - Add `clap = { version = "4", features = ["derive", "env", "color"] }`
  - Add `clap_complete = "4"`
- **Verify**: `cargo build -p spool-cli`
- **Done When**: Project compiles with new dependencies
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 1.2: Add snapshot tests for current CLI output

- **Files**: `spool-rs/crates/spool-cli/tests/cli_snapshots.rs` (create)
- **Dependencies**: Task 1.1
- **Action**:
  - Create snapshot tests capturing current help output for all commands
  - Include: `spool --help`, `spool tasks --help`, `spool create --help`, etc.
  - Use `insta` crate for snapshot testing if available, or simple file comparison
- **Verify**: `cargo test -p spool-cli cli_snapshots`
- **Done When**: Baseline snapshots captured for regression testing
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 1.3: Create Cli struct with Commands enum

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs` (create)
- **Dependencies**: Task 1.1
- **Action**:
  - Create new `cli.rs` module with `#[derive(Parser)]` struct
  - Define `Commands` enum with all top-level commands as variants
  - Use placeholder `Args` structs for each command initially
  - Wire up to `mod.rs` but don't change existing dispatch yet
- **Verify**: `cargo build -p spool-cli`
- **Done When**: `Cli` struct compiles and can be parsed (not yet used)
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 2: Migrate Tasks Command (Pilot)

- **Depends On**: Wave 1

### Task 2.1: Define TasksArgs and TasksAction enum

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`
- **Dependencies**: None
- **Action**:
  - Create `TasksArgs` struct with `#[derive(Args)]`
  - Create `TasksAction` enum with `#[derive(Subcommand)]`
  - Include all subcommands: `Status`, `Next`, `Start`, `Complete`, `Shelve`, `Unshelve`, `Add`
  - Add doc comments for help text
- **Verify**: `cargo build -p spool-cli`
- **Done When**: Tasks subcommand structure defined with all variants
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 2.2: Add arguments to TasksAction variants

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`
- **Dependencies**: Task 2.1
- **Action**:
  - Add `change_id: String` to variants that need it
  - Add `task_id: String` to `Start`, `Complete`, `Shelve`, `Unshelve`
  - Add `--wave` flag to `Status` variant
  - Match existing command signatures
- **Verify**: `cargo build -p spool-cli`
- **Done When**: All tasks subcommand arguments defined
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 2.3: Create adapter to call existing handle_tasks

- **Files**: `spool-rs/crates/spool-cli/src/commands/tasks.rs`
- **Dependencies**: Task 2.2
- **Action**:
  - Create new entry point that takes clap-parsed `TasksArgs`
  - Convert to format expected by existing handler
  - Keep existing handler logic unchanged
- **Verify**: `cargo test -p spool-cli`
- **Done When**: Adapter compiles and can dispatch to existing handlers
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 2.4: Switch tasks dispatch to use clap

- **Files**: `spool-rs/crates/spool-cli/src/app/mod.rs`
- **Dependencies**: Task 2.3
- **Action**:
  - Update main dispatch to use clap for `tasks` command
  - Remove manual parsing for tasks
  - Keep other commands using old dispatch (temporary)
- **Verify**: `spool tasks --help` shows clap-generated help
- **Done When**: `spool tasks` uses clap parsing, other commands unchanged
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 2.5: Delete manual TASKS_HELP constant

- **Files**: `spool-rs/crates/spool-cli/src/app/help.rs`
- **Dependencies**: Task 2.4
- **Action**:
  - Remove `TASKS_HELP` constant
  - Remove any tasks-specific help strings
  - Verify help comes from doc comments
- **Verify**: `spool tasks --help` still works
- **Done When**: No manual help text for tasks command
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 3: Migrate Simple Commands

- **Depends On**: Wave 2

### Task 3.1: Migrate `list` command to clap

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`, `commands/list.rs`, `app/help.rs`
- **Dependencies**: None
- **Action**:
  - Define `ListArgs` with `--modules`, `--specs`, `--changes` flags
  - Create adapter to existing handler
  - Switch dispatch to clap
  - Delete `LIST_HELP` constant
- **Verify**: `spool list --help` shows clap help
- **Done When**: List command fully migrated
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 3.2: Migrate `show` command to clap

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`, `commands/show.rs`, `app/help.rs`
- **Dependencies**: None
- **Action**:
  - Define `ShowArgs` with `change_id` argument
  - Create adapter to existing handler
  - Switch dispatch to clap
  - Delete `SHOW_HELP` constant
- **Verify**: `spool show --help` shows clap help
- **Done When**: Show command fully migrated
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 3.3: Migrate `init` command to clap

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`, `commands/init.rs`, `app/help.rs`
- **Dependencies**: None
- **Action**:
  - Define `InitArgs` with `--home`, `--force` flags
  - Create adapter to existing handler
  - Switch dispatch to clap
  - Delete `INIT_HELP` constant
- **Verify**: `spool init --help` shows clap help
- **Done When**: Init command fully migrated
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 4: Migrate Remaining Commands

- **Depends On**: Wave 3

### Task 4.1: Migrate `create` command to clap

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`, `commands/create.rs`, `app/help.rs`
- **Dependencies**: None
- **Action**:
  - Define `CreateArgs` with `CreateAction` subcommand enum
  - Include `change`, `module`, `spec` subcommands
  - Create adapter to existing handler
  - Switch dispatch to clap
  - Delete `CREATE_HELP` constant
- **Verify**: `spool create --help` and `spool create change --help`
- **Done When**: Create command fully migrated
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 4.2: Migrate `agent` command to clap

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`, `commands/agent.rs`, `app/help.rs`
- **Dependencies**: None
- **Action**:
  - Define `AgentArgs` with `AgentAction` subcommand enum
  - Include `instruction` subcommand with its sub-subcommands
  - Create adapter to existing handler
  - Switch dispatch to clap
  - Delete `AGENT_HELP` constant
- **Verify**: `spool agent --help` and `spool agent instruction --help`
- **Done When**: Agent command fully migrated
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 4.3: Migrate `config` command to clap

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`, `commands/config.rs`, `app/help.rs`
- **Dependencies**: None
- **Action**:
  - Define `ConfigArgs` with appropriate flags
  - Create adapter to existing handler
  - Switch dispatch to clap
  - Delete any config-related help constants
- **Verify**: `spool config --help` shows clap help
- **Done When**: Config command fully migrated
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 5: Shell Completions and Cleanup

- **Depends On**: Wave 4

### Task 5.1: Add completions subcommand

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`, `commands/completions.rs` (create)
- **Dependencies**: None
- **Action**:
  - Add `Completions` variant to `Commands` enum
  - Create `completions.rs` module
  - Use `clap_complete::generate` to output completion scripts
  - Support bash, zsh, fish, powershell via `Shell` enum
- **Verify**: `spool completions bash` outputs valid script
- **Done When**: Shell completions work for all supported shells
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 5.2: Add styled help output

- **Files**: `spool-rs/crates/spool-cli/src/cli.rs`
- **Dependencies**: None
- **Action**:
  - Define `Styles` function for colored output
  - Apply to `#[command(styles = styles())]` attribute
  - Verify colors appear in terminal, respect NO_COLOR
- **Verify**: `spool --help` shows colored output
- **Done When**: Help text has consistent styling
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 5.3: Delete app/help.rs

- **Files**: `spool-rs/crates/spool-cli/src/app/help.rs`
- **Dependencies**: All previous tasks
- **Action**:
  - Verify no remaining references to help constants
  - Delete the entire `help.rs` file
  - Remove `mod help;` from `app/mod.rs`
- **Verify**: `cargo build -p spool-cli`
- **Done When**: No manual help text remains in codebase
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 5.4: Simplify app/mod.rs dispatch

- **Files**: `spool-rs/crates/spool-cli/src/app/mod.rs`
- **Dependencies**: Task 5.3
- **Action**:
  - Remove all manual argument parsing code
  - Simplify to just: parse Cli, match on command, dispatch
  - Delete unused utility functions
- **Verify**: `cargo build -p spool-cli`
- **Done When**: `app/mod.rs` is clean clap dispatch only
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Wave 6: Final Verification

- **Depends On**: Wave 5

### Task 6.1: Update snapshot tests

- **Files**: `spool-rs/crates/spool-cli/tests/cli_snapshots.rs`
- **Dependencies**: None
- **Action**:
  - Run snapshot tests, review any differences
  - Accept intentional formatting changes from clap
  - Ensure all commands still documented
- **Verify**: `cargo test -p spool-cli cli_snapshots`
- **Done When**: Snapshot tests pass with updated baselines
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 6.2: Run full test suite

- **Files**: All
- **Dependencies**: Task 6.1
- **Action**:
  - Run `cargo test --workspace`
  - Run `cargo clippy --workspace`
  - Ensure no regressions
- **Verify**: `cargo test --workspace && cargo clippy --workspace`
- **Done When**: All tests pass, no clippy warnings
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

### Task 6.3: Manual end-to-end verification

- **Files**: None (manual test)
- **Dependencies**: Task 6.2
- **Action**:
  - Test all commands with `--help` flag
  - Test commands with actual arguments
  - Test shell completions in bash/zsh
  - Verify error messages are helpful
- **Verify**: Manual verification
- **Done When**: All commands work as expected with improved UX
- **Updated At**: 2026-02-01
- **Status**: [ ] pending

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified
- `[-] shelved` - Intentionally not-to-be-done (reversible)
