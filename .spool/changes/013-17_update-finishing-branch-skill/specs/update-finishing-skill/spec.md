## Purpose

Update `finishing-a-development-branch` skill to reference correct skills and add spool-archive option.

## MODIFIED Requirements

### Requirement: References spool-apply-change-proposal

The skill SHALL reference `spool-apply-change-proposal` instead of `executing-plans`.

#### Scenario: Execution reference

- **WHEN** the skill references task execution
- **THEN** it references `spool-apply-change-proposal`

### Requirement: Includes spool-archive option

The skill SHALL include a fifth option for archiving spool changes.

#### Scenario: Archive option presented

- **WHEN** the skill presents completion options
- **THEN** it includes option 5: "Archive spool change"
- **AND** this option invokes `spool-archive` skill

### Requirement: Spool change detection

The skill SHALL detect if working on a spool change.

#### Scenario: Spool change present

- **WHEN** `.spool/changes/` contains an in-progress change
- **THEN** the archive option is highlighted as relevant

#### Scenario: No spool change

- **WHEN** not working on a spool change
- **THEN** the archive option is shown but noted as not applicable
