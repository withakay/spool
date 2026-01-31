## Context

Claude Code supports loading skills from `.claude/skills/`. The goal is to keep Claude-side assets extremely small and delegate all canonical workflow content to `spool agent instruction` artifacts.

## Goals / Non-Goals

- Goals:
  - Provide a small Claude Code entrypoint that points to `spool agent instruction bootstrap --tool claude`.
  - Avoid hooks unless a fallback is truly needed.
- Non-Goals:
  - Duplicating long workflow docs in `.claude/skills/`.

## Contracts

### CLI Contract

Claude integration assumes:

`spool agent instruction bootstrap --tool claude`

returns a tool-specific preamble that includes how to fetch the rest of the workflows.

### Install Contract

Installer will embed/copy:

- `.claude/skills/spool-workflow.md` (project template)
- Optional shim under `spool-skills/adapters/claude/` (if required)

## Decisions

- Prefer templates (`.claude/skills/`) over hooks.
- Any hook/shim should only print a pointer to the bootstrap artifact.

## Rust Style

If this change requires Rust updates (e.g., template embedding or installer plumbing), follow the `rust-style` skill.
