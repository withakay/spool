## MODIFIED Requirements
### Requirement: Slash Command Updates
The update command SHALL refresh existing slash command files for configured tools without creating new ones.

#### Scenario: Updating slash commands for Claude Code
- **WHEN** `.claude/commands/projector/` contains `proposal.md`, `apply.md`, and `archive.md`
- **THEN** refresh each file using shared templates
- **AND** ensure templates include instructions for the relevant workflow stage

#### Scenario: Updating slash commands for Cursor
- **WHEN** `.cursor/commands/` contains `projector-proposal.md`, `projector-apply.md`, and `projector-archive.md`
- **THEN** refresh each file using shared templates
- **AND** ensure templates include instructions for the relevant workflow stage

#### Scenario: Updating slash commands for OpenCode
- **WHEN** `.opencode/command/` contains `projector-proposal.md`, `projector-apply.md`, and `projector-archive.md`
- **THEN** refresh each file using shared templates
- **AND** ensure templates include instructions for the relevant workflow stage

#### Scenario: Updating slash commands for Kilo Code
- **WHEN** `.kilocode/workflows/` contains `projector-proposal.md`, `projector-apply.md`, and `projector-archive.md`
- **THEN** refresh each file using shared templates wrapped in Projector markers
- **AND** ensure templates include instructions for the relevant workflow stage

#### Scenario: Missing slash command file
- **WHEN** a tool lacks a slash command file
- **THEN** do not create a new file during update
