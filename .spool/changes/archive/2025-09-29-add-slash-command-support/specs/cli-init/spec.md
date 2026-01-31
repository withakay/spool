## ADDED Requirements

### Requirement: Slash Command Configuration

The init command SHALL generate slash command files for supported editors using shared templates.

#### Scenario: Generating slash commands for Claude Code

- **WHEN** the user selects Claude Code during initialization
- **THEN** create `.claude/commands/spool/proposal.md`, `.claude/commands/spool/apply.md`, and `.claude/commands/spool/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for Cursor

- **WHEN** the user selects Cursor during initialization
- **THEN** create `.cursor/commands/spool-proposal.md`, `.cursor/commands/spool-apply.md`, and `.cursor/commands/spool-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for OpenCode

- **WHEN** the user selects OpenCode during initialization
- **THEN** create `.opencode/commands/spool-proposal.md`, `.opencode/commands/spool-apply.md`, and `.opencode/commands/spool-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Spool workflow stage
