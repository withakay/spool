## Why

After foundations and the view/validate commands, the next layer is the artifact workflow: creating modules/changes and generating instructions/templates. These commands are central to the Spool user workflow and are required to manage the Rust port itself over time.

## What Changes

- Port commands:
  - `spool status`
  - `spool instructions` / `spool agent instruction` equivalents
  - `spool templates`
  - `spool create module`
  - `spool create change`
- Preserve legacy aliases and deprecation warnings where applicable.
- Add parity tests for outputs and filesystem writes.

## Capabilities

### New Capabilities
- `rust-artifact-workflow`: Rust implementations of artifact workflow commands.

### Modified Capabilities
<!-- None. New Rust implementation. -->

## Impact

**Affected areas:**
- `spool-rs/crates/spool-cli/`, `spool-rs/crates/spool-core/`, `spool-rs/crates/spool-templates/`

**Behavioral impact:**
- None until Rust becomes default

**Risks:**
- Instruction content drift; mitigated by snapshot + file-write parity tests.
