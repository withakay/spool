## ADDED Requirements

### Requirement: Agent config can store testing policy defaults

The CLI SHALL support storing optional testing policy defaults in the agent config structure so other workflows (including instruction generation) can reference them.

#### Scenario: Defaults include testing policy keys

- **WHEN** generating a new `.spool/config.json` via `spool agent-config init`
- **THEN** the generated file includes default keys for a TDD workflow and coverage target percent

#### Scenario: Summary surfaces testing policy defaults

- **GIVEN** `.spool/config.json` contains testing policy defaults
- **WHEN** executing `spool agent-config summary`
- **THEN** the summary output includes those defaults in the defaults section
