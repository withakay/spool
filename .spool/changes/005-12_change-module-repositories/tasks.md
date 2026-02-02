# Tasks: Change and Module Repository Pattern

## Phase 1: Core Implementation

### Domain Models
- [x] Create `spool-workflow/src/changes/mod.rs` with `Change`, `ChangeSummary`, `ChangeStatus`
- [x] Create `spool-workflow/src/modules/mod.rs` with `Module`, `ModuleSummary`
- [x] Add module exports to `spool-workflow/src/lib.rs`

### ChangeRepository
- [x] Create `spool-workflow/src/changes/repository.rs`
- [x] Implement `ChangeRepository::new()`
- [x] Implement `ChangeRepository::get()` - load full change with artifacts
- [x] Implement `ChangeRepository::list()` - list all changes as summaries
- [x] Implement `ChangeRepository::list_by_module()`
- [x] Implement `ChangeRepository::list_incomplete()`
- [x] Implement `ChangeRepository::exists()`
- [x] Integrate with `TaskRepository` for task loading
- [x] Add unit tests for ChangeRepository

### ModuleRepository
- [x] Create `spool-workflow/src/modules/repository.rs`
- [x] Implement `ModuleRepository::new()`
- [x] Implement `ModuleRepository::get()` - supports both ID and full name
- [x] Implement `ModuleRepository::list()`
- [x] Implement `ModuleRepository::exists()`
- [x] Add unit tests for ModuleRepository

## Phase 2: CLI Migration

### list.rs
- [x] Migrate change listing to use `ChangeRepository::list()`
- [x] Migrate module listing to use `ModuleRepository::list()`
- [x] Remove direct path construction and file reads

### status.rs
- [x] Migrate to use `ChangeRepository::list()` for available changes
- [x] Use repository for error message suggestions

### validate.rs
- [x] Migrate to use `ChangeRepository::exists()` for change validation

### common.rs
- [x] Migrate `list_change_ids()` to use `ChangeRepository::list()`
- [x] Migrate `detect_item_type()` to use `ChangeRepository::exists()`
- [x] Remove unused `list_change_ids_from_index()` function

### archive.rs
- [x] Migrate to use `ChangeRepository::list()` for available changes
- [x] Migrate to use `ChangeRepository::exists()` for validation
- [x] Migrate to use `TaskRepository::get_task_counts()` for completion check

### show.rs
- [x] Migrate to use `ChangeRepository::exists()` for change validation
- [x] Migrate to use `ModuleRepository::get()` for module lookup

### instructions.rs
- [x] Add `ChangeRepository::list()` for available changes in error messages

## Phase 3: Cleanup

- [x] Remove duplicated loading logic from CLI commands
- [x] Update AGENTS.md with repository pattern documentation
- [x] All tests pass including edge cases (module ID vs full name)

## Validation

- [x] All existing tests pass
- [x] `spool list` works correctly with new repositories
- [x] `spool list --modules` works correctly
- [x] `spool status --change <id>` works correctly
- [x] `spool validate change <id>` works correctly
- [x] `spool show module <id>` works with both ID and full name
- [x] `spool archive` shows available changes
- [x] `make check` passes (fmt, clippy, tests, coverage)
- [x] Performance is acceptable (no regression)
