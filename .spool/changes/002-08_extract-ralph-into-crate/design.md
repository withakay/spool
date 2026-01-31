## Context

Ralph currently ships as a module inside `spool-core` (`spool-core/src/ralph/*`) and is invoked by `spool-cli` to implement `spool ralph`. This couples the Ralph loop implementation to core concerns and makes future Ralph-specific work riskier and noisier.

## Goals / Non-Goals

**Goals:**
- Extract Ralph into a dedicated crate (workspace member).
- Preserve CLI behavior and on-disk state layout.
- Keep clear dependency direction (avoid cyclic crate dependencies).

**Non-Goals:**
- Feature work on Ralph itself (this change is refactor-only).
- Changing the Ralph state file format or path.

## Decisions

### Decision: New crate `spool-ralph`

Create `spool-rs/crates/spool-ralph/` (crate name `spool-ralph`, Rust path `spool_ralph`) containing:
- `runner` (the main loop)
- `state` (context + state read/write)
- `prompt` (prompt composition)

### Decision: Dependency direction

`spool-ralph` depends on `spool-core` for shared utilities already used today (e.g. `io`, `paths`, `validate` helpers). `spool-core` does not depend on `spool-ralph`.

This avoids cyclic dependencies and keeps core independent.

### Decision: Preserve CLI and state behavior

- `spool ralph` command remains in `spool-cli`.
- `.spool/.state/ralph/<change-id>/` remains the state directory layout.

## Risks / Trade-offs

- Internal API churn: references to `spool_core::ralph` must be updated.
- Dependency hygiene: `spool-ralph` must not pull in CLI-only concerns.
- Workspace complexity: more crates requires disciplined boundaries.

## Migration Plan

1. Create `spool-ralph` crate and move the Ralph source files.
2. Update imports and public surface (`RalphOptions`, `run_ralph`, state helpers).
3. Update `spool-cli` to use the new crate.
4. Move Ralph tests into `spool-ralph` and ensure `make test` passes.

## Open Questions

- Should we keep a temporary compatibility shim (e.g. a deprecated re-export) for `spool_core::ralph`, or treat it as internal and update all call sites immediately?
