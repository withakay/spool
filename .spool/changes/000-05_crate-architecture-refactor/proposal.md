## Why

The `spool-core` crate has grown to contain configuration, utilities, and business logic mixed together. This makes it difficult to:
1. Avoid importing code you don't need (compile times, dependency hygiene)
2. Reason about what depends on what (no clear layering)
3. Test components in isolation (side effects scattered throughout)

Extracting foundational crates (`spool-common`, `spool-config`) establishes a clear dependency hierarchy and enables trait-based dependency injection for testability.

## What Changes

- **BREAKING**: Create `spool-common` crate with `FileSystem` trait, ID parsing, path utilities, I/O wrappers, and fuzzy matching
- **BREAKING**: Create `spool-config` crate with configuration loading, `SpoolContext` struct, spool directory resolution, and UI options
- **BREAKING**: Move `discovery` module from `spool-core` to `spool-domain`
- **BREAKING**: Refactor `spool-logging` to take `config_dir: Option<PathBuf>` instead of `ConfigContext` (making it a leaf crate)
- **BREAKING**: Inline `spool-fs` into `spool-core` (delete the crate, only one use site)
- Introduce `FileSystem` trait for dependency injection (enables mocking filesystem in tests)
- Update all `Cargo.toml` files to reflect new dependency structure

## Capabilities

### New Capabilities

- `spool-common-crate`: Foundational crate containing `FileSystem` trait + `StdFs` implementation, ID parsing (`ChangeId`, `ModuleId`, `SpecId`), canonical path builders, miette-wrapped I/O utilities, and Levenshtein-based fuzzy matching
- `spool-config-crate`: Configuration crate containing `SpoolContext` struct (resolved configuration context), cascading config loading (global, project, spool-dir), spool directory resolution, and UI options (no_color, interactive mode)
- `filesystem-trait`: Trait-based filesystem abstraction enabling dependency injection for testability without a DI container framework

### Modified Capabilities

- `spool-domain`: Absorbs `discovery` module from core, gains dependency on `spool-common`
- `spool-logging`: Becomes a leaf crate by accepting explicit paths instead of `ConfigContext`
- `spool-core`: Reduced to business logic only (workflow, archive, validate, installers, ralph, create, list, show); inlines `spool-fs` marker-update logic

## Impact

**Crate structure:**
```
Leaf crates (no spool-* deps):
  spool-common, spool-logging, spool-schemas, spool-templates, spool-harness, spool-models

Mid-tier:
  spool-config -> spool-common
  spool-domain -> spool-common, spool-schemas

Upper:
  spool-core -> spool-config, spool-domain, spool-templates, spool-harness

Top:
  spool-cli, spool-web
```

**Breaking changes:**
- All crates importing from `spool_core::{config, io, paths, id, match_, discovery, output, spool_dir}` must update imports
- `spool-fs` crate removed entirely
- `Logger::new()` signature changes

**Migration:**
- `spool_core::config::*` -> `spool_config::*`
- `spool_core::io::*` -> `spool_common::io::*`
- `spool_core::paths::*` -> `spool_common::paths::*`
- `spool_core::id::*` -> `spool_common::id::*`
- `spool_core::match_::*` -> `spool_common::match_::*`
- `spool_core::discovery::*` -> `spool_domain::discovery::*`
- `spool_core::output::*` -> `spool_config::output::*`
- `spool_core::spool_dir::*` -> `spool_config::spool_dir::*`
- `spool_fs::*` -> `spool_core::installers::markers::*` (or similar)
