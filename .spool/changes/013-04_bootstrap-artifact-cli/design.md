## Context

Adapters should be minimal and delegate all canonical workflow content to `spool agent instruction` artifacts. A new `bootstrap` artifact provides a tool-specific preamble for OpenCode, Claude Code, and Codex.

## Goals / Non-Goals

- Goals:
  - Provide `spool agent instruction bootstrap --tool <tool>`.
  - Keep output short and stable.
  - Include only tool-delta notes (not full workflows).
- Non-Goals:
  - Generating long workflows in `bootstrap`.

## Rust Style

All Rust implementation for this change follows the `rust-style` skill (for-loops over iterators when reasonable, `let-else` for early returns, explicit matching, minimal comments).

## CLI Contract

Command:

- `spool agent instruction bootstrap --tool opencode|claude|codex`

Output shape requirements:

- Must be plain text suitable for inclusion in a system prompt.
- Must include a short "how to proceed" section pointing to:
  - `spool agent instruction proposal --change <id>`
  - `spool agent instruction specs --change <id>`
  - `spool agent instruction tasks --change <id>`
  - `spool agent instruction apply --change <id>`
  - `spool agent instruction review --change <id>`
  - `spool agent instruction archive --change <id>`

Tool-specific notes:

- `opencode`: mention tool names (Read/Write/Edit/Bash/Glob/Grep/Task) and parallel tool calls.
- `claude`: mention tool routing conventions (Read/Write/Edit/Grep/Glob/Bash/Task).
- `codex`: mention shell-first usage and the bootstrap snippet being always-on.
