# Proposal

## Why

- Persist task updates so CLI actions survive between runs.

## What Changes

- Add `save_tasks` to write tasks to disk using the core line format.
- Use a temp file and rename for atomic writes.

## Impact

- Updates `src/storage.rs`.
