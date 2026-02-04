<p align="center">
  <a href="https://github.com/withakay/Spool">
    <picture>
      <source srcset="assets/logo-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="assets/logo-light.svg" media="(prefers-color-scheme: light)">
      <img src="assets/logo-light.svg" alt="Spool logo" height="64">
    </picture>
  </a>
</p>

<p align="center">Project-centric spec + workflow system for long-running AI coding work.</p>

<p align="center">
  <a href="https://github.com/withakay/Spool/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/withakay/Spool/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
</p>

# Spool

Spool is a Spec Driven development tool that bring project-centric planning and an emphasis on **long-running, multi-agent tasks** to AI coding agents.

It's designed for the type of AI-assisted development where work spans multiple sessions, needs explicit verification criteria, and benefits from parallel subagents. The approach draws inspiration f[...]

## What You Get

- Project planning foundation: `PROJECT.md`, `ROADMAP.md`, `STATE.md` templates
- Research phase: parallel domain investigation + synthesis (`research/*`)
- Enhanced tasks format: waves, verification criteria, completion tracking (`tasks.md`)
- Agent configuration: per-tool models + context budgets (`config.json`)
- Workflow orchestration: YAML workflows with waves + checkpoints, plus execution status tracking
- Unified "research" and "adversarial review" workflows available as slash commands in supported tools
- Spool agent skills installed automatically during init

## Quick Start

### Prerequisites

- Rust toolchain (rustup + cargo)

### Install

**Homebrew (macOS):**

```bash
brew tap withakay/spool
brew install spool
```

**Build from source:**

```bash
make rust-install
spool --version
```

**Prebuilt binary (macOS/Linux):**

```bash
curl -fsSL https://raw.githubusercontent.com/withakay/spool/main/scripts/install.sh | sh
spool --version
```

**npm (optional):**

```bash
npm install -g @withakay/spool
spool --version
```

### Initialize In A Repo

```bash
spool init
```

This creates Spool's working directory (default: `.spool/`), installs Spool agent skills, and generates slash commands for the selected supported tools.

Note: older docs (and some templates) may refer to `spool/` as the working directory. In this fork, the default is `.spool/`, and the directory name can be customized via `spool.json`.

Spool agent skills are installed to `.claude/skills/<skill>/SKILL.md` so supported assistants can load the authoritative instructions.

## On-Disk Layout

After `spool init`, you'll typically have (default layout shown):

```text
.spool/
  AGENTS.md
  project.md
  planning/
    PROJECT.md
    ROADMAP.md
    STATE.md
  research/
    SUMMARY.md
    investigations/
      stack-analysis.md
      feature-landscape.md
      architecture.md
      pitfalls.md
  changes/
    <change-id>/
      proposal.md
      design.md
      tasks.md
      specs/
      reviews/
  workflows/
    research.yaml
    execute.yaml
    review.yaml
    .state/
      <workflow>.json
  commands/
    <prompt-templates>.md
  config.json
```

## Core Workflows

### 1) Project Planning (`spool plan`)

Project planning lives in `.spool/planning/` and is intended to survive across sessions.

```bash
spool plan init
spool plan status
spool state show
```

- `PROJECT.md`: project vision, constraints, conventions
- `ROADMAP.md`: phases/milestones
- `STATE.md`: current focus, decisions, blockers, session notes

### 2) Research Phase (`/spool … research`)

Research is meant to happen *before* proposing changes, especially when you're entering an unfamiliar domain.

The built-in research workflow runs in parallel:

- stack analysis
- feature landscape
- architecture
- pitfalls

…and then synthesizes results into `.spool/research/SUMMARY.md`.

### 3) Change Execution With Enhanced Tasks (`spool tasks`)

Spool supports an "enhanced tasks.md" format that is optimized for long-running work:

- waves (grouping and parallelizable chunks)
- explicit `Verify` commands
- `Done When` acceptance criteria
- task status tracking (pending / in-progress / complete)

Spool also supports a lightweight checkbox-only `tasks.md` format in a compatibility mode:

- `- [ ]` pending
- `- [~]` in-progress (current task)
- `- [x]` complete

```bash
spool tasks init <change-id>
spool tasks status <change-id>
spool tasks start <change-id> <task-id>
spool tasks complete <change-id> <task-id>
spool tasks next <change-id>
```

### 4) Adversarial Review (`/spool … review`)

Adversarial review is multi-perspective by default:

- security review (vulnerabilities, attack vectors)
- scale review (perf bottlenecks)
- edge case review (failure modes, boundaries)

Outputs are written into the change folder under `reviews/`.

### 5) Workflow Orchestration (`spool workflow`)

Workflows are YAML files with waves, tasks, and optional checkpoints.

```bash
spool workflow init
spool workflow list
spool workflow show research
spool workflow run research --tool opencode -v topic="your topic"
spool workflow status research
```

This generates tool-specific execution instructions (OpenCode / Claude Code / Codex) and tracks progress in `.spool/workflows/.state/`.

## Agent Configuration (`spool agent-config`)

Spool can generate and manage `<spool-dir>/config.json` for per-tool model selection and context budgets.

```bash
spool agent-config init
spool agent-config summary
spool agent-config get tools.opencode.default_model
spool agent-config set agents.review.model_preference powerful
```

## Slash Commands (Where Supported)

Spool installs slash commands for tools that support them.

- Claude Code (namespace style): `/spool:proposal`, `/spool:apply`, `/spool:archive`, `/spool:research`, `/spool:review`
- OpenCode / Codex (hyphen style): `/spool-proposal`, `/spool-apply`, `/spool-archive`, `/spool-research`, `/spool-review`

Exact availability depends on which tools you selected during `spool init`.

## Command Reference (Common)

```bash
spool init
spool update
spool list
spool list --specs
spool show <change-or-spec>
spool validate [item]
spool archive <change-id> -y

# Local docs server (requires Caddy)
spool serve start
spool serve status
spool serve stop
```

## Local Docs Server (`spool serve`)

Spool can serve a local, per-project docs browser over HTTP to make reviewing `.spool/` artifacts and project docs easy.

### Prerequisite: Caddy

`spool serve start` requires the external `caddy` binary.

If `caddy` is missing, Spool prints an install hint and exits with code 1.

### What Gets Served

Only these allowlisted roots are exposed:

- `.spool/changes/`, `.spool/specs/`, `.spool/modules/`
- `.spool/planning/` and `.spool/research/` (if present)
- `docs/` and `documents/` (if present)

### Configuration

Configure in `.spool/config.json` under `serve`:

```json
{
  "serve": {
    "bind": "127.0.0.1",
    "port": 9009,
    "token": "optional-only-used-for-non-loopback",
    "caddyBin": "optional-path-to-caddy"
  }
}
```

- Default bind/port: `127.0.0.1:9009`
- If the port is busy, Spool auto-increments to the next available port.
- If `serve.bind` is non-loopback, Spool serves under a tokenized path prefix (`/t/<token>/`) and rejects requests without it.

## Test Plan

- [ ] Run `spool init` and verify `.spool/planning/` + `.spool/research/` templates exist
- [ ] Run `spool workflow init` and verify `.spool/workflows/*.yaml` are created
- [ ] Verify research and review slash commands are available in at least one supported tool
- [ ] Run `make build` to verify the Rust CLI builds

## Pre-commit Hooks (prek)

Spool uses [prek](https://prek.j178.dev/) for pre-commit hooks. prek is a drop-in replacement for pre-commit and runs the same `.pre-commit-config.yaml`.

### Quick Start

```bash
# Run hooks on staged files
prek run

# Run hooks on all files
prek run --all-files

# Install git hooks (runs automatically on commit)
prek install
```

### Already using pre-commit?

prek is fully compatible. Just replace `pre-commit` with `prek` in your workflow and reinstall hooks once:

```bash
prek install -f
```

### What the hooks check

- **Whitespace / line endings**: trailing whitespace, EOF newline, mixed line endings
- **Structured formats**: JSON syntax, YAML syntax + lint
- **Markdown**: linting via markdownlint-cli2
- **Rust**: `cargo fmt` + `cargo clippy` with the repo's lint policy

## Contributing

```bash
make build
make test
make lint
```

## License

MIT
