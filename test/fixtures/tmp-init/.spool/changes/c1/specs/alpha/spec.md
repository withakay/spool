## ADDED Requirements

### Requirement: CLI validate SHALL include c1
The CLI validate command SHALL include this change in --all output.

#### Scenario: Validate fixture change
- **GIVEN** the tmp-init fixture
- **WHEN** spool validate --all --json runs
- **THEN** the output includes change c1
