# Tasks: Task Repository Pattern

## Implementation

- [x] Create `TaskRepository` struct in `spool-workflow/src/tasks/repository.rs`
- [x] Add `TasksParseResult::empty()` method for missing files
- [x] Export `TaskRepository` from `spool-workflow/src/tasks/mod.rs`
- [x] Add `miette` dependency to `spool-workflow/Cargo.toml`

## Migration

- [x] Update `spool-cli/src/app/list.rs` to use `TaskRepository::get_task_counts()`
- [x] Remove `count_tasks_markdown()` from `spool-core/src/list.rs`
- [x] Remove associated test for `count_tasks_markdown()`

## Validation

- [x] Unit tests pass for TaskRepository (checkbox and enhanced formats)
- [x] `spool list` correctly shows "3/4 tasks" for `013-18_cleanup-spool-skills-repo`
- [x] All existing tests pass
