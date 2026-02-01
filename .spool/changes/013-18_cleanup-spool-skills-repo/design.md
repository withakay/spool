# Design: Cleanup spool-skills Repository

## Current State

The `spool-skills/` directory contains:

```
spool-skills/
├── .claude-plugin/     # Not used by spool
├── .codex/             # Not used by spool
├── .github/            # Not used by spool
├── .opencode/          # Not used by spool
├── adapters/           # Not used - templates embedded in spool-templates
├── agents/             # Not used by spool
├── commands/           # Not used by spool
├── docs/               # Not used by spool
├── hooks/              # Not used by spool
├── lib/                # Not used by spool
├── skills/             # USED - source for SPOOL_SKILLS distribution
├── tests/              # Not used by spool
├── .gitattributes      # Git config
├── .gitignore          # Git config
├── LICENSE             # Legal
├── README.md           # Not used by spool
└── RELEASE-NOTES.md    # Not used by spool
```

## Distribution Mechanism

Spool's distribution only uses:

1. **Local mode**: Reads from `spool-skills/skills/<name>/SKILL.md`
2. **Remote mode**: Fetches from GitHub `spool-skills/skills/<name>/SKILL.md`

The `SPOOL_SKILLS` constant in `distribution.rs` defines the 12 skills to distribute.

## Target State

```
spool-skills/
├── skills/             # 12 skill directories
│   ├── brainstorming/
│   ├── dispatching-parallel-agents/
│   ├── finishing-a-development-branch/
│   ├── receiving-code-review/
│   ├── requesting-code-review/
│   ├── subagent-driven-development/
│   ├── systematic-debugging/
│   ├── test-driven-development/
│   ├── using-git-worktrees/
│   ├── using-spool-skills/
│   ├── verification-before-completion/
│   └── writing-skills/
├── LICENSE             # Keep for attribution
├── .gitignore          # Keep for git
└── .gitattributes      # Keep for git
```

## Decisions

1. **Keep as subdirectory**: `spool-skills/` remains a directory in the spool repo (not a separate git submodule)
2. **Minimal structure**: Only keep what's needed for skill distribution
3. **Remove adapters**: Adapter templates are already embedded in `spool-templates/assets/`
