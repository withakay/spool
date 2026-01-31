## Context

Codex lacks reliable lifecycle hooks. The most durable integration is a static, minimal bootstrap snippet installed into Codex's instructions/prompt layer.

## Goals / Non-Goals

- Goals:
  - Keep the Codex bootstrap small.
  - Delegate canonical workflow bodies to `spool agent instruction` artifacts.
- Non-Goals:
  - Maintaining a Node-based runner for skill lookup unless strictly necessary.

## Contracts

### CLI Contract

Codex bootstrap assumes:

`spool agent instruction bootstrap --tool codex`

returns a Codex-friendly preamble that explains how to fetch other instruction artifacts.

### Install Contract

Installer will place the bootstrap snippet into the Codex instructions directory (as defined by the distribution manifest).

**Assumption (pending 013-05 implementation):**
- Source: `spool-rs/crates/spool-templates/assets/default/project/.codex/instructions/spool-skills-bootstrap.md`
- Destination: `~/.codex/instructions/spool-skills-bootstrap.md` (per 013-05 file manifest)

**Current implementation status:**
- The bootstrap file is embedded in the project templates
- The installer currently installs to project root: `project_root/.codex/instructions/spool-skills-bootstrap.md`
- Full home directory installation (to `~/.codex/instructions/`) depends on 013-05
- For now, the file will be available in project templates when `spool init --tools codex` is run

## Rust Style

If this change requires Rust updates (e.g., template embedding or installer plumbing), follow the `rust-style` skill.
