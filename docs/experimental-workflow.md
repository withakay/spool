# Experimental Workflow (OPSX)

> **Status:** Experimental. Things might break. Feedback welcome on [Discord](https://discord.gg/BYjPaKbqMt).
>
> **Compatibility:** Claude Code slash commands; skills work anywhere Agent Skills is supported

## What Is It?

OPSX is a **fluid, iterative workflow** for Spool changes. No more rigid phases — just actions you can take anytime.

## Why This Exists

The standard Spool workflow works, but it's **locked down**:

- **Instructions are hardcoded** — buried in TypeScript, you can't change them
- **All-or-nothing** — one big command creates everything, can't test individual pieces
- **Fixed structure** — same workflow for everyone, no customization
- **Black box** — when AI output is bad, you can't tweak the prompts

**OPSX opens it up.** Now anyone can:

1. **Experiment with instructions** — edit a template, see if the AI does better
2. **Test granularly** — validate each artifact's instructions independently
3. **Customize workflows** — define your own artifacts and dependencies
4. **Iterate quickly** — change a template, test immediately, no rebuild

```
Standard workflow:                    OPSX:
┌────────────────────────┐           ┌────────────────────────┐
│  Hardcoded in package  │           │  schema.yaml           │◄── You edit this
│  (can't change)        │           │  templates/*.md        │◄── Or this
│        ↓               │           │        ↓               │
│  Wait for new release  │           │  Instant effect        │
│        ↓               │           │        ↓               │
│  Hope it's better      │           │  Test it yourself      │
└────────────────────────┘           └────────────────────────┘
```

**This is for everyone:**
- **Teams** — create workflows that match how you actually work
- **Power users** — tweak prompts to get better AI outputs for your codebase
- **Spool contributors** — experiment with new approaches without releases

We're all still learning what works best. OPSX lets us learn together.

## The User Experience

**The problem with linear workflows:**
You're "in planning phase", then "in implementation phase", then "done". But real work doesn't work that way. You implement something, realize your design was wrong, need to update specs, continue implementing. Linear phases fight against how work actually happens.

**OPSX approach:**
- **Actions, not phases** — create, implement, update, archive — do any of them anytime
- **Dependencies are enablers** — they show what's possible, not what's required next
- **Update as you learn** — halfway through implementation? Go back and fix the design. That's normal.

```
You can always go back:

     ┌────────────────────────────────────┐
     │                                    │
     ▼                                    │
  proposal ──→ specs ──→ design ──→ tasks ──→ implement
     ▲           ▲          ▲               │
     │           │          │               │
     └───────────┴──────────┴───────────────┘
              update as you learn
```

## Setup

```bash
# 1. Make sure you have spool installed and initialized
spool init

# 2. Generate the experimental skills
spool artifact-experimental-setup
```

This creates skills in `.claude/skills/` that Claude Code auto-detects.

## Commands

| Command | What it does |
|---------|--------------|
| `/spool-explore` | Think through ideas, investigate problems, clarify requirements |
| `/spool-new-change` | Start a new change |
| `/spool-continue-change` | Create the next artifact (based on what's ready) |
| `/spool-ff-change` | Fast-forward — create all planning artifacts at once |
| `/spool-apply-change` | Implement tasks, updating artifacts as needed |
| `/spool-sync-specs` | Sync delta specs to main specs |
| `/spool-archive-change` | Archive when done |

## Usage

### Explore an idea
```
/spool-explore
```
Think through ideas, investigate problems, compare options. No structure required - just a thinking partner. When insights crystallize, transition to `/spool-new-change` or `/spool-ff-change`.

### Start a new change
```
/spool-new-change
```
You'll be asked what you want to build and which workflow schema to use.

### Create artifacts
```
/spool-continue-change
```
Shows what's ready to create based on dependencies, then creates one artifact. Use repeatedly to build up your change incrementally.

```
/spool-ff-change add-dark-mode
```
Creates all planning artifacts at once. Use when you have a clear picture of what you're building.

### Implement (the fluid part)
```
/spool-apply-change
```
Works through tasks, checking them off as you go. **Key difference:** if you discover issues during implementation, you can update your specs, design, or tasks — then continue. No phase gates.

### Finish up
```
/spool-sync-specs      # Update main specs with your delta specs
/spool-archive-change  # Move to archive when done
```

## When to Update vs. Start Fresh

OPSX lets you update artifacts anytime. But when does "update as you learn" become "this is different work"?

### What a Proposal Captures

A proposal defines three things:
1. **Intent** — What problem are you solving?
2. **Scope** — What's in/out of bounds?
3. **Approach** — How will you solve it?

The question is: which changed, and by how much?

### Update the Existing Change When:

**Same intent, refined execution**
- You discover edge cases you didn't consider
- The approach needs tweaking but the goal is unchanged
- Implementation reveals the design was slightly off

**Scope narrows**
- You realize full scope is too big, want to ship MVP first
- "Add dark mode" → "Add dark mode toggle (system preference in v2)"

**Learning-driven corrections**
- Codebase isn't structured how you thought
- A dependency doesn't work as expected
- "Use CSS variables" → "Use Tailwind's dark: prefix instead"

### Start a New Change When:

**Intent fundamentally changed**
- The problem itself is different now
- "Add dark mode" → "Add comprehensive theme system with custom colors, fonts, spacing"

**Scope exploded**
- Change grew so much it's essentially different work
- Original proposal would be unrecognizable after updates
- "Fix login bug" → "Rewrite auth system"

**Original is completable**
- The original change can be marked "done"
- New work stands alone, not a refinement
- Complete "Add dark mode MVP" → Archive → New change "Enhance dark mode"

### The Heuristics

```
                        ┌─────────────────────────────────────┐
                        │     Is this the same work?          │
                        └──────────────┬──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
             Same intent?      >50% overlap?      Can original
             Same problem?     Same scope?        be "done" without
                    │                  │          these changes?
                    │                  │                  │
          ┌────────┴────────┐  ┌──────┴──────┐   ┌───────┴───────┐
          │                 │  │             │   │               │
         YES               NO YES           NO  NO              YES
          │                 │  │             │   │               │
          ▼                 ▼  ▼             ▼   ▼               ▼
       UPDATE            NEW  UPDATE       NEW  UPDATE          NEW
```

| Test | Update | New Change |
|------|--------|------------|
| **Identity** | "Same thing, refined" | "Different work" |
| **Scope overlap** | >50% overlaps | <50% overlaps |
| **Completion** | Can't be "done" without changes | Can finish original, new work stands alone |
| **Story** | Update chain tells coherent story | Patches would confuse more than clarify |

### The Principle

> **Update preserves context. New change provides clarity.**
>
> Choose update when the history of your thinking is valuable.
> Choose new when starting fresh would be clearer than patching.

Think of it like git branches:
- Keep committing while working on the same feature
- Start a new branch when it's genuinely new work
- Sometimes merge a partial feature and start fresh for phase 2

## What's Different?

| | Standard (`/spool:proposal`) | Experimental (`/spool-*`) |
|---|---|---|
| **Structure** | One big proposal document | Discrete artifacts with dependencies |
| **Workflow** | Linear phases: plan → implement → archive | Fluid actions — do anything anytime |
| **Iteration** | Awkward to go back | Update artifacts as you learn |
| **Customization** | Fixed structure | Schema-driven (define your own artifacts) |

**The key insight:** work isn't linear. OPSX stops pretending it is.

## Architecture Deep Dive

This section explains how OPSX works under the hood and how it compares to the standard workflow.

### Philosophy: Phases vs Actions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STANDARD WORKFLOW                                    │
│                    (Phase-Locked, All-or-Nothing)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │
│   │   PLANNING   │ ───► │ IMPLEMENTING │ ───► │   ARCHIVING  │             │
│   │    PHASE     │      │    PHASE     │      │    PHASE     │             │
│   └──────────────┘      └──────────────┘      └──────────────┘             │
│         │                     │                     │                       │
│         ▼                     ▼                     ▼                       │
│   /spool:proposal   /spool:apply      /spool:archive              │
│                                                                             │
│   • Creates ALL artifacts at once                                          │
│   • Can't go back to update specs during implementation                    │
│   • Phase gates enforce linear progression                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                            OPSX WORKFLOW                                     │
│                      (Fluid Actions, Iterative)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│              ┌────────────────────────────────────────────┐                 │
│              │           ACTIONS (not phases)             │                 │
│              │                                            │                 │
│              │   new ◄──► continue ◄──► apply ◄──► sync   │                 │
│              │    │          │           │          │     │                 │
│              │    └──────────┴───────────┴──────────┘     │                 │
│              │              any order                     │                 │
│              └────────────────────────────────────────────┘                 │
│                                                                             │
│   • Create artifacts one at a time OR fast-forward                         │
│   • Update specs/design/tasks during implementation                        │
│   • Dependencies enable progress, phases don't exist                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

**Standard workflow** uses hardcoded templates in TypeScript:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STANDARD WORKFLOW COMPONENTS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Hardcoded Templates (TypeScript strings)                                  │
│                    │                                                        │
│                    ▼                                                        │
│   Configurators (18+ classes, one per editor)                               │
│                    │                                                        │
│                    ▼                                                        │
│   Generated Command Files (.claude/commands/spool/*.md)                  │
│                                                                             │
│   • Fixed structure, no artifact awareness                                  │
│   • Change requires code modification + rebuild                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**OPSX** uses external schemas and a dependency graph engine:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPSX COMPONENTS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Schema Definitions (YAML)                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  name: spec-driven                                                  │   │
│   │  artifacts:                                                         │   │
│   │    - id: proposal                                                   │   │
│   │      generates: proposal.md                                         │   │
│   │      requires: []              ◄── Dependencies                     │   │
│   │    - id: specs                                                      │   │
│   │      generates: specs/**/*.md  ◄── Glob patterns                    │   │
│   │      requires: [proposal]      ◄── Enables after proposal           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Artifact Graph Engine                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Topological sort (dependency ordering)                           │   │
│   │  • State detection (filesystem existence)                           │   │
│   │  • Rich instruction generation (templates + context)                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Skill Files (.claude/skills/spool-*/SKILL.md)                          │
│                                                                             │
│   • Cross-editor compatible (Claude Code, Cursor, Windsurf)                 │
│   • Skills query CLI for structured data                                    │
│   • Fully customizable via schema files                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dependency Graph Model

Artifacts form a directed acyclic graph (DAG). Dependencies are **enablers**, not gates:

```
                              proposal
                             (root node)
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
                 specs                       design
              (requires:                  (requires:
               proposal)                   proposal)
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                               tasks
                           (requires:
                           specs, design)
                                  │
                                  ▼
                          ┌──────────────┐
                          │ APPLY PHASE  │
                          │ (requires:   │
                          │  tasks)      │
                          └──────────────┘
```

**State transitions:**

```
   BLOCKED ────────────────► READY ────────────────► DONE
      │                        │                       │
   Missing                  All deps               File exists
   dependencies             are DONE               on filesystem
```

### Information Flow

**Standard workflow** — agent receives static instructions:

```
  User: "/spool:proposal"
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  Static instructions:                   │
  │  • Create proposal.md                   │
  │  • Create tasks.md                      │
  │  • Create design.md                     │
  │  • Create specs/*.md                    │
  │                                         │
  │  No awareness of what exists or         │
  │  dependencies between artifacts         │
  └─────────────────────────────────────────┘
           │
           ▼
  Agent creates ALL artifacts in one go
```

**OPSX** — agent queries for rich context:

```
  User: "/spool-continue-change"
           │
           ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  Step 1: Query current state                                             │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ spool status --change "add-auth" --json                      │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "artifacts": [                                                  │  │
  │  │      {"id": "proposal", "status": "done"},                         │  │
  │  │      {"id": "specs", "status": "ready"},      ◄── First ready      │  │
  │  │      {"id": "design", "status": "ready"},                          │  │
  │  │      {"id": "tasks", "status": "blocked", "missingDeps": ["specs"]}│  │
  │  │    ]                                                               │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Step 2: Get rich instructions for ready artifact                        │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ spool instructions specs --change "add-auth" --json          │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "template": "# Specification\n\n## ADDED Requirements...",      │  │
  │  │    "dependencies": [{"id": "proposal", "path": "...", "done": true}│  │
  │  │    "unlocks": ["tasks"]                                            │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Step 3: Read dependencies → Create ONE artifact → Show what's unlocked  │
  └──────────────────────────────────────────────────────────────────────────┘
```

### Iteration Model

**Standard workflow** — awkward to iterate:

```
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │/proposal│ ──► │ /apply  │ ──► │/archive │
  └─────────┘     └─────────┘     └─────────┘
       │               │
       │               ├── "Wait, the design is wrong"
       │               │
       │               ├── Options:
       │               │   • Edit files manually (breaks context)
       │               │   • Abandon and start over
       │               │   • Push through and fix later
       │               │
       │               └── No official "go back" mechanism
       │
       └── Creates ALL artifacts at once
```

**OPSX** — natural iteration:

```
  /spool-new-change ───► /spool-continue-change ───► /spool-apply-change ───► /spool-archive-change
      │                │                  │
      │                │                  ├── "The design is wrong"
      │                │                  │
      │                │                  ▼
      │                │            Just edit design.md
      │                │            and continue!
      │                │                  │
      │                │                  ▼
      │                │         /spool-apply-change picks up
      │                │         where you left off
      │                │
      │                └── Creates ONE artifact, shows what's unlocked
      │
      └── Scaffolds change, waits for direction
```

### Custom Schemas

Create your own workflow by adding a schema to `~/.local/share/spool/schemas/`:

```
~/.local/share/spool/schemas/research-first/
├── schema.yaml
└── templates/
    ├── research.md
    ├── proposal.md
    └── tasks.md

schema.yaml:
┌─────────────────────────────────────────────────────────────────┐
│  name: research-first                                           │
│  artifacts:                                                     │
│    - id: research        # Added before proposal                │
│      generates: research.md                                     │
│      requires: []                                               │
│                                                                 │
│    - id: proposal                                               │
│      generates: proposal.md                                     │
│      requires: [research]  # Now depends on research            │
│                                                                 │
│    - id: tasks                                                  │
│      generates: tasks.md                                        │
│      requires: [proposal]                                       │
└─────────────────────────────────────────────────────────────────┘

Dependency Graph:

   research ──► proposal ──► tasks
```

### Summary

| Aspect | Standard | OPSX |
|--------|----------|------|
| **Templates** | Hardcoded TypeScript | External YAML + Markdown |
| **Dependencies** | None (all at once) | DAG with topological sort |
| **State** | Phase-based mental model | Filesystem existence |
| **Customization** | Edit source, rebuild | Create schema.yaml |
| **Iteration** | Phase-locked | Fluid, edit anything |
| **Editor Support** | 18+ configurator classes | Single skills directory |

## Schemas

Schemas define what artifacts exist and their dependencies. Currently available:

- **spec-driven** (default): proposal → specs → design → tasks
- **tdd**: tests → implementation → docs

Run `spool schemas` to see available schemas.

## Tips

- Use `/spool-explore` to think through an idea before committing to a change
- `/spool-ff-change` when you know what you want, `/spool-continue-change` when exploring
- During `/spool-apply-change`, if something's wrong — fix the artifact, then continue
- Tasks track progress via checkboxes in `tasks.md`
- Check status anytime: `spool status --change "name"`

## Feedback

This is rough. That's intentional — we're learning what works.

Found a bug? Have ideas? Join us on [Discord](https://discord.gg/BYjPaKbqMt) or open an issue on [GitHub](https://github.com/withakay/spool/issues).
