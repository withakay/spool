## Why

When managing multiple changes, users need to quickly identify work that has been started but not finished. Currently `spool list` shows all changes with task counts, but filtering requires manual inspection. Adding `--partial` and `--pending` flags complements the existing `--completed` flag, giving users a complete set of progress-based filters.

## What Changes

- Add `--partial` flag to `spool list` to filter changes where some (but not all) tasks are complete (1 to N-1 of N tasks done)
- Add `--pending` flag to `spool list` to filter changes where no tasks have been started (0 of N tasks done)
- These flags are mutually exclusive with `--completed` and each other

## Capabilities

### New Capabilities

- `list-partial-filter`: Filter `spool list` output to show only changes with partial task completion (started but not finished)
- `list-pending-filter`: Filter `spool list` output to show only changes with no task progress (not yet started)

### Modified Capabilities

<!-- No existing spec-level behavior changes required -->

## Impact

- **Code**: `spool-rs/crates/spool-cli/src/commands/list.rs` - add new CLI flags and filtering logic
- **Domain**: May need to expose task progress status from `spool-domain` change repository
- **Tests**: Add unit tests for new filter combinations
- **Docs**: Update CLI help text (automatic via clap)
