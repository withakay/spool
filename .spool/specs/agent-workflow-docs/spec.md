# agent-workflow-docs Specification

## Purpose
TBD - created by archiving change 000-02_consolidate-workflow-docs. Update Purpose after archive.
## Requirements
### Requirement: Agent Workflow Documentation
The project SHALL provide comprehensive documentation of the actual implemented Spool workflow as used by AI coding agents in `docs/agent-workflow.md`.

#### Scenario: Document the actions-on-a-change model
- **WHEN** a user reads the agent workflow documentation
- **THEN** they SHALL understand the five core actions: proposal, research, apply, review, and archive
- **AND** they SHALL understand when to use each action

#### Scenario: Document slash commands
- **WHEN** a user reads the agent workflow documentation
- **THEN** they SHALL find documentation for each slash command (`/spool-proposal`, `/spool-apply`, `/spool-research`, `/spool-review`, `/spool-archive`)
- **AND** they SHALL understand the purpose and usage of each command

#### Scenario: Provide practical examples
- **WHEN** a user reads the agent workflow documentation
- **THEN** they SHALL find end-to-end examples showing the complete workflow from proposal creation to archiving

