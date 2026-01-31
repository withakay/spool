## Why

The current CLI help system has usability gaps that make it hard for users and agents to discover the full API:

1. **Opaque `[options]`**: Top-level help shows `spool init [options]` but doesn't reveal what those options are without running `spool init -h`
2. **Inconsistent subcommand help**: Commands like `spool agent instruction -h` may show parent help instead of subcommand help due to help flag routing issues
3. **No API discovery dump**: Users cannot get a complete view of all commands and options in one output, making CLI exploration tedious
4. **Manual help maintenance**: Each command has a hardcoded `*_HELP` constant that must be manually kept in sync with actual argument parsing

## What Changes

- Ensure `-h|--help` works consistently at every command/subcommand level
- Fix help flag routing so subcommands show their own help (not parent help)
- Add `spool help --all` or `spool --help-all` to dump complete CLI reference
- Improve top-level help to show key options inline or add hints
- Consider refactoring to derive help text from argument definitions (optional, lower priority)

## Capabilities

### New Capabilities

- `help-all-dump`: Add ability to output complete CLI help for all commands and subcommands in a single operation (`spool help --all` or `spool --help-all`), formatted for easy reading or piping.

### Modified Capabilities

- `subcommand-help-routing`: Fix help flag handling so that `-h|--help` at any command level shows help for that specific command/subcommand, not the parent.

- `top-level-help-hints`: Improve top-level help output to provide better hints about available options without requiring users to drill down into each command.

## Impact

- **CLI UX**: Users can walk the command tree with `-h` at any level
- **Agent discoverability**: Agents can dump full API reference for better command selection
- **Files affected**: `spool-rs/crates/spool-cli/src/main.rs` primarily
- **Breaking changes**: None - purely additive/fix behavior
