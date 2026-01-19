# CLI Init Specification

## Purpose

The `spool init` command SHALL create a complete Spool directory structure in any project, enabling immediate adoption of Spool conventions with support for multiple AI coding assistants.

## Behavior

### Progress Indicators

WHEN executing initialization steps
THEN validate environment silently in background (no output unless error)
AND display progress with ora spinners:
- Show spinner: "⠋ Creating Spool structure..."
- Then success: "✔ Spool structure created"
- Show spinner: "⠋ Configuring AI tools..."
- Then success: "✔ AI tools configured"

### Directory Creation

WHEN `spool init` is executed
THEN create the following directory structure:
```
spool/
├── project.md
├── README.md
├── specs/
└── changes/
    └── archive/
```

### File Generation

The command SHALL generate:
- `README.md` containing complete Spool instructions for AI assistants
- `project.md` with project context template

### AI Tool Configuration

WHEN run interactively
THEN prompt user to select AI tools to configure:
- Claude Code (updates/creates CLAUDE.md with Spool markers)
- Cursor (future)
- Aider (future)

### AI Tool Configuration Details

WHEN Claude Code is selected
THEN create or update `CLAUDE.md` in the project root directory (not inside spool/)

WHEN CLAUDE.md does not exist
THEN create new file with Spool content wrapped in markers:
```markdown
<!-- SPOOL:START -->
# Spool Project

This document provides instructions for AI coding assistants on how to use Spool conventions for spec-driven development. Follow these rules precisely when working on Spool-enabled projects.

This project uses Spool for spec-driven development. Specifications are the source of truth.

See @spool/README.md for detailed conventions and guidelines.
<!-- SPOOL:END -->
```

WHEN CLAUDE.md already exists
THEN preserve all existing content
AND insert Spool content at the beginning of the file using markers
AND ensure markers don't duplicate if they already exist

The marker system SHALL:
- Use `<!-- SPOOL:START -->` to mark the beginning of managed content
- Use `<!-- SPOOL:END -->` to mark the end of managed content
- Allow Spool to update its content without affecting user customizations
- Preserve all content outside the markers intact

WHY use markers:
- Users may have existing CLAUDE.md instructions they want to keep
- Spool can update its instructions in future versions
- Clear boundary between Spool-managed and user-managed content

### Interactive Mode

WHEN run
THEN prompt user with: "Which AI tool do you use?"
AND show single-select menu with available tools:
- Claude Code
AND show disabled options as "coming soon" (not selectable):
- Cursor (coming soon)
- Aider (coming soon)  
- Continue (coming soon)

User navigation:
- Use arrow keys to move between options
- Press Enter to select the highlighted option

### Safety Checks

WHEN `spool/` directory already exists
THEN display error with ora fail indicator:
"✖ Error: Spool seems to already be initialized. Use 'spool update' to update the structure."

WHEN checking initialization feasibility
THEN verify write permissions in the target directory silently
AND only display error if permissions are insufficient

### Success Output

WHEN initialization completes successfully
THEN display actionable prompts for AI-driven workflow:
```
✔ Spool initialized successfully!

Next steps - Copy these prompts to Claude:

────────────────────────────────────────────────────────────
1. Populate your project context:
   "Please read spool/project.md and help me fill it out
    with details about my project, tech stack, and conventions"

2. Create your first change proposal:
   "I want to add [YOUR FEATURE HERE]. Please create an
    Spool change proposal for this feature"

3. Learn the Spool workflow:
   "Please explain the Spool workflow from spool/README.md
    and how I should work with you on this project"
────────────────────────────────────────────────────────────
```

The prompts SHALL:
- Be copy-pasteable for immediate use with AI tools
- Guide users through the AI-driven workflow
- Replace placeholder text ([YOUR FEATURE HERE]) with actual features

### Exit Codes

- 0: Success
- 1: General error (including when Spool directory already exists)
- 2: Insufficient permissions (reserved for future use)
- 3: User cancelled operation (reserved for future use)

## Why

Manual creation of Spool structure is error-prone and creates adoption friction. A standardized init command ensures:
- Consistent structure across all projects
- Proper AI instruction files are always included
- Quick onboarding for new projects
- Clear conventions from the start