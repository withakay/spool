# Project Context

## Purpose

Spool is a specification-driven development workflow tool for AI-assisted coding. It helps developers and AI agents collaborate on software changes through structured proposals, specifications, and task tracking.

Key goals:
- Enable structured change management with proposals, specs, and tasks
- Support multiple AI agent harnesses (OpenCode, Claude Code, Codex)
- Distribute reusable skills for common development workflows
- Maintain spec-driven development practices

## Tech Stack

- **Rust** - Core CLI implementation (`spool-rs/`)
- **Cargo** - Build system and package management
- **prek** - Pre-commit hooks (Rust-based alternative to pre-commit)
- **cargo-llvm-cov** - Test coverage

### Crate Structure

| Crate | Purpose |
|-------|---------|
| spool-cli | CLI entry point and command handling |
| spool-core | Core business logic, installers, distribution |
| spool-fs | File system utilities with marker-based updates |
| spool-harness | Agent harness detection (OpenCode, Claude Code, Codex) |
| spool-logging | JSONL event logging and session management |
| spool-schemas | Schema loading and validation |
| spool-templates | Embedded template assets for `spool init` |
| spool-test-support | Test utilities and fixtures |
| spool-workflow | Task parsing, planning, workflow state |

## Project Conventions

### Code Style

- Use `rust-style` skill for Rust code guidelines
- Prefer `for` loops over iterator chains
- Use `let-else` for early returns
- Use variable shadowing to refine types
- Use explicit matching (avoid `matches!` macro)
- Keep comments minimal - code should be self-documenting
- **File size limit**: Keep source files under 1000 lines

### Architecture Patterns

- **Embedded assets**: Templates are embedded in binaries via `include_dir!`
- **Modular crates**: Separate concerns into focused crates
- **Harness adapters**: Support multiple AI agent tools through adapters
- **Spec-driven**: Changes flow through proposal → spec → tasks → implementation

### Testing Strategy

- Target **80%+ test coverage** per crate
- Use `cargo-llvm-cov` for coverage measurement
- Integration tests in `crates/*/tests/`
- Test fixtures in `spool-test-support`

### Git Workflow

- **Conventional commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- **Pre-commit hooks**: fmt, clippy, test-coverage via prek
- **Branch naming**: `<type>/<description>` (e.g., `feat/add-research-skill`)

## Domain Context

### Spool Workflow

1. **Proposal**: High-level description of a change (why, what, impact)
2. **Specs**: Detailed specifications in `.spool/specs/`
3. **Design**: Architecture decisions in `design.md`
4. **Tasks**: Implementation steps in `tasks.md` with wave-based ordering
5. **Archive**: Completed changes moved to `.spool/changes/archive/`

### Skills Distribution

Skills are distributed from `spool-skills/skills/` to agent harnesses:
- Local mode: Read from filesystem
- Remote mode: Fetch from GitHub
- Skills are listed in `SPOOL_SKILLS` constant in `distribution.rs`

### Agent Harnesses

Spool supports multiple AI coding assistants:
- **OpenCode**: `.opencode/skills/spool-*/`
- **Claude Code**: `.claude/skills/spool-*/`
- **Codex**: `.codex/skills/spool-*/`

## Important Constraints

- **No TypeScript**: Legacy TS implementation deprecated; all new work in Rust
- **Embedded templates**: Template changes require rebuild of `spool-templates` crate
- **Skill naming**: Skill directories in source use base name; distributed with `spool-` prefix

## External Dependencies

- **GitHub**: Remote skill fetching, release distribution
- **crates.io**: Rust dependencies
- **npm** (planned): Binary package distribution
