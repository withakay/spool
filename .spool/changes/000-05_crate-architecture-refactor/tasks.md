# Tasks for: 000-05_crate-architecture-refactor

## Execution Notes

- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential waves, parallel tasks within waves
- **Template**: Enhanced task format with waves, verification, and status tracking
- **Tracking**: Use the tasks CLI to drive status updates and pick work

```bash
spool tasks status 000-05_crate-architecture-refactor
spool tasks next 000-05_crate-architecture-refactor
spool tasks start 000-05_crate-architecture-refactor 1.1
spool tasks complete 000-05_crate-architecture-refactor 1.1
```

______________________________________________________________________

## Wave 1

- **Depends On**: None

### Task 1.1: Scaffold spool-common crate

- **Files**: spool-rs/crates/spool-common/Cargo.toml, spool-rs/crates/spool-common/src/lib.rs, spool-rs/Cargo.toml
- **Dependencies**: None
- **Action**:
  Create new `spool-common` crate with Cargo.toml (no spool-* dependencies, only external crates like miette, thiserror). Add to workspace members. Create empty lib.rs with module declarations.
- **Verify**: `cargo check -p spool-common`
- **Done When**: Crate compiles with no spool-* dependencies
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 1.2: Move id module to spool-common

- **Files**: spool-rs/crates/spool-common/src/id/, spool-rs/crates/spool-core/src/id/
- **Dependencies**: Task 1.1
- **Action**:
  Copy `spool-core/src/id/` to `spool-common/src/id/`. Update imports. Export from spool-common lib.rs. Keep re-export in spool-core temporarily for compatibility.
- **Verify**: `cargo test -p spool-common`
- **Done When**: id module tests pass in spool-common
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 1.3: Move paths module to spool-common

- **Files**: spool-rs/crates/spool-common/src/paths.rs, spool-rs/crates/spool-core/src/paths.rs
- **Dependencies**: Task 1.1
- **Action**:
  Copy `spool-core/src/paths.rs` to `spool-common/src/paths.rs`. Update imports. Export from lib.rs.
- **Verify**: `cargo test -p spool-common`
- **Done When**: paths module compiles in spool-common
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 1.4: Move io module to spool-common

- **Files**: spool-rs/crates/spool-common/src/io.rs, spool-rs/crates/spool-core/src/io.rs
- **Dependencies**: Task 1.1
- **Action**:
  Copy `spool-core/src/io.rs` to `spool-common/src/io.rs`. Update imports. Export from lib.rs.
- **Verify**: `cargo test -p spool-common`
- **Done When**: io module compiles in spool-common
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 1.5: Move match module to spool-common

- **Files**: spool-rs/crates/spool-common/src/match_.rs, spool-rs/crates/spool-core/src/match_.rs
- **Dependencies**: Task 1.1
- **Action**:
  Copy `spool-core/src/match_.rs` to `spool-common/src/match_.rs`. Update imports. Export from lib.rs.
- **Verify**: `cargo test -p spool-common`
- **Done When**: match_ module compiles in spool-common
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 1.6: Add FileSystem trait to spool-common

- **Files**: spool-rs/crates/spool-common/src/fs.rs
- **Dependencies**: Task 1.1
- **Action**:
  Create `fs.rs` with `FileSystem` trait (Send + Sync, methods: read_to_string, write, exists, create_dir_all, read_dir, remove_file, remove_dir_all, is_dir, is_file). Create `StdFs` struct implementing the trait via std::fs. Export from lib.rs.
- **Verify**: `cargo test -p spool-common`
- **Done When**: FileSystem trait and StdFs compile, StdFs is zero-sized
- **Updated At**: 2026-02-05
- **Status**: [x] complete

______________________________________________________________________

## Wave 2

- **Depends On**: Wave 1

### Task 2.1: Scaffold spool-config crate

- **Files**: spool-rs/crates/spool-config/Cargo.toml, spool-rs/crates/spool-config/src/lib.rs, spool-rs/Cargo.toml
- **Dependencies**: None
- **Action**:
  Create new `spool-config` crate with Cargo.toml (depends on spool-common only). Add to workspace members. Create empty lib.rs.
- **Verify**: `cargo check -p spool-config`
- **Done When**: Crate compiles with only spool-common dependency
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 2.2: Move config module to spool-config

- **Files**: spool-rs/crates/spool-config/src/config/, spool-rs/crates/spool-core/src/config/
- **Dependencies**: Task 2.1
- **Action**:
  Copy `spool-core/src/config/` to `spool-config/src/`. Update internal imports to use spool_common. Export from lib.rs.
- **Verify**: `cargo check -p spool-config`
- **Done When**: config module compiles in spool-config
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 2.3: Move spool_dir module to spool-config

- **Files**: spool-rs/crates/spool-config/src/spool_dir/, spool-rs/crates/spool-core/src/spool_dir/
- **Dependencies**: Task 2.1
- **Action**:
  Copy `spool-core/src/spool_dir/` to `spool-config/src/spool_dir/`. Update imports. Export from lib.rs.
- **Verify**: `cargo check -p spool-config`
- **Done When**: spool_dir module compiles in spool-config
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 2.4: Move output module to spool-config

- **Files**: spool-rs/crates/spool-config/src/output/, spool-rs/crates/spool-core/src/output/
- **Dependencies**: Task 2.1
- **Action**:
  Copy `spool-core/src/output/` to `spool-config/src/output/`. Update imports. Export from lib.rs.
- **Verify**: `cargo check -p spool-config`
- **Done When**: output module compiles in spool-config
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 2.5: Create SpoolContext struct

- **Files**: spool-rs/crates/spool-config/src/context.rs
- **Dependencies**: Task 2.2, Task 2.3
- **Action**:
  Create `SpoolContext` struct with fields: config_dir (Option<PathBuf>), project_root (PathBuf), spool_path (Option<PathBuf>), config (ResolvedConfig). Add `SpoolContext::resolve<F: FileSystem>(fs: &F, cwd: &Path)` method.
- **Verify**: `cargo test -p spool-config`
- **Done When**: SpoolContext compiles and has resolve method
- **Updated At**: 2026-02-05
- **Status**: [x] complete

______________________________________________________________________

## Wave 3

- **Depends On**: Wave 1

### Task 3.1: Add spool-common dependency to spool-domain

- **Files**: spool-rs/crates/spool-domain/Cargo.toml
- **Dependencies**: None
- **Action**:
  Add `spool-common` to spool-domain dependencies.
- **Verify**: `cargo check -p spool-domain`
- **Done When**: spool-domain compiles with new dependency
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 3.2: Move discovery module to spool-domain

- **Files**: spool-rs/crates/spool-domain/src/discovery.rs, spool-rs/crates/spool-core/src/discovery.rs
- **Dependencies**: Task 3.1
- **Action**:
  Copy `spool-core/src/discovery.rs` to `spool-domain/src/discovery.rs`. Update imports to use spool_common for paths, io. Update function signatures to accept `<F: FileSystem>` where needed. Export from lib.rs.
- **Verify**: `cargo test -p spool-domain`
- **Done When**: discovery module compiles and tests pass in spool-domain
- **Updated At**: 2026-02-05
- **Status**: [x] complete

### Task 3.3: Refactor spool-logging to be a leaf crate

- **Files**: spool-rs/crates/spool-logging/Cargo.toml, spool-rs/crates/spool-logging/src/lib.rs
- **Dependencies**: None
- **Action**:
  Remove spool-core dependency from Cargo.toml. Change `Logger::new()` signature from `(ctx: &ConfigContext, ...)` to `(config_dir: Option<PathBuf>, ...)`. Update all internal uses of ConfigContext.
- **Verify**: `cargo check -p spool-logging`
- **Done When**: spool-logging has no spool-* dependencies
- **Updated At**: 2026-02-05
- **Status**: [x] complete

______________________________________________________________________

## Wave 4

- **Depends On**: Wave 2, Wave 3

### Task 4.1: Add spool-config and spool-common dependencies to spool-core

- **Files**: spool-rs/crates/spool-core/Cargo.toml
- **Dependencies**: None
- **Action**:
  Add `spool-config` and `spool-common` to spool-core dependencies. Keep spool-domain, spool-templates, spool-harness.
- **Verify**: `cargo check -p spool-core`
- **Done When**: spool-core compiles with new dependencies
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

### Task 4.2: Inline spool-fs into spool-core

- **Files**: spool-rs/crates/spool-core/src/installers/markers.rs, spool-rs/crates/spool-fs/
- **Dependencies**: Task 4.1
- **Action**:
  Copy `update_file_with_markers` function from spool-fs to new file `spool-core/src/installers/markers.rs`. Update imports in installers/mod.rs. Remove spool-fs from spool-core dependencies.
- **Verify**: `cargo test -p spool-core -- markers`
- **Done When**: Marker functionality works without spool-fs crate
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

### Task 4.3: Remove moved modules from spool-core

- **Files**: spool-rs/crates/spool-core/src/lib.rs, spool-rs/crates/spool-core/src/
- **Dependencies**: Task 4.1, Task 4.2
- **Action**:
  Delete old module files from spool-core: id/, paths.rs, io.rs, match_.rs, config/, spool_dir/, output/, discovery.rs. Update lib.rs to remove these module declarations. Add re-exports from spool-common and spool-config for backward compatibility (temporary).
- **Verify**: `cargo check -p spool-core`
- **Done When**: spool-core no longer contains moved modules
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

______________________________________________________________________

## Wave 5

- **Depends On**: Wave 4

### Task 5.1: Update spool-cli imports

- **Files**: spool-rs/crates/spool-cli/src/**/*.rs, spool-rs/crates/spool-cli/Cargo.toml
- **Dependencies**: None
- **Action**:
  Add spool-config and spool-common to CLI dependencies. Update all imports: `spool_core::config` -> `spool_config`, `spool_core::io` -> `spool_common::io`, etc. Update Logger::new() calls to pass config_dir explicitly.
- **Verify**: `cargo check -p spool-cli`
- **Done When**: CLI compiles with new import paths
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

### Task 5.2: Update spool-web imports

- **Files**: spool-rs/crates/spool-web/src/**/*.rs, spool-rs/crates/spool-web/Cargo.toml
- **Dependencies**: None
- **Action**:
  Add spool-config dependency if needed. Update imports for any config or utility usage.
- **Verify**: `cargo check -p spool-web`
- **Done When**: spool-web compiles with new import paths
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

### Task 5.3: Update any remaining crates

- **Files**: spool-rs/crates/*/Cargo.toml, spool-rs/crates/*/src/**/*.rs
- **Dependencies**: Task 5.1, Task 5.2
- **Action**:
  Grep for any remaining uses of old import paths (spool_core::config, spool_core::io, etc.). Update all found occurrences.
- **Verify**: `cargo check --workspace`
- **Done When**: All crates compile
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

______________________________________________________________________

## Wave 6

- **Depends On**: Wave 5

### Task 6.1: Remove spool-fs from workspace

- **Files**: spool-rs/Cargo.toml, spool-rs/crates/spool-fs/
- **Dependencies**: None
- **Action**:
  Remove spool-fs from workspace members in root Cargo.toml. Delete spool-rs/crates/spool-fs/ directory.
- **Verify**: `cargo check --workspace`
- **Done When**: Workspace compiles without spool-fs
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

### Task 6.2: Remove temporary re-exports from spool-core

- **Files**: spool-rs/crates/spool-core/src/lib.rs
- **Dependencies**: Task 6.1
- **Action**:
  Remove any temporary re-exports added for backward compatibility. spool-core should only export business logic modules.
- **Verify**: `cargo check --workspace`
- **Done When**: spool-core lib.rs only exports business logic
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

### Task 6.3: Run full test suite

- **Files**: N/A
- **Dependencies**: Task 6.2
- **Action**:
  Run `make check` to verify all tests pass, lints pass, and build succeeds.
- **Verify**: `make check`
- **Done When**: All tests pass, no warnings
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

______________________________________________________________________

## Wave 7

- **Depends On**: Wave 6

### Task 7.1: Review architecture

- **Type**: checkpoint (requires human approval before proceeding)
- **Files**: spool-rs/crates/*/Cargo.toml
- **Dependencies**: None
- **Action**:
  Review the final crate dependency graph. Verify no circular dependencies. Confirm layering matches design (common -> config -> domain -> core -> cli).
- **Done When**: Human confirms architecture is correct
- **Updated At**: 2026-02-05
- **Status**: [ ] pending

______________________________________________________________________

## Task Status Legend

- `[ ] pending` - Not started yet
- `[ ] in-progress` - Currently being worked on
- `[x] complete` - Finished and verified
- `[-] shelved` - Intentionally not-to-be-done (reversible)
