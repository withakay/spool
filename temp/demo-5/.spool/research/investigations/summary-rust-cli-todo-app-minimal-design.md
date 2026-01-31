# Research Summary: Rust CLI todo app minimal design

Generated: 2026-01-20

## Key Findings

- Keep CLI minimal: add/list/done/rm with a single local data file.
- Text storage avoids extra dependencies while staying transparent.

## Stack Recommendations

- **Recommended**: clap derive - quick subcommands and help output.
- **Alternatives**: std::env for zero deps but more manual parsing.

## Feature Prioritization

### Table Stakes (Must Have)

- `todo add <text>`
- `todo list`
- `todo done <id>`
- `todo rm <id>`

### Differentiators (Competitive Advantage)

- None for this demo; focus on validating Spool workflow.

## Architecture Considerations

- Store tasks in `temp/demo-5/.data/tasks.txt` for a project-local demo.
- Use line format `id|0|text` where 0/1 indicates done.
- Split into `core`, `storage`, and `cli` modules.

## Pitfalls to Avoid

- IDs drifting after deletes → compute next ID as max+1.
- Partial writes → write temp file then rename.

## Implications for Roadmap

- Phase 1 should focus on: CLI scaffold, core model, storage helpers.
- Ordering considerations: core model before storage, storage before CLI wiring.
- Requires investigation before: optional JSON format or concurrency handling.

## References

- Rust std::fs rename docs
