## Why

Spool currently has two overlapping implementations (TypeScript/Bun and Rust), which creates ongoing confusion about what is supported, how to install it, and which behavior is canonical. We want to make `spool-rs` the clearly supported default going forward while keeping the TypeScript version available only as a deprecated legacy implementation.

## What Changes

- Move the TypeScript implementation out of the repository root by relocating the current `src/` tree into `spool-bun/` (e.g., `spool-bun/src/`) and update all build/test/config references to match.
- Mark the TypeScript/Bun implementation as deprecated in docs and instructions; explicitly state that `spool-rs` is the supported version and must be favored.
- Update references that assume the root TypeScript layout, including `AGENTS.md` at the repo root and any `spool-bun/`-scoped agent/docs content.
- Update `Makefile` targets to prefer the Rust workflow as the default developer path.
- Update install behavior so `spool-rs` is installed as `spool` (not `spool.rs`).
- Uninstall the TypeScript `spool` from the global cache so it no longer shadows/conflicts with the Rust `spool`.
- **BREAKING**: Any direct references to root `src/` (imports, scripts, paths) will need to be updated to the new `spool-bun/` location.
- **BREAKING**: Default installation expectations shift to Rust; the TypeScript version is no longer the primary installed `spool`.

## Capabilities

### New Capabilities

<!-- None; this change primarily modifies packaging/installer requirements and project layout. -->

### Modified Capabilities

- `rust-packaging-transition`: Update the transition policy so the supported `spool` command maps to `spool-rs`, with the TypeScript/Bun implementation treated as deprecated legacy.
- `rust-installers`: Update installer requirements to install `spool-rs` as `spool` by default and to remove/avoid global-cache conflicts with the legacy TypeScript `spool`.

## Impact

- Repository layout and path references (root `src/` move to `spool-bun/`).
- Documentation and agent guidance (`AGENTS.md`, `.spool/AGENTS.md`, plus any `spool-bun/` docs).
- Developer tooling (`Makefile`, CI scripts, package/workspace configs).
- Installation and caching behavior (default `spool` becomes `spool-rs`; legacy TypeScript version removed from global cache).
