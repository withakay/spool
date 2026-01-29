# Spool Project Overview

A CLI tool that helps developers set up Spool file structures and keep AI instructions updated.

This repository currently contains two implementations:

- **Supported**: `spool-rs/` (Rust)
- **Deprecated legacy**: `spool-bun/` (TypeScript/Bun)

## Technology Stack
- Supported implementation
  - Language: Rust
  - Workspace: `spool-rs/` (Cargo)
  - Distribution: native binaries

- Deprecated legacy implementation
  - Language: TypeScript
  - Runtime: Node.js (ESM) / Bun
  - Source: `spool-bun/src/`
  - CLI Framework: Commander.js
  - User Interaction: @inquirer/prompts

## Project Structure
```
spool-rs/        # Supported Rust implementation
spool-bun/       # Deprecated legacy TypeScript/Bun implementation

dist/            # Legacy TS compiled output (gitignored)
```

## Conventions
- TypeScript strict mode enabled
- Async/await for all asynchronous operations
- Minimal dependencies principle
- Clear separation of CLI, core logic, and utilities
- AI-friendly code with descriptive names

## Error Handling
- Let errors bubble up to CLI level for consistent user messaging
- Use native Error types with descriptive messages
- Exit with appropriate codes: 0 (success), 1 (general error), 2 (misuse)
- No try-catch in utility functions, handle at command level

## Logging
- Use console methods directly (no logging library)
- console.log() for normal output
- console.error() for errors (outputs to stderr)
- No verbose/debug modes initially (keep it simple)

## Testing Strategy
- Supported (Rust): `cargo test --workspace` (or `make test`)
- Legacy (TypeScript/Bun): `bun run test`

## Development Workflow
- Default (supported): use the Makefile Rust defaults
  - `make build`
  - `make test`

- Legacy (TypeScript/Bun): run Bun scripts from repo root
  - `bun run build`
  - `bun run test`

- Follow Spool's own change-driven development process
