<p align="center">
  <a href="https://github.com/Fission-AI/Projector">
    <picture>
      <source srcset="assets/projector_pixel_dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="assets/projector_pixel_light.svg" media="(prefers-color-scheme: light)">
      <img src="assets/projector_pixel_light.svg" alt="Projector logo" height="64">
    </picture>
  </a>
  
</p>
<p align="center">Spec-driven development for AI coding assistants.</p>
<p align="center">
  <a href="https://github.com/Fission-AI/Projector/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Fission-AI/Projector/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://www.npmjs.com/package/@fission-ai/projector"><img alt="npm version" src="https://img.shields.io/npm/v/@fission-ai/projector?style=flat-square" /></a>
  <a href="https://nodejs.org/"><img alt="node version" src="https://img.shields.io/node/v/@fission-ai/projector?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
  <a href="https://conventionalcommits.org"><img alt="Conventional Commits" src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square" /></a>
  <a href="https://discord.gg/YctCnvvshC"><img alt="Discord" src="https://img.shields.io/badge/Discord-Join%20the%20community-5865F2?logo=discord&logoColor=white&style=flat-square" /></a>
</p>

<p align="center">
  <img src="assets/projector_dashboard.png" alt="Projector dashboard preview" width="90%">
</p>

<p align="center">
  Follow <a href="https://x.com/0xTab">@0xTab on X</a> for updates · Join the <a href="https://discord.gg/YctCnvvshC">Projector Discord</a> for help and questions.
</p>

<p align="center">
  <sub>🧪 <strong>New:</strong> <a href="docs/experimental-workflow.md">Experimental Workflow (OPSX)</a> — schema-driven, hackable, fluid. Iterate on workflows without code changes.</sub>
</p>

# Projector

Projector aligns humans and AI coding assistants with spec-driven development so you agree on what to build before any code is written. **No API keys required.**

## Why Projector?

AI coding assistants are powerful but unpredictable when requirements live in chat history. Projector adds a lightweight specification workflow that locks intent before implementation, giving you deterministic, reviewable outputs.

Key outcomes:
- Human and AI stakeholders agree on specs before work begins.
- Structured change folders (proposals, tasks, and spec updates) keep scope explicit and auditable.
- Shared visibility into what's proposed, active, or archived.
- Works with the AI tools you already use: custom slash commands where supported, context rules everywhere else.

## How Projector compares (at a glance)

- **Lightweight**: simple workflow, no API keys, minimal setup.
- **Brownfield-first**: works great beyond 0→1. Projector separates the source of truth from proposals: `projector/specs/` (current truth) and `projector/changes/` (proposed updates). This keeps diffs explicit and manageable across features.
- **Change tracking**: proposals, tasks, and spec deltas live together; archiving merges the approved updates back into specs.
- **Compared to spec-kit & Kiro**: those shine for brand-new features (0→1). Projector also excels when modifying existing behavior (1→n), especially when updates span multiple specs.

See the full comparison in [How Projector Compares](#how-projector-compares).

## How It Works

```
┌────────────────────┐
│ Draft Change       │
│ Proposal           │
└────────┬───────────┘
         │ share intent with your AI
         ▼
┌────────────────────┐
│ Review & Align     │
│ (edit specs/tasks) │◀──── feedback loop ──────┐
└────────┬───────────┘                          │
         │ approved plan                        │
         ▼                                      │
┌────────────────────┐                          │
│ Implement Tasks    │──────────────────────────┘
│ (AI writes code)   │
└────────┬───────────┘
         │ ship the change
         ▼
┌────────────────────┐
│ Archive & Update   │
│ Specs (source)     │
└────────────────────┘

1. Draft a change proposal that captures the spec updates you want.
2. Review the proposal with your AI assistant until everyone agrees.
3. Implement tasks that reference the agreed specs.
4. Archive the change to merge the approved updates back into the source-of-truth specs.
```

## Getting Started

### Supported AI Tools

<details>
<summary><strong>Native Slash Commands</strong> (click to expand)</summary>

These tools have built-in Projector commands. Select the Projector integration when prompted.

| Tool | Commands |
|------|----------|
| **Amazon Q Developer** | `@projector-proposal`, `@projector-apply`, `@projector-archive` (`.amazonq/prompts/`) |
| **Antigravity** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.agent/workflows/`) |
| **Auggie (Augment CLI)** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.augment/commands/`) |
| **Claude Code** | `/projector:proposal`, `/projector:apply`, `/projector:archive` |
| **Cline** | Workflows in `.clinerules/workflows/` directory (`.clinerules/workflows/projector-*.md`) |
| **CodeBuddy Code (CLI)** | `/projector:proposal`, `/projector:apply`, `/projector:archive` (`.codebuddy/commands/`) — see [docs](https://www.codebuddy.ai/cli) |
| **Codex** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (global: `~/.codex/prompts`, auto-installed) |
| **Continue** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.continue/prompts/`) |
| **CoStrict** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.cospec/projector/commands/`) — see [docs](https://costrict.ai)|
| **Crush** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.crush/commands/projector/`) |
| **Cursor** | `/projector-proposal`, `/projector-apply`, `/projector-archive` |
| **Factory Droid** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.factory/commands/`) |
| **Gemini CLI** | `/projector:proposal`, `/projector:apply`, `/projector:archive` (`.gemini/commands/projector/`) |
| **GitHub Copilot** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.github/prompts/`) |
| **iFlow (iflow-cli)** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.iflow/commands/`) |
| **Kilo Code** | `/projector-proposal.md`, `/projector-apply.md`, `/projector-archive.md` (`.kilocode/workflows/`) |
| **OpenCode** | `/projector-proposal`, `/projector-apply`, `/projector-archive` |
| **Qoder (CLI)** | `/projector:proposal`, `/projector:apply`, `/projector:archive` (`.qoder/commands/projector/`) — see [docs](https://qoder.com/cli) |
| **Qwen Code** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.qwen/commands/`) |
| **RooCode** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.roo/commands/`) |
| **Windsurf** | `/projector-proposal`, `/projector-apply`, `/projector-archive` (`.windsurf/workflows/`) |

Kilo Code discovers team workflows automatically. Save the generated files under `.kilocode/workflows/` and trigger them from the command palette with `/projector-proposal.md`, `/projector-apply.md`, or `/projector-archive.md`.

</details>

<details>
<summary><strong>AGENTS.md Compatible</strong> (click to expand)</summary>

These tools automatically read workflow instructions from `projector/AGENTS.md`. Ask them to follow the Projector workflow if they need a reminder. Learn more about the [AGENTS.md convention](https://agents.md/).

| Tools |
|-------|
| Amp • Jules • Others |

</details>

### Install & Initialize

#### Prerequisites
- **Node.js >= 20.19.0** - Check your version with `node --version`

#### Step 1: Install the CLI globally

```bash
npm install -g @fission-ai/projector@latest
```

Verify installation:
```bash
projector --version
```

#### Step 2: Initialize Projector in your project

Navigate to your project directory:
```bash
cd my-project
```

Run the initialization:
```bash
projector init
```

**What happens during initialization:**
- You'll be prompted to pick any natively supported AI tools (Claude Code, CodeBuddy, Cursor, OpenCode, Qoder,etc.); other assistants always rely on the shared `AGENTS.md` stub
- Projector automatically configures slash commands for the tools you choose and always writes a managed `AGENTS.md` hand-off at the project root
- A new `projector/` directory structure is created in your project

**After setup:**
- Primary AI tools can trigger `/projector` workflows without additional configuration
- Run `projector list` to verify the setup and view any active changes
- If your coding assistant doesn't surface the new slash commands right away, restart it. Slash commands are loaded at startup,
  so a fresh launch ensures they appear

### Optional: Populate Project Context

After `projector init` completes, you'll receive a suggested prompt to help populate your project context:

```text
Populate your project context:
"Please read projector/project.md and help me fill it out with details about my project, tech stack, and conventions"
```

Use `projector/project.md` to define project-level conventions, standards, architectural patterns, and other guidelines that should be followed across all changes.

### Create Your First Change

Here's a real example showing the complete Projector workflow. This works with any AI tool. Those with native slash commands will recognize the shortcuts automatically.

#### 1. Draft the Proposal
Start by asking your AI to create a change proposal:

```text
You: Create an Projector change proposal for adding profile search filters by role and team
     (Shortcut for tools with slash commands: /projector:proposal Add profile search filters)

AI:  I'll create an Projector change proposal for profile filters.
     *Scaffolds projector/changes/add-profile-filters/ with proposal.md, tasks.md, spec deltas.*
```

#### 2. Verify & Review
Check that the change was created correctly and review the proposal:

```bash
$ projector list                             # Confirm the change folder exists
$ projector validate add-profile-filters     # Validate spec formatting
$ projector show add-profile-filters         # Review proposal, tasks, and spec delta
```

#### 3. Refine the Specs
Iterate on the specifications until they match your needs:

```text
You: Can you add acceptance criteria for the role and team filters?

AI:  I'll update the spec delta with scenarios for role and team filters.
     *Edits projector/changes/add-profile-filters/specs/profile/spec.md and tasks.md.*
```

#### 4. Implement the Change
Once specs look good, start implementation:

```text
You: The specs look good. Let's implement this change.
     (Shortcut for tools with slash commands: /projector:apply add-profile-filters)

AI:  I'll work through the tasks in the add-profile-filters change.
     *Implements tasks from projector/changes/add-profile-filters/tasks.md*
     *Marks tasks complete: Task 1.1 ✓, Task 1.2 ✓, Task 2.1 ✓...*
```

#### 5. Archive the Completed Change
After implementation is complete, archive the change:

```text
AI:  All tasks are complete. The implementation is ready.

You: Please archive the change
     (Shortcut for tools with slash commands: /projector:archive add-profile-filters)

AI:  I'll archive the add-profile-filters change.
    *Runs: projector archive add-profile-filters --yes*
     ✓ Change archived successfully. Specs updated. Ready for the next feature!
```

Or run the command yourself in terminal:
```bash
$ projector archive add-profile-filters --yes  # Archive the completed change without prompts
```

**Note:** Tools with native slash commands (Claude Code, CodeBuddy, Cursor, Codex, Qoder, RooCode) can use the shortcuts shown. All other tools work with natural language requests to "create an Projector proposal", "apply the Projector change", or "archive the change".

## Command Reference

```bash
projector list               # View active change folders
projector view               # Interactive dashboard of specs and changes
projector show <change>      # Display change details (proposal, tasks, spec updates)
projector validate <change>  # Check spec formatting and structure
projector archive <change> [--yes|-y]   # Move a completed change into archive/ (non-interactive with --yes)
```

## Example: How AI Creates Projector Files

When you ask your AI assistant to "add two-factor authentication", it creates:

```
projector/
├── specs/
│   └── auth/
│       └── spec.md           # Current auth spec (if exists)
└── changes/
    └── add-2fa/              # AI creates this entire structure
        ├── proposal.md       # Why and what changes
        ├── tasks.md          # Implementation checklist
        ├── design.md         # Technical decisions (optional)
        └── specs/
            └── auth/
                └── spec.md   # Delta showing additions
```

### AI-Generated Spec (created in `projector/specs/auth/spec.md`):

```markdown
# Auth Specification

## Purpose
Authentication and session management.

## Requirements
### Requirement: User Authentication
The system SHALL issue a JWT on successful login.

#### Scenario: Valid credentials
- WHEN a user submits valid credentials
- THEN a JWT is returned
```

### AI-Generated Change Delta (created in `projector/changes/add-2fa/specs/auth/spec.md`):

```markdown
# Delta for Auth

## ADDED Requirements
### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

#### Scenario: OTP required
- WHEN a user submits valid credentials
- THEN an OTP challenge is required
```

### AI-Generated Tasks (created in `projector/changes/add-2fa/tasks.md`):

```markdown
## 1. Database Setup
- [ ] 1.1 Add OTP secret column to users table
- [ ] 1.2 Create OTP verification logs table

## 2. Backend Implementation  
- [ ] 2.1 Add OTP generation endpoint
- [ ] 2.2 Modify login flow to require OTP
- [ ] 2.3 Add OTP verification endpoint

## 3. Frontend Updates
- [ ] 3.1 Create OTP input component
- [ ] 3.2 Update login flow UI
```

**Important:** You don't create these files manually. Your AI assistant generates them based on your requirements and the existing codebase.

## Understanding Projector Files

### Delta Format

Deltas are "patches" that show how specs change:

- **`## ADDED Requirements`** - New capabilities
- **`## MODIFIED Requirements`** - Changed behavior (include complete updated text)
- **`## REMOVED Requirements`** - Deprecated features

**Format requirements:**
- Use `### Requirement: <name>` for headers
- Every requirement needs at least one `#### Scenario:` block
- Use SHALL/MUST in requirement text

## How Projector Compares

### vs. spec-kit
Projector’s two-folder model (`projector/specs/` for the current truth, `projector/changes/` for proposed updates) keeps state and diffs separate. This scales when you modify existing features or touch multiple specs. spec-kit is strong for greenfield/0→1 but provides less structure for cross-spec updates and evolving features.

### vs. Kiro.dev
Projector groups every change for a feature in one folder (`projector/changes/feature-name/`), making it easy to track related specs, tasks, and designs together. Kiro spreads updates across multiple spec folders, which can make feature tracking harder.

### vs. No Specs
Without specs, AI coding assistants generate code from vague prompts, often missing requirements or adding unwanted features. Projector brings predictability by agreeing on the desired behavior before any code is written.

## Team Adoption

1. **Initialize Projector** – Run `projector init` in your repo.
2. **Start with new features** – Ask your AI to capture upcoming work as change proposals.
3. **Grow incrementally** – Each change archives into living specs that document your system.
4. **Stay flexible** – Different teammates can use Claude Code, CodeBuddy, Cursor, or any AGENTS.md-compatible tool while sharing the same specs.

Run `projector update` whenever someone switches tools so your agents pick up the latest instructions and slash-command bindings.

## Updating Projector

1. **Upgrade the package**
   ```bash
   npm install -g @fission-ai/projector@latest
   ```
2. **Refresh agent instructions**
   - Run `projector update` inside each project to regenerate AI guidance and ensure the latest slash commands are active.

## Experimental Features

<details>
<summary><strong>🧪 OPSX: Fluid, Iterative Workflow</strong> (Claude Code only)</summary>

**Why this exists:**
- Standard workflow is locked down — you can't tweak instructions or customize
- When AI output is bad, you can't improve the prompts yourself
- Same workflow for everyone, no way to match how your team works

**What's different:**
- **Hackable** — edit templates and schemas yourself, test immediately, no rebuild
- **Granular** — each artifact has its own instructions, test and tweak individually
- **Customizable** — define your own workflows, artifacts, and dependencies
- **Fluid** — no phase gates, update any artifact anytime

```
You can always go back:

  proposal ──→ specs ──→ design ──→ tasks ──→ implement
     ▲           ▲          ▲                    │
     └───────────┴──────────┴────────────────────┘
```

| Command | What it does |
|---------|--------------|
| `/opsx:new` | Start a new change |
| `/opsx:continue` | Create the next artifact (based on what's ready) |
| `/opsx:ff` | Fast-forward (all planning artifacts at once) |
| `/opsx:apply` | Implement tasks, updating artifacts as needed |
| `/opsx:archive` | Archive when done |

**Setup:** `projector artifact-experimental-setup`

[Full documentation →](docs/experimental-workflow.md)

</details>

<details>
<summary><strong>Telemetry</strong> – Projector collects anonymous usage stats (opt-out: <code>PROJECTOR_TELEMETRY=0</code>)</summary>

We collect only command names and version to understand usage patterns. No arguments, paths, content, or PII. Automatically disabled in CI.

**Opt-out:** `export PROJECTOR_TELEMETRY=0` or `export DO_NOT_TRACK=1`

</details>

## Contributing

- Install dependencies: `pnpm install`
- Build: `pnpm run build`
- Test: `pnpm test`
- Develop CLI locally: `pnpm run dev` or `pnpm run dev:cli`
- Conventional commits (one-line): `type(scope): subject`

## License

MIT
