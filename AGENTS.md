<!-- SPOOL:START -->
# Spool Instructions

These instructions are for AI assistants working in this project.

Always open `@/.spool/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/.spool/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Note: Files under `.spool/`, `.opencode/`, `.github/`, and `.codex/` are installed/updated by Spool (`spool init`, `spool update`) and may be overwritten.
Add project-specific guidance in `.spool/user-guidance.md` (injected into agent instruction outputs) and/or below this managed block.

Keep this managed block so 'spool update' can refresh the instructions.

<!-- SPOOL:END -->

## Supported Implementation

`spool-rs/` is the supported Spool implementation and should be favored for all new work.

## Prompt Templates

Spool project/home templates are owned by the Rust embedded assets:
- `spool-rs/crates/spool-templates/assets/default/project/`
- `spool-rs/crates/spool-templates/assets/default/home/`

## Rust `spool init` Embedded Markdown

`spool init` (Rust CLI) installs files from embedded assets, not from this repo's checked-in `.opencode/` directory.

- Project templates live under `spool-rs/crates/spool-templates/assets/default/project/` (includes `.spool/`, `.opencode/`, `.claude/`, `.github/`, etc.)
- Home templates live under `spool-rs/crates/spool-templates/assets/default/home/` (e.g., `.codex/...`)
- Assets are embedded via `include_dir!` in `spool-rs/crates/spool-templates/src/lib.rs` and written by `spool-rs/crates/spool-core/src/installers/mod.rs`

If you want agents to learn new workflows (e.g., task tracking), update the embedded skill markdown in those assets.

## Development Commands

Use the Makefile for common development tasks:

```bash
# Build the project
make build

# Run tests
make test

# Run tests in watch mode
make test-watch

# Run tests with coverage
make test-coverage

# Run linter
make lint

# Clean build artifacts
make clean

# Show all available targets
make help
```

The Makefile defaults should reflect the supported Rust workflow. Legacy Bun targets (if present) should be explicitly named.

## OpenCode Path Convention

**IMPORTANT**: OpenCode uses **singular** directory names for its configuration paths:
- `.opencode/skill/` (NOT `.opencode/skills/`)
- `.opencode/command/` (NOT `.opencode/commands/`)
- `.opencode/plugin/` (NOT `.opencode/plugins/`)

This differs from other tools like Claude Code which use plural forms (`.claude/skills/`, `.claude/commands/`).

When writing tests or code that references OpenCode paths, always use the singular form.

## Coding conventions

When working in the Rust codebase use the skill `rust-style` to guide naming, structuring, and formatting etc.

Guiding Principles:
- YAGNI: Avoid adding features or abstractions until they are needed.
- KISS: Keep it simple and straightforward; prefer clarity over cleverness.
- DRY: Avoid duplication by abstracting common patterns into reusable functions, modules or crates.
- Idiomatic Rust: Follow Rust best practices and conventions for safety, performance, and readability.
- Comprehensive Testing: Write tests for new features and edge cases to ensure reliability.
- Documentation: Document public APIs, complex logic, and usage examples to aid future maintainers.
