## Purpose

The `spool init` command SHALL create a complete Spool directory structure in any project, enabling immediate adoption of Spool conventions with support for the officially supported AI assistants.

## Requirements

### Requirement: Progress Indicators

The command SHALL display progress indicators during initialization to provide clear feedback about each step.

#### Scenario: Displaying initialization progress

- **WHEN** executing initialization steps
- **THEN** validate environment silently in background (no output unless error)
- **AND** display progress with ora spinners:
  - Show spinner: "⠋ Creating Spool structure..."
  - Then success: "✔ Spool structure created"
  - Show spinner: "⠋ Configuring AI tools..."
  - Then success: "✔ AI tools configured"

### Requirement: Directory Creation

The command SHALL create the complete Spool directory structure with all required directories and files.

#### Scenario: Creating Spool structure

- **WHEN** `spool init` is executed
- **THEN** create the following directory structure under the configured Spool directory (default `.spool/`):

```
.spool/
├── project.md
├── AGENTS.md
├── specs/
└── changes/
    └── archive/
```

### Requirement: File Generation

The command SHALL generate required template files with appropriate content for immediate use.

#### Scenario: Generating template files

- **WHEN** initializing Spool
- **THEN** generate `<spoolDir>/AGENTS.md` containing complete Spool instructions for AI assistants
- **AND** generate `<spoolDir>/project.md` with project context template

### Requirement: Spool Skills Installation

Spool agent skills are a core part of Spool and SHALL be installed automatically.

#### Scenario: Installing Spool skills

- **WHEN** `spool init` runs
- **THEN** install core Spool skills into `.claude/skills/<skill>/SKILL.md` within the repo
- **AND** apply the configured Spool directory name inside each skill template
- **AND** include at least `spool-proposal`, `spool-apply`, `spool-archive`, `spool-research`, and `spool-review`

### Requirement: AI Tool Configuration

The command SHALL configure supported AI coding assistants with Spool instructions using a grouped selection experience.

#### Scenario: Prompting for AI tool selection

- **WHEN** run interactively
- **THEN** present a multi-select wizard that separates options into two headings:
  - **Natively supported providers** shows Claude Code, OpenCode, Codex, and GitHub Copilot
  - **Other tools** explains that the root-level `AGENTS.md` stub is always generated for AGENTS-compatible assistants and cannot be deselected
- **AND** mark already configured native tools with "(already configured)" to signal that choosing them will refresh managed content
- **AND** allow confirming the selection even when no native provider is chosen because the root stub remains enabled by default
- **AND** change the base prompt copy in extend mode to "Which natively supported AI tools would you like to add or refresh?"

### Requirement: AI Tool Configuration Details

The command SHALL properly configure selected AI tools with Spool-specific instructions using a marker system.

#### Scenario: Configuring Claude Code

- **WHEN** Claude Code is selected
- **THEN** create or update `CLAUDE.md` in the project root directory (not inside the Spool directory)
- **AND** populate the managed block with a short stub that points teammates to `@/<spoolDir>/AGENTS.md`

#### Scenario: Configuring OpenCode

- **WHEN** OpenCode is selected
- **THEN** create `.opencode/commands/spool-proposal.md`, `.opencode/commands/spool-apply.md`, `.opencode/commands/spool-archive.md`, `.opencode/commands/spool-research.md`, and `.opencode/commands/spool-review.md`
- **AND** populate each file from shared templates so command text matches other tools

#### Scenario: Configuring Codex

- **WHEN** Codex is selected
- **THEN** create global prompt files at `~/.codex/prompts/spool-proposal.md`, `~/.codex/prompts/spool-apply.md`, `~/.codex/prompts/spool-archive.md`, `~/.codex/prompts/spool-research.md`, and `~/.codex/prompts/spool-review.md` (or under `$CODEX_HOME/prompts` if set)
- **AND** populate each file from shared templates that map the first numbered placeholder (`$1`) to the primary user input
- **AND** wrap the generated content in Spool markers so `spool update` can refresh the prompts without touching surrounding custom notes

#### Scenario: Configuring GitHub Copilot

- **WHEN** GitHub Copilot is selected
- **THEN** create `.github/prompts/spool-proposal.prompt.md`, `.github/prompts/spool-apply.prompt.md`, `.github/prompts/spool-archive.prompt.md`, `.github/prompts/spool-research.prompt.md`, and `.github/prompts/spool-review.prompt.md`
- **AND** populate each file with YAML frontmatter containing a `description` field that summarizes the workflow stage
- **AND** include `$ARGUMENTS` placeholder to capture user input
- **AND** wrap the shared template body with Spool markers so `spool update` can refresh the content

#### Scenario: Creating new CLAUDE.md

- **WHEN** CLAUDE.md does not exist
- **THEN** create new file with stub instructions wrapped in markers so the full workflow stays in `<spoolDir>/AGENTS.md`:

```markdown
<!-- SPOOL:START -->
# Spool Instructions

This project uses Spool to manage AI assistant workflows.

- Full guidance lives in '@/<spoolDir>/AGENTS.md'.
- Keep this managed block so 'spool update' can refresh the instructions.
<!-- SPOOL:END -->
```

### Requirement: Interactive Mode

The command SHALL provide an interactive menu for AI tool selection with clear navigation instructions.

#### Scenario: Displaying interactive menu

- **WHEN** run in fresh or extend mode
- **THEN** present a looping select menu that lets users toggle tools with Space and review selections with Enter
- **AND** when Enter is pressed on a highlighted selectable tool that is not already selected, automatically add it to the selection before moving to review so the highlighted tool is configured
- **AND** label already configured tools with "(already configured)"
- **AND** change the prompt copy in extend mode to "Which AI tools would you like to add or refresh?"
- **AND** display inline instructions clarifying that Space toggles tools and Enter selects the highlighted tool before reviewing selections

### Requirement: Safety Checks

The command SHALL perform safety checks to prevent overwriting existing structures and ensure proper permissions.

#### Scenario: Detecting existing initialization

- **WHEN** the configured Spool directory already exists
- **THEN** inform the user that Spool is already initialized, skip recreating the base structure, and enter an extend mode
- **AND** continue to the AI tool selection step so additional tools can be configured
- **AND** display the existing-initialization error message only when the user declines to add any AI tools

### Requirement: Success Output

The command SHALL provide clear, actionable next steps upon successful initialization.

#### Scenario: Displaying success message

- **WHEN** initialization completes successfully
- **THEN** include prompt: "Please explain the Spool workflow from <spoolDir>/AGENTS.md and how I should work with you on this project"

#### Scenario: Displaying restart instruction

- **WHEN** initialization completes successfully and tools were created or refreshed
- **THEN** display a prominent restart instruction before the "Next steps" section
- **AND** inform users that slash commands are loaded at startup
- **AND** instruct users to restart their coding assistant to ensure /spool commands appear

### Requirement: Exit Codes

The command SHALL use consistent exit codes to indicate different failure modes.

#### Scenario: Returning exit codes

- **WHEN** the command completes
- **THEN** return appropriate exit code:
  - 0: Success
  - 1: General error (including when Spool directory already exists)
  - 2: Insufficient permissions (reserved for future use)
  - 3: User cancelled operation (reserved for future use)

### Requirement: Additional AI Tool Initialization

`spool init` SHALL allow users to add configuration files for new AI coding assistants after the initial setup.

#### Scenario: Configuring an extra tool after initial setup

- **GIVEN** a Spool directory already exists and at least one AI tool file is present
- **WHEN** the user runs `spool init` and selects a different supported AI tool
- **THEN** generate that tool's configuration files with Spool markers the same way as during first-time initialization
- **AND** leave existing tool configuration files unchanged except for managed sections that need refreshing
- **AND** exit with code 0 and display a success summary highlighting the newly added tool files

### Requirement: Success Output Enhancements

`spool init` SHALL summarize tool actions when initialization or extend mode completes.

#### Scenario: Showing tool summary

- **WHEN** the command completes successfully
- **THEN** display a categorized summary of tools that were created, refreshed, or skipped (including already-configured skips)
- **AND** personalize the "Next steps" header using the names of the selected tools, defaulting to a generic label when none remain

### Requirement: Exit Code Adjustments

`spool init` SHALL treat extend mode without new native tool selections as a successful refresh.

#### Scenario: Allowing empty extend runs

- **WHEN** Spool is already initialized and the user selects no additional natively supported tools
- **THEN** complete successfully while refreshing the root `AGENTS.md` stub
- **AND** exit with code 0

### Requirement: Non-Interactive Mode

The command SHALL support non-interactive operation through command-line options for automation and CI/CD use cases.

#### Scenario: Select all tools non-interactively

- **WHEN** run with `--tools all`
- **THEN** automatically select every available AI tool without prompting
- **AND** proceed with initialization using the selected tools

#### Scenario: Select specific tools non-interactively

- **WHEN** run with `--tools claude,codex`
- **THEN** parse the comma-separated tool IDs and validate against available tools
- **AND** proceed with initialization using only the specified valid tools

#### Scenario: Skip tool configuration non-interactively

- **WHEN** run with `--tools none`
- **THEN** skip AI tool configuration entirely
- **AND** only create the Spool directory structure and template files

#### Scenario: Invalid tool specification

- **WHEN** run with `--tools` containing any IDs not present in the AI tool registry
- **THEN** exit with code 1 and display available values (`all`, `none`, or the supported tool IDs)

#### Scenario: Help text lists available tool IDs

- **WHEN** displaying CLI help for `spool init`
- **THEN** show the `--tools` option description with the valid values derived from the AI tool registry

### Requirement: Root instruction stub

`spool init` SHALL always scaffold the root-level `AGENTS.md` hand-off so every teammate finds the primary Spool instructions.

#### Scenario: Creating root `AGENTS.md`

- **GIVEN** the project may or may not already contain an `AGENTS.md` file
- **WHEN** initialization completes in fresh or extend mode
- **THEN** create or refresh `AGENTS.md` at the repository root using the managed marker block from `TemplateManager.getAgentsStandardTemplate()`
- **AND** preserve any existing content outside the managed markers while replacing the stub text inside them
- **AND** create the stub regardless of which native AI tools are selected

## Why

Manual creation of Spool structure is error-prone and creates adoption friction. A standardized init command ensures:

- Consistent structure across all projects
- Proper AI instruction files are always included
- Quick onboarding for new projects
- Clear conventions from the start
