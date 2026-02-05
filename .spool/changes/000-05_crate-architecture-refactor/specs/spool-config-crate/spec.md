## ADDED Requirements

### Requirement: spool-config crate exists as configuration layer

The `spool-config` crate SHALL exist and depend only on `spool-common` (no other `spool-*` dependencies). It SHALL provide configuration loading, resolution, and context management.

#### Scenario: Crate depends only on spool-common
- **WHEN** examining `spool-config/Cargo.toml`
- **THEN** the only `spool-*` dependency is `spool-common`

### Requirement: SpoolContext struct

The crate SHALL provide a `SpoolContext` struct that holds resolved configuration state including config directory, project root, spool path, and merged configuration values.

#### Scenario: Create context from project root
- **WHEN** calling `SpoolContext::resolve(fs, project_root)`
- **THEN** returns context with resolved paths and merged configuration

#### Scenario: Context includes all resolved paths
- **WHEN** examining a resolved `SpoolContext`
- **THEN** it contains `config_dir`, `project_root`, `spool_path`, and `config` fields

### Requirement: Cascading configuration loading

The crate SHALL load configuration from multiple sources (global, project, spool-dir) and merge them with appropriate precedence (spool-dir > project > global).

#### Scenario: Merge global and project config
- **WHEN** global config has `key=1` and project config has `key=2`
- **THEN** resolved config has `key=2` (project wins)

#### Scenario: Spool-dir config has highest precedence
- **WHEN** global has `key=1`, project has `key=2`, spool-dir has `key=3`
- **THEN** resolved config has `key=3` (spool-dir wins)

### Requirement: Spool directory resolution

The crate SHALL provide functions to resolve the spool directory name (`.spool` by default, configurable) and locate spool directories from a given path.

#### Scenario: Default spool directory name
- **WHEN** no configuration overrides the spool directory name
- **THEN** the spool directory name is `.spool`

#### Scenario: Find spool directory from nested path
- **WHEN** calling `find_spool_dir` from `/project/src/deep/nested`
- **THEN** returns `/project/.spool` if it exists

### Requirement: UI options resolution

The crate SHALL provide functions to resolve UI options (no_color, interactive mode) from environment and configuration.

#### Scenario: Respect NO_COLOR environment variable
- **WHEN** `NO_COLOR` environment variable is set
- **THEN** `UiOptions::no_color()` returns true

#### Scenario: Detect interactive mode
- **WHEN** stdout is a TTY
- **THEN** `UiOptions::interactive()` returns true
