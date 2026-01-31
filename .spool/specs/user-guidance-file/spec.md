# User Guidance File Specification

## Purpose

Define the `user-guidance-file` capability, including required behavior and validation scenarios, so it remains stable and testable.


## Requirements

### Requirement: Project-local guidance file

Spool SHALL support a project-local Markdown file that users can edit to provide additional guidance for LLM-driven workflows.

#### Scenario: File created during init

- **WHEN** a user runs `spool init` in a project
- **THEN** Spool creates `.spool/user-guidance.md` if it does not exist
- **AND** the file explains how to add guidance

#### Scenario: User edits are preserved

- **GIVEN** `.spool/user-guidance.md` already exists and contains user-authored content
- **WHEN** a user runs `spool update`
- **THEN** Spool MUST NOT overwrite user-authored content

### Requirement: Managed header block

The guidance file SHALL contain a managed header block that Spool may update over time without impacting user-authored guidance.

#### Scenario: Managed block can be updated

- **GIVEN** `.spool/user-guidance.md` contains a `<!-- SPOOL:START -->` managed block
- **WHEN** Spool updates templates
- **THEN** only the managed block content is updated
- **AND** user-authored content outside the managed block is preserved
