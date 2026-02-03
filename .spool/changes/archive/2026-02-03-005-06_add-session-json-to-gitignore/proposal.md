## Why

`spool` can create and update local session state at `.spool/session.json`, which is useful during development but should not be committed. Without a default ignore rule, this file shows up as untracked noise and can be accidentally included in commits.

## What Changes

- `spool init` updates the repository root `.gitignore` to ignore `.spool/session.json` (creating `.gitignore` if it does not exist).
- The update is idempotent and preserves any existing `.gitignore` content.

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `cli-init`: Ensure `spool init` adds an ignore rule for `.spool/session.json`.

## Impact

- Affects init-time file generation behavior (writes/updates `.gitignore` in the repo root).
- Requires Rust implementation changes in the init/install path and tests to ensure idempotent behavior.
