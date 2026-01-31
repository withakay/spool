## MODIFIED Requirements

### Requirement: Slash Command Updates

The update command SHALL refresh existing slash command files for configured tools without creating new ones.

#### Scenario: Updating slash commands for Claude Code

- **WHEN** `.claude/commands/spool/` contains `proposal.md`, `apply.md`, and `archive.md`
- **THEN** refresh each file using shared templates
- **AND** ensure templates include instructions for the relevant workflow stage

#### Scenario: Updating slash commands for Cursor

- **WHEN** `.cursor/commands/` contains `spool-proposal.md`, `spool-apply.md`, and `spool-archive.md`
- **THEN** refresh each file using shared templates
- **AND** ensure templates include instructions for the relevant workflow stage

#### Scenario: Updating slash commands for OpenCode

- **WHEN** `.opencode/command/` contains `spool-proposal.md`, `spool-apply.md`, and `spool-archive.md`
- **THEN** refresh each file using shared templates
- **AND** ensure templates include instructions for the relevant workflow stage

#### Scenario: Updating slash commands for Windsurf

- **WHEN** `.windsurf/workflows/` contains `spool-proposal.md`, `spool-apply.md`, and `spool-archive.md`
- **THEN** refresh each file using shared templates wrapped in Spool markers
- **AND** ensure templates include instructions for the relevant workflow stage
- **AND** skip creating missing files (the update command only refreshes what already exists)

#### Scenario: Updating slash commands for Kilo Code

- **WHEN** `.kilocode/workflows/` contains `spool-proposal.md`, `spool-apply.md`, and `spool-archive.md`
- **THEN** refresh each file using shared templates wrapped in Spool markers
- **AND** ensure templates include instructions for the relevant workflow stage
- **AND** skip creating missing files (the update command only refreshes what already exists)

#### Scenario: Updating slash commands for Codex

- **GIVEN** the global Codex prompt directory contains `spool-proposal.md`, `spool-apply.md`, and `spool-archive.md`
- **WHEN** a user runs `spool update`
- **THEN** refresh each file using the shared slash-command templates (including placeholder guidance)
- **AND** preserve any unmanaged content outside the Spool marker block
- **AND** skip creation when a Codex prompt file is missing

#### Scenario: Updating slash commands for GitHub Copilot

- **WHEN** `.github/prompts/` contains `spool-proposal.prompt.md`, `spool-apply.prompt.md`, and `spool-archive.prompt.md`
- **THEN** refresh each file using shared templates while preserving the YAML frontmatter
- **AND** update only the Spool-managed block between markers
- **AND** ensure templates include instructions for the relevant workflow stage

#### Scenario: Missing slash command file

- **WHEN** a tool lacks a slash command file
- **THEN** do not create a new file during update
