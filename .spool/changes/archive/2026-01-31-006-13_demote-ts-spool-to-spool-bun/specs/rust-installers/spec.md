## ADDED Requirements

### Requirement: `spool-rs` is installed as `spool` by default

Installers MUST ensure the default `spool` command resolves to the Rust implementation.

If the legacy TypeScript/Bun implementation is installed for legacy purposes, it MUST use a distinct command/name and MUST be labeled deprecated.

#### Scenario: Default CLI resolves to Rust

- **WHEN** a user installs Spool using the documented installer path
- **THEN** running `spool --version` indicates the Rust implementation
- **AND** the installation does not place a TypeScript/Bun `spool` ahead of Rust on PATH

### Requirement: Legacy TypeScript `spool` is removed from global cache

Installers MUST remove or disable any cached legacy TypeScript `spool` that would shadow the Rust `spool` command.

#### Scenario: Cached legacy CLI does not shadow Rust

- **GIVEN** a machine with a cached legacy TypeScript `spool` in the global cache
- **WHEN** the Rust `spool` installation or upgrade is performed
- **THEN** `spool` resolves to the Rust implementation
- **AND** the legacy cache entry is removed or renamed so it cannot shadow `spool`

## REMOVED Requirements

### Requirement: Non-interactive installers match TypeScript byte-for-byte

This requirement is removed; installer verification MUST NOT require executing the TypeScript/Bun implementation.

#### Scenario: Rust installers do not depend on TypeScript

- **WHEN** a developer runs `spool init` in non-interactive mode
- **THEN** installer outputs MUST be validated using Rust-owned templates and/or Rust golden tests
- **AND** the validation process SHALL NOT execute TypeScript/Bun code

**Reason**: The TypeScript/Bun implementation is deprecated and is no longer the canonical source for installer outputs.
**Migration**: Treat Rust `spool init` outputs as canonical and validate outputs via templates and/or golden tests instead of comparing to the TypeScript implementation.
