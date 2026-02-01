## ADDED Requirements

### Requirement: Init hints about project setup when incomplete

`spool init` SHALL print a hint to run project setup when `.spool/project.md` indicates project setup is incomplete.

#### Scenario: Init prints hint when marker is present

- **WHEN** `spool init` completes
- **AND** `.spool/project.md` contains `<!-- SPOOL:PROJECT_SETUP:INCOMPLETE -->`
- **THEN** the CLI prints a hint describing how to run project setup via `spool agent instruction project-setup`

#### Scenario: Init does not print hint when marker is absent

- **WHEN** `spool init` completes
- **AND** `.spool/project.md` does not contain the incomplete marker
- **THEN** the CLI does not print the project setup hint
