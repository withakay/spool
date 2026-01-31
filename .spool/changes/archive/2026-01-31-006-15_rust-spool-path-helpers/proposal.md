## Why

Rust code across `spool-core`, `spool-workflow`, and `spool-cli` repeatedly constructs `.spool/` paths and scans directories using ad-hoc joins and string formatting. This causes:

- duplicated logic (changes/modules/specs paths constructed in multiple places)
- inconsistent handling of special directories (like `.spool/changes/archive`)
- harder refactors when `.spool/` layout or rules evolve

Centralizing path construction reduces repetition and prevents inconsistencies.

## What Changes

- Add a single `spool-core` path helper module (or struct) that provides canonical path construction for:
  - `.spool/` root
  - changes directory and per-change paths
  - modules directory
  - spec paths
- Refactor call sites in `spool-core` and `spool-cli` to use this helper rather than duplicating `.join("changes")`, `.join("modules")`, or `format!("{}/...", ...)`.

## Capabilities

### New Capabilities

- `rust-spool-path-helpers`

### Modified Capabilities

(none)

## Impact

- No user-facing behavior change expected.
- Makes future work safer: path rules live in one place.
