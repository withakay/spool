## Why

`spool list`, `spool show`, and `spool validate` are core, mostly-non-mutating commands that exercise ID parsing, specs loading, change/module discovery, and JSON output shapes. Porting them early provides high confidence and unlocks parity tests across multiple fixture repositories.

## What Changes

- Implement Rust versions of:
  - `spool list` (including `--modules`, filtering, `--json`)
  - `spool show` (rendering change/module/spec details; `--json`)
  - `spool validate` (including `--strict`, warning behavior, `--json`)
- Add parity tests vs TypeScript across fixture repos.

## Capabilities

### New Capabilities
- `rust-view-and-validate`: Rust implementations of list/show/validate with identical CLI behavior.

### Modified Capabilities
<!-- None. New Rust implementation. -->

## Impact

**Affected areas:**
- `spool-rs/crates/spool-cli/`, `spool-rs/crates/spool-core/`

**Behavioral impact:**
- None until Rust becomes default

**Risks:**
- JSON shape drift; mitigated by snapshot-based parity tests.
