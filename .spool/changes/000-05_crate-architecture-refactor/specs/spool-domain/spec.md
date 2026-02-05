## MODIFIED Requirements

### Requirement: spool-domain crate dependencies

The `spool-domain` crate SHALL depend on `spool-common` and `spool-schemas` only. It SHALL NOT depend on `spool-core`, `spool-config`, or CLI crates.

#### Scenario: Crate depends on spool-common and spool-schemas
- **WHEN** examining `spool-domain/Cargo.toml`
- **THEN** the only `spool-*` dependencies are `spool-common` and `spool-schemas`

## ADDED Requirements

### Requirement: Discovery module in spool-domain

The `spool-domain` crate SHALL provide a `discovery` module for listing spool artifacts (changes, modules, specs) from the filesystem.

#### Scenario: List changes in spool directory
- **WHEN** calling `discovery::list_changes(fs, spool_path)`
- **THEN** returns list of change IDs found in `{spool_path}/changes/`

#### Scenario: List modules in spool directory
- **WHEN** calling `discovery::list_modules(fs, spool_path)`
- **THEN** returns list of module IDs found in `{spool_path}/modules/`

#### Scenario: List specs in spool directory
- **WHEN** calling `discovery::list_specs(fs, spool_path)`
- **THEN** returns list of spec names found in `{spool_path}/specs/`

#### Scenario: Discovery uses FileSystem trait
- **WHEN** discovery functions are called
- **THEN** they accept a generic `F: FileSystem` parameter for testability
