## MODIFIED Requirements

### Requirement: Directory Creation

The command SHALL create the complete Spool directory structure with all required directories and files.

#### Scenario: Creating Spool structure

- **WHEN** `spool init` is executed
- **THEN** create the following directory structure:

```
spool/
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
- **THEN** generate `AGENTS.md` containing complete Spool instructions for AI assistants
- **AND** generate `project.md` with project context template

### Requirement: AI Tool Configuration Details

The command SHALL properly configure selected AI tools with Spool-specific instructions using a marker system.

#### Scenario: Creating new CLAUDE.md

- **WHEN** CLAUDE.md does not exist
- **THEN** create new file with Spool content wrapped in markers including reference to `@spool/AGENTS.md`

### Requirement: Success Output

The command SHALL provide clear, actionable next steps upon successful initialization.

#### Scenario: Displaying success message

- **WHEN** initialization completes successfully
- **THEN** include prompt: "Please explain the Spool workflow from spool/AGENTS.md and how I should work with you on this project"
