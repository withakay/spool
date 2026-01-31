## MODIFIED Requirements

### Requirement: AI Tool Configuration Details

The command SHALL properly configure selected AI tools with Spool-specific instructions using a marker system.

#### Scenario: Configuring Claude Code

- **WHEN** Claude Code is selected
- **THEN** create or update `CLAUDE.md` in the project root directory (not inside spool/)
- **AND** populate the managed block with a short stub that points teammates to `@/spool/AGENTS.md`

#### Scenario: Configuring CodeBuddy Code

- **WHEN** CodeBuddy Code is selected
- **THEN** create or update `CODEBUDDY.md` in the project root directory (not inside spool/)
- **AND** populate the managed block with a short stub that points teammates to `@/spool/AGENTS.md`

#### Scenario: Configuring Cline

- **WHEN** Cline is selected
- **THEN** create or update `CLINE.md` in the project root directory (not inside spool/)
- **AND** populate the managed block with a short stub that points teammates to `@/spool/AGENTS.md`

#### Scenario: Creating new CLAUDE.md

- **WHEN** CLAUDE.md does not exist
- **THEN** create new file with stub instructions wrapped in markers so the full workflow stays in `spool/AGENTS.md`:

```markdown
<!-- SPOOL:START -->
# Spool Instructions

This project uses Spool to manage AI assistant workflows.

- Full guidance lives in '@/spool/AGENTS.md'.
- Keep this managed block so 'spool update' can refresh the instructions.
<!-- SPOOL:END -->
```

### Requirement: Slash Command Configuration

The init command SHALL generate slash command files for supported editors using shared templates.

#### Scenario: Generating slash commands for Claude Code

- **WHEN** the user selects Claude Code during initialization
- **THEN** create `.claude/commands/spool/proposal.md`, `.claude/commands/spool/apply.md`, and `.claude/commands/spool/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for CodeBuddy Code

- **WHEN** the user selects CodeBuddy Code during initialization
- **THEN** create `.codebuddy/commands/spool/proposal.md`, `.codebuddy/commands/spool/apply.md`, and `.codebuddy/commands/spool/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for Cline

- **WHEN** the user selects Cline during initialization
- **THEN** create `.clinerules/spool-proposal.md`, `.clinerules/spool-apply.md`, and `.clinerules/spool-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** include Cline-specific Markdown heading frontmatter
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

#### Scenario: Generating slash commands for Windsurf

- **WHEN** the user selects Windsurf during initialization
- **THEN** create `.windsurf/workflows/spool-proposal.md`, `.windsurf/workflows/spool-apply.md`, and `.windsurf/workflows/spool-archive.md`
- **AND** populate each file from shared templates (wrapped in Spool markers) so workflow text matches other tools
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for Kilo Code

- **WHEN** the user selects Kilo Code during initialization
- **THEN** create `.kilocode/workflows/spool-proposal.md`, `.kilocode/workflows/spool-apply.md`, and `.kilocode/workflows/spool-archive.md`
- **AND** populate each file from shared templates (wrapped in Spool markers) so workflow text matches other tools
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for Codex

- **WHEN** the user selects Codex during initialization
- **THEN** create global prompt files at `~/.codex/prompts/spool-proposal.md`, `~/.codex/prompts/spool-apply.md`, and `~/.codex/prompts/spool-archive.md` (or under `$CODEX_HOME/prompts` if set)
- **AND** populate each file from shared templates that map the first numbered placeholder (`$1`) to the primary user input (e.g., change identifier or question text)
- **AND** wrap the generated content in Spool markers so `spool update` can refresh the prompts without touching surrounding custom notes

#### Scenario: Generating slash commands for GitHub Copilot

- **WHEN** the user selects GitHub Copilot during initialization
- **THEN** create `.github/prompts/spool-proposal.prompt.md`, `.github/prompts/spool-apply.prompt.md`, and `.github/prompts/spool-archive.prompt.md`
- **AND** populate each file with YAML frontmatter containing a `description` field that summarizes the workflow stage
- **AND** include `$ARGUMENTS` placeholder to capture user input
- **AND** wrap the shared template body with Spool markers so `spool update` can refresh the content
- **AND** each template includes instructions for the relevant Spool workflow stage
