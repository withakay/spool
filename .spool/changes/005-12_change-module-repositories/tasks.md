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
- [x] Implement `ModuleRepository::get()`
- [x] Implement `ModuleRepository::list()`
- [x] Implement `ModuleRepository::exists()`
- [x] Add unit tests for ModuleRepository

## Phase 2: CLI Migration

### list.rs
- [x] Migrate change listing to use `ChangeRepository::list()`
- [x] Migrate module listing to use `ModuleRepository::list()`
- [x] Remove direct path construction and file reads

### status.rs
- [ ] Migrate to use `ChangeRepository::get()`
- [ ] Use `Change` domain model for status display

### validate.rs
- [ ] Migrate to use `ChangeRepository::list()` for iteration
- [ ] Use `Change` domain model for validation

### Other commands
- [ ] Audit and migrate `archive.rs`
- [ ] Audit and migrate `show.rs`
- [ ] Audit and migrate `instructions.rs`
- [ ] Audit and migrate `common.rs`

## Phase 3: Cleanup

- [ ] Remove duplicated loading logic from CLI commands
- [ ] Review and potentially deprecate low-level path helpers
- [ ] Update documentation

## Validation

- [x] All existing tests pass
- [x] `spool list` works correctly with new repositories
- [x] `spool list --modules` works correctly
- [ ] `spool status --change <id>` works correctly
- [x] Performance is acceptable (no regression)
