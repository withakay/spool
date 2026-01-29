# spool-bun (Deprecated)

This directory contains the legacy TypeScript/Bun implementation of Spool.

- **Status**: deprecated
- **Supported implementation**: `spool-rs/`

## When to touch this code

Only modify `spool-bun/` when:

- You need compatibility during the Rust transition
- You need to keep behavioral parity for a specific feature

New features and default workflows should be implemented in `spool-rs/`.

## Layout

- `spool-bun/src/`: legacy TypeScript source (moved from repo-root `src/`)

## Development (legacy)

From repo root:

```bash
bun run build
bun run test
```
