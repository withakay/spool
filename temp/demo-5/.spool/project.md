# Project Context

## Purpose

Demonstrate Spool CLI end-to-end by building a tiny Rust to-do CLI.

## Tech Stack

- Rust (cargo)
- clap (CLI parsing)

## Project Conventions

### Code Style

- rustfmt defaults
- snake_case for functions, PascalCase for structs

### Architecture Patterns

- Modules for core domain, storage, and CLI wiring

### Testing Strategy

- Minimal unit coverage; rely on manual CLI scenarios

### Git Workflow

- Dedicated feature branch; small commits per Spool change

## Domain Context

- Tasks stored as text lines with id, done flag, and task text

## Important Constraints

- Keep demo changes inside temp/demo-5 only

## External Dependencies

- None
