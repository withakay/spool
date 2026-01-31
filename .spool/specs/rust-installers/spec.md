# rust-installers Specification

## Purpose

TBD - created by archiving change 006-06_port-init-update-installers. Update Purpose after archive.

## Requirements

### Requirement: Marker-managed edits preserve unmanaged content

The Rust implementation MUST only replace managed blocks and MUST preserve user-owned content outside markers.

#### Scenario: Update preserves user edits

- GIVEN a file containing a managed marker block and user edits outside the block
- WHEN `spool update` is run
- THEN only the managed block content is replaced
- AND user edits outside the block remain unchanged

### Requirement: Installer outputs are deterministic and validated in Rust

Installer outputs MUST be deterministic under non-interactive flags and MUST be validated by Rust test coverage.

#### Scenario: Rust tests validate installers

- WHEN running `cargo test --workspace`
- THEN installer-related tests MUST validate the expected file outputs

### Requirement: Path conventions match existing behavior

Installer outputs MUST use the correct path conventions.

#### Scenario: OpenCode singular directories

- GIVEN OpenCode installation selected
- WHEN `spool init` installs skills/commands/plugins
- THEN it writes under `.opencode/skill/`, `.opencode/command/`, and `.opencode/plugin/`
