## MODIFIED Requirements

### Requirement: Slash Command Configuration

The init command SHALL generate slash command files for supported editors using shared templates.

#### Scenario: Generating slash commands for Antigravity
- **WHEN** the user selects Antigravity during initialization
- **THEN** create `.agent/workflows/projector-proposal.md`, `.agent/workflows/projector-apply.md`, and `.agent/workflows/projector-archive.md`
- **AND** ensure each file begins with YAML frontmatter that contains only a `description: <stage summary>` field followed by the shared Projector workflow instructions wrapped in managed markers
- **AND** populate the workflow body with the same proposal/apply/archive guidance used for other tools so Antigravity behaves like Windsurf while pointing to the `.agent/workflows/` directory

#### Scenario: Generating slash commands for Claude Code
- **WHEN** the user selects Claude Code during initialization
- **THEN** create `.claude/commands/projector/proposal.md`, `.claude/commands/projector/apply.md`, and `.claude/commands/projector/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for CodeBuddy Code
- **WHEN** the user selects CodeBuddy Code during initialization
- **THEN** create `.codebuddy/commands/projector/proposal.md`, `.codebuddy/commands/projector/apply.md`, and `.codebuddy/commands/projector/archive.md`
- **AND** populate each file from shared templates that include CodeBuddy-compatible YAML frontmatter for the `description` and `argument-hint` fields
- **AND** use square bracket format for `argument-hint` parameters (e.g., `[change-id]`)
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Cline
- **WHEN** the user selects Cline during initialization
- **THEN** create `.clinerules/workflows/projector-proposal.md`, `.clinerules/workflows/projector-apply.md`, and `.clinerules/workflows/projector-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** include Cline-specific Markdown heading frontmatter
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Crush
- **WHEN** the user selects Crush during initialization
- **THEN** create `.crush/commands/projector/proposal.md`, `.crush/commands/projector/apply.md`, and `.crush/commands/projector/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** include Crush-specific frontmatter with Projector category and tags
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Cursor
- **WHEN** the user selects Cursor during initialization
- **THEN** create `.cursor/commands/projector-proposal.md`, `.cursor/commands/projector-apply.md`, and `.cursor/commands/projector-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Factory Droid
- **WHEN** the user selects Factory Droid during initialization
- **THEN** create `.factory/commands/projector-proposal.md`, `.factory/commands/projector-apply.md`, and `.factory/commands/projector-archive.md`
- **AND** populate each file from shared templates that include Factory-compatible YAML frontmatter for the `description` and `argument-hint` fields
- **AND** include the `$ARGUMENTS` placeholder in the template body so droid receives any user-supplied input
- **AND** wrap the generated content in Projector managed markers so `projector update` can safely refresh the commands

#### Scenario: Generating slash commands for OpenCode
- **WHEN** the user selects OpenCode during initialization
- **THEN** create `.opencode/commands/projector-proposal.md`, `.opencode/commands/projector-apply.md`, and `.opencode/commands/projector-archive.md`
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