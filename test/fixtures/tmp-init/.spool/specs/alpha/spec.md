## Purpose
This is a minimal spec fixture for CLI e2e tests.

## Requirements

### Requirement: Alpha spec SHALL validate
Alpha spec SHALL contain at least one scenario.

#### Scenario: Valid alpha spec
- **GIVEN** a minimal spec
- **WHEN** spool validate runs
- **THEN** it reports the spec as valid
