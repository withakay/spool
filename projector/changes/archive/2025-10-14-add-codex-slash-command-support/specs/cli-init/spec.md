## MODIFIED Requirements
### Requirement: AI Tool Configuration
The command SHALL configure AI coding assistants with Projector instructions using a marker system.
#### Scenario: Prompting for AI tool selection
- **WHEN** run interactively
- **THEN** prompt the user with "Which AI tools do you use?" using a multi-select menu
- **AND** list every available tool with a checkbox:
  - Claude Code (creates or refreshes CLAUDE.md and slash commands)
  - Cursor (creates or refreshes `.cursor/commands/*` slash commands)
  - OpenCode (creates or refreshes `.opencode/command/projector-*.md` slash commands)
  - Windsurf (creates or refreshes `.windsurf/workflows/projector-*.md` workflows)
  - Kilo Code (creates or refreshes `.kilocode/workflows/projector-*.md` workflows)
  - Codex (creates or refreshes global prompts at `~/.codex/prompts/projector-*.md`)
  - AGENTS.md standard (creates or refreshes AGENTS.md with Projector markers)
- **AND** show "(already configured)" beside tools whose managed files exist so users understand selections will refresh content
- **AND** treat disabled tools as "coming soon" and keep them unselectable
- **AND** allow confirming with Enter after selecting one or more tools

### Requirement: Slash Command Configuration
The init command SHALL generate slash command files for supported editors using shared templates.

#### Scenario: Generating slash commands for Claude Code
- **WHEN** the user selects Claude Code during initialization
- **THEN** create `.claude/commands/projector/proposal.md`, `.claude/commands/projector/apply.md`, and `.claude/commands/projector/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Cursor
- **WHEN** the user selects Cursor during initialization
- **THEN** create `.cursor/commands/projector-proposal.md`, `.cursor/commands/projector-apply.md`, and `.cursor/commands/projector-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for OpenCode
- **WHEN** the user selects OpenCode during initialization
- **THEN** create `.opencode/command/projector-proposal.md`, `.opencode/command/projector-apply.md`, and `.opencode/command/projector-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Windsurf
- **WHEN** the user selects Windsurf during initialization
- **THEN** create `.windsurf/workflows/projector-proposal.md`, `.windsurf/workflows/projector-apply.md`, and `.windsurf/workflows/projector-archive.md`
- **AND** populate each file from shared templates (wrapped in Projector markers) so workflow text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Kilo Code
- **WHEN** the user selects Kilo Code during initialization
- **THEN** create `.kilocode/workflows/projector-proposal.md`, `.kilocode/workflows/projector-apply.md`, and `.kilocode/workflows/projector-archive.md`
- **AND** populate each file from shared templates (wrapped in Projector markers) so workflow text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Codex
- **WHEN** the user selects Codex during initialization
- **THEN** create global prompt files at `~/.codex/prompts/projector-proposal.md`, `~/.codex/prompts/projector-apply.md`, and `~/.codex/prompts/projector-archive.md` (or under `$CODEX_HOME/prompts` if set)
- **AND** populate each file from shared templates that map the first numbered placeholder (`$1`) to the primary user input (e.g., change identifier or question text)
- **AND** wrap the generated content in Projector markers so `projector update` can refresh the prompts without touching surrounding custom notes
