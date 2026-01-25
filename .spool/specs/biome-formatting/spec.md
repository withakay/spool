# biome-formatting Specification

## Purpose
TBD - created by archiving change 005-02_migrate-eslint-to-biome. Update Purpose after archive.
## Requirements
### Requirement: Formatting command exists

The project SHALL provide a formatting command implemented via Biome that updates files in-place.

#### Scenario: Developer formats the repo

- **WHEN** a developer runs `bun run format`
- **THEN** the project SHALL format supported source files using Biome
- **AND** the command SHALL update files in-place

### Requirement: Formatting can be checked in CI

The project SHALL provide a non-mutating formatting check command implemented via Biome that fails when formatting differences are detected.

#### Scenario: CI checks formatting

- **WHEN** CI runs the formatting check command
- **THEN** the command SHALL exit non-zero if formatting changes would be produced

