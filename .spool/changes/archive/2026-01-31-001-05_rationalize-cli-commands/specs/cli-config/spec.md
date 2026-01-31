## ADDED Requirements

### Requirement: Config operations are grouped

The CLI SHALL expose configuration operations under the `spool config` group.

#### Scenario: List config

- **WHEN** user executes `spool config list`
- **THEN** the system lists the configuration values

#### Scenario: Get config value

- **WHEN** user executes `spool config get <key>`
- **THEN** the output is the config value

#### Scenario: Set config value

- **WHEN** user executes `spool config set <key> <value>`
- **THEN** the config value is updated

#### Scenario: Unset config value

- **WHEN** user executes `spool config unset <key>`
- **THEN** the config value is removed

#### Scenario: Reset config

- **WHEN** user executes `spool config reset --all`
- **THEN** all config values are reset

#### Scenario: Edit config

- **WHEN** user executes `spool config edit`
- **THEN** the config file is opened in an editor

#### Scenario: Show config paths

- **WHEN** user executes `spool config paths`
- **THEN** the system prints relevant config file locations

#### Scenario: Deprecated config verbs remain callable

- **WHEN** user executes any legacy config verb shim:
  - `spool get|set|unset|reset|edit|path ...`
- **THEN** the command executes successfully
- **AND** prints a deprecation warning pointing to the equivalent `spool config ...` command
- **AND** the shim is hidden from help and omitted from shell completions
