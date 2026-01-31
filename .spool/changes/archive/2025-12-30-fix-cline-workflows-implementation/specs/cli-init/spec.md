# Delta for CLI Init

## MODIFIED Requirements

### Requirement: Slash Command Configuration

The init command SHALL generate slash command files for supported editors using shared templates.

#### Scenario: Generating slash commands for Antigravity

- **WHEN** the user selects Antigravity during initialization
- **THEN** create `.agent/workflows/spool-proposal.md`, `.agent/workflows/spool-apply.md`, and `.agent/workflows/spool-archive.md`
- **AND** ensure each file begins with YAML frontmatter that contains only a `description: <stage summary>` field followed by the shared Spool workflow instructions wrapped in managed markers
- **AND** populate the workflow body with the same proposal/apply/archive guidance used for other tools so Antigravity behaves like Windsurf while pointing to the `.agent/workflows/` directory

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
- **THEN** create `.clinerules/workflows/spool-proposal.md`, `.clinerules/workflows/spool-apply.md`, and `.clinerules/workflows/spool-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** include Cline-specific Markdown heading frontmatter
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for Crush

- **WHEN** the user selects Crush during initialization
- **THEN** create `.crush/commands/spool/proposal.md`, `.crush/commands/spool/apply.md`, and `.crush/commands/spool/archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** include Crush-specific frontmatter with Spool category and tags
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for Cursor

- **WHEN** the user selects Cursor during initialization
- **THEN** create `.cursor/commands/spool-proposal.md`, `.cursor/commands/spool-apply.md`, and `.cursor/commands/spool-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for Factory Droid

- **WHEN** the user selects Factory Droid during initialization
- **THEN** create `.factory/commands/spool-proposal.md`, `.factory/commands/spool-apply.md`, and `.factory/commands/spool-archive.md`
- **AND** populate each file from shared templates that include Factory-compatible YAML frontmatter for the `description` and `argument-hint` fields
- **AND** include the `$ARGUMENTS` placeholder in the template body so droid receives any user-supplied input
- **AND** wrap the generated content in Spool managed markers so `spool update` can safely refresh the commands

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

#### Scenario: Generating slash commands for Gemini CLI

- **WHEN** the user selects Gemini CLI during initialization
- **THEN** create `.gemini/commands/spool/proposal.toml`, `.gemini/commands/spool/apply.toml`, and `.gemini/commands/spool/archive.toml`
- **AND** populate each file as TOML that sets a stage-specific `description = "<summary>"` and a multi-line `prompt = """` block with the shared Spool template
- **AND** wrap the Spool managed markers (`<!-- SPOOL:START -->` / `<!-- SPOOL:END -->`) inside the `prompt` value so `spool update` can safely refresh the body between markers without touching the TOML framing
- **AND** ensure the slash-command copy matches the existing proposal/apply/archive templates used by other tools

#### Scenario: Generating slash commands for iFlow CLI

- **WHEN** the user selects iFlow CLI during initialization
- **THEN** create `.iflow/commands/spool-proposal.md`, `.iflow/commands/spool-apply.md`, and `.iflow/commands/spool-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** include YAML frontmatter with `name`, `id`, `category`, and `description` fields for each command
- **AND** wrap the generated content in Spool managed markers so `spool update` can safely refresh the commands
- **AND** each template includes instructions for the relevant Spool workflow stage

#### Scenario: Generating slash commands for RooCode

- **WHEN** the user selects RooCode during initialization
- **THEN** create `.roo/commands/spool-proposal.md`, `.roo/commands/spool-apply.md`, and `.roo/commands/spool-archive.md`
- **AND** populate each file from shared templates so command text matches other tools
- **AND** include simple Markdown headings (e.g., `# Spool: Proposal`) without YAML frontmatter
- **AND** wrap the generated content in Spool managed markers where applicable so `spool update` can safely refresh the commands
- **AND** each template includes instructions for the relevant Spool workflow stage
