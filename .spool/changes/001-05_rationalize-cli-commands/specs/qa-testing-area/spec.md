## MODIFIED Requirements

### Requirement: Spool Ralph integration test

The system SHALL provide an integration test script that simulates real-world usage of Spool Ralph.

#### Scenario: Test script creates demo environment
- **WHEN** executing `qa/test-ralph-loop.sh`
- **THEN** the script creates a temporary demo directory with a random name
- **AND** initializes a spool project in that directory
- **AND** creates a simple change proposal
- **AND** runs `spool x-ralph` against that change
- **AND** verifies the output produces expected results
- **AND** cleans up the temporary directory

#### Scenario: Test script verifies hello world output
- **GIVEN** a change proposal that creates a bash script outputting "hello world"
- **WHEN** the test script runs `spool x-ralph` with that change
- **THEN** the test verifies that a shell script is created
- **AND** the test verifies the script contains "hello world"
