## Why

`spool init` and `spool update` are the highest-risk commands for behavioral drift: they write files, manage marker blocks, and install prompts/skills/workflows across different harnesses (OpenCode, Claude Code, Codex, Copilot, etc.). For parity, generated files must match TypeScript output byte-for-byte in non-interactive mode and preserve unmanaged user edits.

## What Changes

- Port `spool init` and `spool update` to Rust.
- Implement marker-managed file editing (replace only managed blocks).
- Implement prompt/skill/workflow installers with correct path conventions (singular dirs for OpenCode).
- Add filesystem parity tests that compare directory trees and file bytes.

## Capabilities

### New Capabilities

- `rust-installers`: Rust implementation of init/update installers with byte-for-byte parity.

### Modified Capabilities

<!-- None. New Rust implementation. -->

## Impact

**Affected areas:**

- `spool-rs/crates/spool-fs/`, `spool-rs/crates/spool-templates/`, `spool-rs/crates/spool-cli/`

**Behavioral impact:**

- None until Rust becomes default

**Risks:**

- Drift in templates or marker logic; mitigated by tree-diff tests and snapshot parity.
