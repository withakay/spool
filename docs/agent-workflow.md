# Agent Workflow

This document describes the Spool workflow as used by AI coding agents. Spool provides a structured approach to managing changes through a series of actions that guide work from initial proposal to final archival.

## Core Concepts

### Changes

A **change** is the fundamental unit of work in Spool. Each change lives in `.spool/changes/<module-id>-NN_<name>/` and contains:

- **proposal.md** - Why the change is needed and what it accomplishes
- **specs/** - Detailed requirements for each capability
- **design.md** - Technical approach (optional for simple changes)
- **tasks.md** - Actionable work items with checkbox tracking

### Modules

Changes are organized into **modules** for grouping related work. Use `spool list --modules` to see existing modules, or `spool create module "<name>"` to create one. Use module `000` for small, ungrouped tasks.

### Artifacts

Each change follows a schema that defines which **artifacts** are required. The default `spec-driven` schema requires: proposal → specs → tasks (with optional design).

## The Five Actions

Spool uses five core actions that guide a change through its lifecycle:

### 1. Proposal (`/spool-proposal`)

Creates a new change with a structured proposal document.

**When to use:** Starting new work - features, fixes, refactoring, documentation.

**What it does:**
1. Checks for existing similar changes
2. Selects or creates a module
3. Creates the change directory with `spool create change "<name>" --module <id>`
4. Generates proposal.md using `spool agent instruction proposal --change "<id>"`

**Proposal structure:**
- **Why** - What problem does this solve? Who benefits?
- **What Changes** - High-level description of modifications
- **Capabilities** - List of features (each becomes a spec)
- **Impact** - Effects on existing functionality, performance, breaking changes

### 2. Research (`spool x-research`)

Conducts structured investigation before implementation.

**When to use:** Exploring options, evaluating technologies, investigating approaches.

**What it does:**
1. Creates research directory at `.spool/research/`
2. Generates SUMMARY.md with research goals
3. Creates investigation files in `investigations/` subdirectory
4. Documents findings, trade-offs, and recommendations

**Research areas:**
- Stack analysis
- Feature landscape
- Architecture patterns
- Potential pitfalls

### 3. Apply (`/spool-apply`)

Implements the tasks defined in a change.

**When to use:** Ready to write code after proposal/specs are complete.

**What it does:**
1. Verifies all required artifacts are complete
2. Reads context: proposal, specs, design, tasks
3. Works through tasks systematically
4. Marks each task complete (`- [ ]` → `- [x]`) as finished
5. Runs validation after completion

**Implementation flow:**
```
For each task in tasks.md:
  1. Mark task in_progress
  2. Read relevant specs/design
  3. Implement the changes
  4. Verify implementation
  5. Mark task complete
```

### 4. Review (`/spool-review`)

Validates changes, specs, or implementations.

**When to use:** Quality checks before merging, validating artifacts.

**What it does:**
1. Runs `spool validate` on the target
2. Categorizes issues: critical, important, minor
3. Provides actionable feedback
4. Documents assessment

**Validation targets:**
- `--changes` - Validate change artifacts
- `--specs` - Validate spec requirements

### 5. Archive (`/spool-archive`)

Completes and archives a finished change.

**When to use:** All tasks complete, implementation validated.

**What it does:**
1. Verifies change is ready (all tasks complete)
2. Confirms with user before proceeding
3. Runs `spool archive <name>`
4. Moves change to `.spool/changes/archive/`
5. Updates main specifications if applicable

## Supporting Actions

### Commit (`/spool-commit`)

Creates git commits aligned to Spool changes.

**Features:**
- Conventional commit format with change ID
- Auto-mode for immediate commits
- One commit per change preferred

## Example Workflow

Here's a complete workflow from start to finish:

```
1. User: "Add user authentication to the API"

2. /spool-proposal
   → Creates 001-03_user-authentication change
   → Generates proposal.md with Why/What/Capabilities/Impact
   
3. Agent creates specs for each capability:
   → specs/login-endpoint/spec.md
   → specs/token-validation/spec.md
   → specs/logout-endpoint/spec.md

4. Agent creates tasks.md with checkbox items

5. /spool-apply
   → Reads all context files
   → Implements tasks one by one
   → Marks each complete in tasks.md
   
6. /spool-review
   → Validates implementation
   → Checks for issues
   
7. /spool-commit
   → Creates conventional commit
   
8. /spool-archive
   → Moves to archive
   → Updates main specs
```

## Flexible ID Formats

Spool accepts flexible ID formats for both modules and changes. You don't need to remember exact zero-padding.

### Module IDs

| Input | Resolves To |
|-------|-------------|
| `1` | `001` |
| `01` | `001` |
| `001` | `001` |
| `1_foo` | module `001` (with name hint) |
| `42` | `042` |

### Change IDs

| Input | Resolves To |
|-------|-------------|
| `1-2_bar` | `001-02_bar` |
| `001-02_bar` | `001-02_bar` |
| `1-00003_bar` | `001-03_bar` |
| `0001-00002_baz` | `001-02_baz` |

These flexible formats work with all CLI commands that accept module or change IDs.

## Interactive Module Selection

When running `/spool-proposal` without specifying a module, you'll be prompted with three options:

1. **Use last worked-on module** - If you recently worked on a module, this option appears first
2. **Create a new module** - Prompts for a module name and creates it
3. **Ungrouped (module 000)** - For small, standalone changes

The system tracks your last-used module in `.spool/.state/session.json`.

## CLI Commands Reference

| Command | Purpose |
|---------|---------|
| `spool list --json` | List all changes |
| `spool status --change <id>` | Show change status and artifacts |
| `spool list --modules` | List modules |
| `spool create module "<name>"` | Create new module |
| `spool create change "<name>" --module <id>` | Create new change |
| `spool agent instruction <action> --change <id>` | Get action instructions |
| `spool validate --changes <id>` | Validate change |
| `spool archive <name>` | Archive completed change |

**Note:** All `<id>` parameters accept flexible formats (e.g., `1-2_foo` instead of `001-02_foo`).

## Directory Structure

```
.spool/
├── .state/
│   └── session.json        # Tracks last module/change worked on
├── changes/
│   ├── 000-01_small-fix/
│   │   ├── .spool.yaml
│   │   ├── proposal.md
│   │   ├── specs/
│   │   │   └── fix-description/
│   │   │       └── spec.md
│   │   └── tasks.md
│   └── archive/
│       └── 000-00_completed-change/
├── research/
│   ├── SUMMARY.md
│   └── investigations/
└── modules/
```

## Best Practices

1. **Start with a proposal** - Even small changes benefit from documenting "why"
2. **One capability = one spec** - Keep specs focused and testable
3. **Mark tasks complete immediately** - Don't batch completions
4. **Validate before archiving** - Catch issues early
5. **Use modules for related work** - Keeps changes organized
6. **Commit with change context** - Links commits to their originating change
