## MODIFIED Requirements
### Requirement: AI Tool Configuration Details

The command SHALL properly configure selected AI tools with Projector-specific instructions using a marker system.

#### Scenario: Configuring Claude Code

- **WHEN** Claude Code is selected
- **THEN** create or update `CLAUDE.md` in the project root directory (not inside projector/)
- **AND** populate the managed block with a short stub that points teammates to `@/projector/AGENTS.md`

#### Scenario: Configuring CodeBuddy Code

- **WHEN** CodeBuddy Code is selected
- **THEN** create or update `CODEBUDDY.md` in the project root directory (not inside projector/)
- **AND** populate the managed block with a short stub that points teammates to `@/projector/AGENTS.md`

#### Scenario: Configuring Cline

- **WHEN** Cline is selected
- **THEN** create or update `CLINE.md` in the project root directory (not inside projector/)
- **AND** populate the managed block with a short stub that points teammates to `@/projector/AGENTS.md`

#### Scenario: Creating new CLAUDE.md

- **WHEN** CLAUDE.md does not exist
- **THEN** create new file with stub instructions wrapped in markers so the full workflow stays in `projector/AGENTS.md`:
```markdown
<!-- PROJECTOR:START -->
# Projector Instructions

This project uses Projector to manage AI assistant workflows.

- Full guidance lives in '@/projector/AGENTS.md'.
- Keep this managed block so 'projector update' can refresh the instructions.
<!-- PROJECTOR:END -->
```

### Requirement: Slash Command Configuration
The init command SHALL generate slash command files for supported editors using shared templates.

#### Scenario: Generating slash commands for Claude Code
- **WHEN** the user selects Claude Code during initialization
- **THEN** create `.claude/commands/projector/proposal.md`, `.claude/commands/projector/apply.md`, and `.claude/commands/projector/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for CodeBuddy Code
- **WHEN** the user selects CodeBuddy Code during initialization
- **THEN** create `.codebuddy/commands/projector/proposal.md`, `.codebuddy/commands/projector/apply.md`, and `.codebuddy/commands/projector/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Cline
- **WHEN** the user selects Cline during initialization
- **THEN** create `.clinerules/projector-proposal.md`, `.clinerules/projector-apply.md`, and `.clinerules/projector-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** include Cline-specific Markdown heading frontmatter
- **AND** each template includes instructions for the relevant Projector workflow stage

#### Scenario: Generating slash commands for Cursor
- **WHEN** the user selects Cursor during initialization
- **THEN** create `.cursor/commands/projector-proposal.md`, `.cursor/commands/projector-apply.md`, and `.cursor/commands/projector-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Projector workflow stage

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

#### Scenario: Generating slash commands for GitHub Copilot
- **WHEN** the user selects GitHub Copilot during initialization
- **THEN** create `.github/prompts/projector-proposal.prompt.md`, `.github/prompts/projector-apply.prompt.md`, and `.github/prompts/projector-archive.prompt.md`
- **AND** populate each file with YAML frontmatter containing a `description` field that summarizes the workflow stage
- **AND** include `$ARGUMENTS` placeholder to capture user input
- **AND** wrap the shared template body with Projector markers so `projector update` can refresh the content
- **AND** each template includes instructions for the relevant Projector workflow stage
