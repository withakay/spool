<p align="center">
  <a href="https://github.com/withakay/Projector">
    <picture>
      <source srcset="assets/projector_pixel_dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="assets/projector_pixel_light.svg" media="(prefers-color-scheme: light)">
      <img src="assets/projector_pixel_light.svg" alt="Projector logo" height="64">
    </picture>
  </a>
</p>

<p align="center">Project-centric spec + workflow system for long-running AI coding work.</p>

<p align="center">
  <a href="https://github.com/withakay/Projector/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/withakay/Projector/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://www.npmjs.com/package/@withakay/projector"><img alt="npm version" src="https://img.shields.io/npm/v/@withakay/projector?style=flat-square" /></a>
  <a href="https://nodejs.org/"><img alt="node version" src="https://img.shields.io/node/v/@withakay/projector?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
</p>

# Projector

Projector is a fork of **OpenSpec** that adds project-centric planning and an emphasis on **long-running, multi-agent tasks**.

It’s designed for the reality of AI-assisted development where work spans multiple sessions, needs explicit verification criteria, and benefits from parallel subagents. The approach draws inspiration from Kiro, Beads, Loom, and GSD-style execution.

## What You Get

- Project planning foundation: `PROJECT.md`, `ROADMAP.md`, `STATE.md` templates
- Research phase: parallel domain investigation + synthesis (`research/*`)
- Enhanced tasks format: waves, verification criteria, completion tracking (`tasks.md`)
- Agent configuration: per-tool models + context budgets (`config.yaml`)
- Workflow orchestration: YAML workflows with waves + checkpoints, plus execution status tracking
- Unified “research” and “adversarial review” workflows available as slash commands in supported tools

## Quick Start

### Prerequisites

- Node.js >= 20.19.0

### Install

```bash
npm install -g @withakay/projector@latest
projector --version
```

### Initialize In A Repo

```bash
projector init
```

This creates Projector’s working directory (default: `.projector/`) and installs tool-specific slash commands where supported.

Note: older docs (and some templates) may refer to `projector/` as the working directory. In this fork, the default is `.projector/`.

## On-Disk Layout

After `projector init`, you’ll typically have:

```text
.projector/
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
  config.yaml
```

## Core Workflows

### 1) Project Planning (`projector plan`)

Project planning lives in `.projector/planning/` and is intended to survive across sessions.

```bash
projector plan init
projector plan status
projector state show
```

- `PROJECT.md`: project vision, constraints, conventions
- `ROADMAP.md`: phases/milestones
- `STATE.md`: current focus, decisions, blockers, session notes

### 2) Research Phase (`/projector … research`)

Research is meant to happen *before* proposing changes, especially when you’re entering an unfamiliar domain.

The built-in research workflow runs in parallel:

- stack analysis
- feature landscape
- architecture
- pitfalls

…and then synthesizes results into `.projector/research/SUMMARY.md`.

### 3) Change Execution With Enhanced Tasks (`projector tasks`)

Projector supports an “enhanced tasks.md” format that is optimized for long-running work:

- waves (grouping and parallelizable chunks)
- explicit `Verify` commands
- `Done When` acceptance criteria
- task status tracking (pending / in-progress / complete)

```bash
projector tasks init <change-id>
projector tasks status <change-id>
projector tasks start <change-id> <task-id>
projector tasks complete <change-id> <task-id>
projector tasks next <change-id>
```

### 4) Adversarial Review (`/projector … review`)

Adversarial review is multi-perspective by default:

- security review (vulnerabilities, attack vectors)
- scale review (perf bottlenecks)
- edge case review (failure modes, boundaries)

Outputs are written into the change folder under `reviews/`.

### 5) Workflow Orchestration (`projector workflow`)

Workflows are YAML files with waves, tasks, and optional checkpoints.

```bash
projector workflow init
projector workflow list
projector workflow show research
projector workflow run research --tool opencode -v topic="your topic"
projector workflow status research
```

This generates tool-specific execution instructions (OpenCode / Claude Code / Codex) and tracks progress in `.projector/workflows/.state/`.

## Agent Configuration (`projector agent-config`)

Projector can generate and manage `.projector/config.yaml` for per-tool model selection and context budgets.

```bash
projector agent-config init
projector agent-config summary
projector agent-config get tools.opencode.default_model
projector agent-config set agents.review.model_preference powerful
```

## Slash Commands (Where Supported)

Projector installs slash commands for tools that support them.

- Claude Code (namespace style): `/projector:proposal`, `/projector:apply`, `/projector:archive`, `/projector:research`, `/projector:review`
- OpenCode / Codex (hyphen style): `/projector-proposal`, `/projector-apply`, `/projector-archive`, `/projector-research`, `/projector-review`

Exact availability depends on which tools you selected during `projector init`.

## Command Reference (Common)

```bash
projector init
projector update
projector list
projector list --specs
projector show <change-or-spec>
projector validate [item]
projector archive <change-id> -y
```

## Test Plan

- [ ] Run `projector init` and verify `.projector/planning/` + `.projector/research/` templates exist
- [ ] Run `projector workflow init` and verify `.projector/workflows/*.yaml` are created
- [ ] Verify research and review slash commands are available in at least one supported tool
- [ ] Run `pnpm run build` (or `npm run build`) to verify TypeScript compilation

## Contributing

```bash
pnpm install
pnpm run build
pnpm test
```

## License

MIT
