# experimental-workflow-commands Specification

## Purpose
TBD - created by archiving change 000-01_remove-opsx-colon-commands. Update Purpose after archive.
## Requirements
### Requirement: Experimental Workflow Slash Commands

The system SHALL expose the experimental workflow via hyphenated `/spool-*` slash commands and SHALL NOT use `/opsx:*`.

#### Scenario: Listing experimental workflow commands

- **WHEN** `spool artifact-experimental-setup` completes successfully
- **THEN** the output lists the experimental commands:
  - `/spool-explore`
  - `/spool-new-change`
  - `/spool-continue-change`
  - `/spool-apply-change`
  - `/spool-ff-change`
  - `/spool-sync-specs`
  - `/spool-archive-change`

### Requirement: Claude Command File Generation

The system SHALL generate Claude command wrapper files as flat files under `.claude/commands/` using the `spool-*.md` naming convention.

#### Scenario: Generating experimental workflow commands for Claude Code

- **WHEN** `spool artifact-experimental-setup` runs
- **THEN** it creates `.claude/commands/spool-explore.md`, `.claude/commands/spool-new-change.md`, `.claude/commands/spool-continue-change.md`, `.claude/commands/spool-apply-change.md`, `.claude/commands/spool-ff-change.md`, `.claude/commands/spool-sync-specs.md`, and `.claude/commands/spool-archive-change.md`

