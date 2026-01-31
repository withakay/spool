# Proposal

## Why

- Provide a consistent location and loader for persisted tasks.

## What Changes

- Add storage path helper targeting `temp/demo-5/.data/tasks.txt`.
- Implement `load_tasks` to read tasks from disk.

## Impact

- Adds `src/storage.rs` and updates `src/lib.rs`.
