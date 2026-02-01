## ADDED Requirements

### Requirement: Project setup instruction artifact

The CLI SHALL support a `project-setup` artifact in `spool agent instruction` that provides a wizard-style workflow to initialize project-specific dev commands.

#### Scenario: Project-setup artifact can be generated

- **WHEN** the user runs `spool agent instruction project-setup`
- **THEN** the command SHALL output the project setup workflow instructions
