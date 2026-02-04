# Spool Text Sources Audit (spool-rs only)

This report inventories where Spool's agent-facing (or agent-consumed) text lives, and where repository-installed text lives, **restricted to `spool-rs/*`**.

Out of scope (by request): any directories outside `spool-rs/`.

Excluded (by request): error messages and generic CLI help output.

## 1) Text Spool Installs Into Repositories

The canonical source-of-truth for installed text (templates, skills, commands, adapters) is the **embedded assets** owned by `spool-rs/crates/spool-templates/`.

### 1.1 Embedded Project/Home Templates (repo files)

Source (embedded):

- `spool-rs/crates/spool-templates/assets/default/project/`
- `spool-rs/crates/spool-templates/assets/default/home/` (currently may be empty/unused)

What these include (examples visible in-tree):

- Project root docs: `spool-rs/crates/spool-templates/assets/default/project/AGENTS.md`
- Tool-specific root doc(s): `spool-rs/crates/spool-templates/assets/default/project/CLAUDE.md`
- Spool project docs and state:
  - `spool-rs/crates/spool-templates/assets/default/project/.spool/AGENTS.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.spool/project.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.spool/config.json`
  - `spool-rs/crates/spool-templates/assets/default/project/.spool/user-guidance.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.spool/planning/STATE.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.spool/planning/ROADMAP.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.spool/planning/PROJECT.md`
  - `spool-rs/crates/spool-templates/assets/default/project/.spool/commands/*.md`

Installation behavior (where it is wired up):

- Asset embedding and path rewriting:
  - `spool-rs/crates/spool-templates/src/lib.rs`
    - Embeds `assets/default/project`, `assets/default/home`
    - Rewrites literal `.spool/` paths when the configured spool directory name differs
    - Supports marker-managed blocks (`<!-- SPOOL:START -->` / `<!-- SPOOL:END -->`)
- Installer that writes/updates files:
  - `spool-rs/crates/spool-core/src/installers/mod.rs`
    - Copies embedded project files into the target repo root
    - For marker-managed files, updates only the managed block
    - For init, refuses to overwrite non-marker files unless `--force`
    - Adds a `.gitignore` entry for `{spool_dir}/session.json` on init

### 1.2 Skills (installed to tool skill directories)

Source (embedded):

- `spool-rs/crates/spool-templates/assets/skills/`

What these are:

- Markdown skills (typically `SKILL.md`, plus supporting markdown/scripts in subfolders)
- Includes both general development skills and Spool workflow skills

Installation behavior (where it is wired up):

- Embed accessors:
  - `spool-rs/crates/spool-templates/src/lib.rs` (`skills_files()`, `get_skill_file()`)
- Manifest + install targets per tool:
  - `spool-rs/crates/spool-core/src/distribution.rs`
    - Installs to:
      - OpenCode: `.opencode/skills/<name>/...` (with `spool-` prefix unless already `spool...`)
      - Claude Code: `.claude/skills/<name>/...` (same prefix rule)
      - Codex: `.codex/skills/<name>/...` (same prefix rule)
      - GitHub Copilot: `.github/skills/<name>/...` (same prefix rule)

### 1.3 Commands/Prompts (installed to tool command/prompt directories)

Source (embedded):

- `spool-rs/crates/spool-templates/assets/commands/`

Observed command markdown sources:

- `spool-rs/crates/spool-templates/assets/commands/spool.md`
- `spool-rs/crates/spool-templates/assets/commands/spool-apply.md`
- `spool-rs/crates/spool-templates/assets/commands/spool-proposal.md`
- `spool-rs/crates/spool-templates/assets/commands/spool-review.md`
- `spool-rs/crates/spool-templates/assets/commands/spool-archive.md`
- `spool-rs/crates/spool-templates/assets/commands/spool-research.md`

Installation behavior (where it is wired up):

- Embed accessors:
  - `spool-rs/crates/spool-templates/src/lib.rs` (`commands_files()`, `get_command_file()`)
- Manifest + install targets per tool:
  - `spool-rs/crates/spool-core/src/distribution.rs`
    - OpenCode: `.opencode/commands/<same filename>`
    - Claude Code: `.claude/commands/<same filename>`
    - Codex: `.codex/prompts/<same filename>`
    - GitHub Copilot: `.github/prompts/<same name>.prompt.md` (converts `.md` -> `.prompt.md`)

### 1.4 Adapters / Bootstrap Files

Source (embedded):

- `spool-rs/crates/spool-templates/assets/adapters/`

Observed adapter files:

- `spool-rs/crates/spool-templates/assets/adapters/opencode/spool-skills.js`
- `spool-rs/crates/spool-templates/assets/adapters/claude/session-start.sh`
- `spool-rs/crates/spool-templates/assets/adapters/codex/spool-skills-bootstrap.md`

Installation behavior (where it is wired up):

- `spool-rs/crates/spool-core/src/distribution.rs`
  - OpenCode: installs plugin to `.opencode/plugins/spool-skills.js`
  - Claude Code: installs bootstrap to `.claude/session-start.sh`
  - Codex: installs bootstrap to `.codex/instructions/spool-skills-bootstrap.md`

## 2) Text Produced for Agents ("spool agent instruction …")

This section covers text emitted by commands that are intended for an agent to read.

### 2.1 "Bootstrap" instruction text

Source:

- `spool-rs/crates/spool-cli/src/app/instructions.rs`

Notes:

- `spool agent instruction bootstrap --tool <opencode|claude|codex>` returns a large, hardcoded markdown instruction block.
- This is agent-facing text generated from Rust string literals (not from embedded markdown files).

### 2.2 Artifact instructions (proposal/specs/tasks/apply/review/archive/etc)

Primary output assembly:

- `spool-rs/crates/spool-cli/src/app/instructions.rs`
  - Prints structured, agent-consumable output (includes tags like `<artifact>`, `<context>`, `<template>`, etc. for non-apply artifacts)
  - For `apply`, prints a markdown-ish sectioned output (Context Files, Task Tracking, Testing Policy, Tasks, Instruction)
  - Injects "User Guidance" content when present

Where the underlying artifact text comes from (within `spool-rs/` code paths):

- Workflow resolution and apply instruction generation:
  - `spool-rs/crates/spool-core/src/workflow/mod.rs`
    - Loads workflow schema definitions (YAML) and artifact templates (markdown)
    - Returns:
      - `InstructionsResponse` (description, instruction, template, dependency list, output path)
      - `ApplyInstructionsResponse` (context files, task list, instruction strings)
- Instruction templates (minijinja, embedded):
  - `spool-rs/crates/spool-templates/src/instructions.rs`
  - `spool-rs/crates/spool-templates/assets/instructions/` (e.g. `*.md.j2`)
  - `spool-rs/crates/spool-templates/assets/instructions/README.md`

User guidance injection:

- Reads `.spool/user-guidance.md` and emits the portion after the SPOOL managed block:
  - `spool-rs/crates/spool-core/src/workflow/mod.rs` (`load_user_guidance`)
  - Consumed by: `spool-rs/crates/spool-cli/src/app/instructions.rs`

Testing policy text (agent-facing):

- Derived from project config and printed as part of agent instructions:
  - `spool-rs/crates/spool-cli/src/app/instructions.rs` (`load_testing_policy`, `print_testing_policy_xml`, `print_apply_instructions_text`)

## 3) Schemas (data formats that drive text)

Even when not stored as markdown, these schemas define the structure of the text-producing workflows.

### 3.1 Workflow definition/execution "schemas" (Rust serde models)

Source:

- `spool-rs/crates/spool-schemas/src/workflow.rs` (workflow definition model)
- `spool-rs/crates/spool-schemas/src/workflow_state.rs` (execution state model)
- `spool-rs/crates/spool-schemas/src/workflow_plan.rs` (plan model)
- `spool-rs/crates/spool-schemas/src/lib.rs`

Notes:

- These are the canonical structs for YAML/JSON formats consumed/produced by Spool.
- They are not markdown, but they are the "schema" layer governing what text and artifacts exist.

## 4) "Installed output" copies inside `spool-rs/`

Within `spool-rs/` itself, there are checked-in, tool-specific directories containing skills/commands/prompts that mirror what `spool init` installs.

Examples (not exhaustive):

- `spool-rs/.opencode/skills/`
- `spool-rs/.claude/skills/`
- `spool-rs/.github/skills/`
- `spool-rs/.codex/skills/`
- `spool-rs/.claude/commands/`
- `spool-rs/.github/prompts/`

These are useful for development/review, but the source-of-truth for installation content is the embedded assets under:

- `spool-rs/crates/spool-templates/assets/`

## 5) Other markdown docs under `spool-rs/`

These are agent/dev-facing documentation within the `spool-rs` repo itself:

- `spool-rs/AGENTS.md`
- `spool-rs/CLAUDE.md`
- `spool-rs/scripts/README.md`
- `spool-rs/crates/spool-templates/AGENTS.md` (maintainer notes for template sources)
