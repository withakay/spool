## Why

Spool's planning and workflow commands (`plan`, `tasks`, `workflow`, `state`) define how changes are executed and tracked. They are also used by automated loops (including Ralph) and must be compatible with existing on-disk formats (YAML/JSON) to avoid breaking user workflows.

## What Changes

- Port commands:
  - `spool plan`
  - `spool tasks`
  - `spool workflow`
  - `spool state`
- Preserve YAML/state compatibility with existing TS outputs and on-disk formats.
- Add parity tests that validate both output and on-disk state.

## Capabilities

### New Capabilities

- `rust-planning-and-state`: Rust implementations of plan/tasks/workflow/state.

### Modified Capabilities

<!-- None. New Rust implementation. -->

## Impact

**Affected areas:**

- `spool-rs/crates/spool-workflow/`, `spool-rs/crates/spool-cli/`

**Behavioral impact:**

- None until Rust becomes default

**Risks:**

- Format incompatibilities; mitigated by golden fixtures and parity tests.
