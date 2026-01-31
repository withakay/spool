## MODIFIED Requirements

### Requirement: Transition plan preserves `spool` command name

The transition plan MUST keep the user-facing `spool` command stable and MUST define `spool-rs` as the supported implementation for the `spool` command.

The legacy TypeScript/Bun implementation MUST be treated as deprecated and MUST NOT be installed or distributed in a way that claims the `spool` command by default.

#### Scenario: npm-installed `spool` continues to work (Rust default)

- **GIVEN** a user who previously installed `@withakay/spool`
- **WHEN** they upgrade to a version where `spool` resolves to the Rust implementation
- **THEN** `spool --help` and `spool --version` behave identically at the CLI-contract level
- **AND** the output clearly identifies `spool-rs` as the supported implementation

### Requirement: Platform artifacts and verification are defined

The plan MUST define build artifacts per platform and how they are verified, and it MUST distinguish supported `spool-rs` artifacts from any deprecated TypeScript/Bun artifacts.

#### Scenario: Release checklist is explicit

- **GIVEN** the packaging documentation
- **WHEN** a release engineer follows the checklist
- **THEN** it includes commands to build `spool-rs` artifacts for supported platforms
- **AND** it includes checksum/integrity verification
- **AND** it documents any legacy TypeScript/Bun artifacts as deprecated and non-default (if shipped)
