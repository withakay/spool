## MODIFIED Requirements

### Requirement: spool-core contains business logic only

The `spool-core` crate SHALL contain only business logic (workflow, archive, validate, installers, create, list, show, ralph). Configuration, utilities, and discovery SHALL be extracted to other crates.

#### Scenario: Core does not export config modules
- **WHEN** examining `spool-core` public API
- **THEN** there are no `config`, `spool_dir`, or `output` modules

#### Scenario: Core does not export utility modules
- **WHEN** examining `spool-core` public API
- **THEN** there are no `io`, `paths`, `id`, or `match_` modules

#### Scenario: Core does not export discovery
- **WHEN** examining `spool-core` public API
- **THEN** there is no `discovery` module

### Requirement: spool-core dependencies

The `spool-core` crate SHALL depend on `spool-config`, `spool-domain`, `spool-common`, `spool-templates`, and `spool-harness`. It SHALL NOT depend on CLI crates.

#### Scenario: Core depends on config and domain
- **WHEN** examining `spool-core/Cargo.toml`
- **THEN** dependencies include `spool-config` and `spool-domain`

#### Scenario: Core does not depend on CLI
- **WHEN** examining `spool-core/Cargo.toml`
- **THEN** there is no dependency on `spool-cli`

## ADDED Requirements

### Requirement: Marker-based file updates inlined from spool-fs

The `spool-core` crate SHALL provide marker-based file update functionality (previously in `spool-fs`) for installer operations.

#### Scenario: Update file between markers
- **WHEN** calling marker update function with content and markers
- **THEN** content between markers is replaced, preserving content outside markers

#### Scenario: spool-fs crate removed
- **WHEN** examining workspace members
- **THEN** `spool-fs` is not listed (functionality inlined into core)
