## Context

Agent harnesses (OpenCode, Claude Code, Codex, GitHub Copilot) use markdown files with YAML frontmatter to define agent configurations, including which AI model to use. Currently:

- Model references are scattered across many files in different directories per harness
- No automated way to discover which models agents use or update them
- New models release frequently; keeping configs current is manual and error-prone
- Different harnesses support different providers/models

models.dev provides a comprehensive, community-maintained database of AI models with pricing, capabilities, and limits via a REST API.

**Stakeholders**: Developers using AI coding assistants who want to stay current with model releases and optimize for cost/capability.

## Goals / Non-Goals

**Goals:**

- Provide CLI commands to list, compare, and update agent models
- Integrate with models.dev as the authoritative model registry
- Support all major harnesses: OpenCode, Claude Code, Codex, GitHub Copilot
- Enable filtering models by provider, cost tier, capabilities
- Create backups before modifying agent files
- Cache model data locally for offline usage and performance

**Non-Goals:**

- Creating agent files from scratch (only updating existing)
- Managing other frontmatter fields beyond `model`
- Integrating with harness-specific APIs (only file manipulation)
- Supporting custom/self-hosted model registries (only models.dev)

## Decisions

### 1. New crate: spool-models

**Decision**: Create a new crate `spool-models` in the workspace for models.dev integration.

**Rationale**: Separates model registry concerns from CLI logic. Enables reuse if we need model data elsewhere.

### 2. Harness provider constraints

**Decision**: Enforce strict provider constraints per harness:
- **Claude Code**: anthropic only
- **Codex**: openai only
- **GitHub Copilot**: github-copilot only
- **OpenCode**: any provider from models.dev

### 3. Spool agent tiers

**Decision**: Define three configurable Spool agent tiers:
- `spool-quick`: Fast, cheap models for simple tasks
- `spool-general`: Balanced models for typical work
- `spool-thinking`: High-capability models for complex reasoning

**Configuration** (harness-first organization with extended options):
```json
{
  "harnesses": {
    "opencode": {
      "provider": null,
      "agents": {
        "spool-quick": {
          "model": "anthropic/claude-haiku-4-5",
          "temperature": 0.3
        },
        "spool-general": {
          "model": "openai/gpt-5.2-codex",
          "variant": "high",
          "temperature": 0.3
        },
        "spool-thinking": {
          "model": "openai/gpt-5.2-codex",
          "variant": "xhigh",
          "temperature": 0.5
        }
      }
    },
    "claude-code": {
      "provider": "anthropic",
      "agents": {
        "spool-quick": { "model": "haiku" },
        "spool-general": { "model": "sonnet" },
        "spool-thinking": { "model": "opus" }
      }
    },
    "codex": {
      "provider": "openai",
      "agents": {
        "spool-quick": { "model": "openai/gpt-5.1-codex-mini" },
        "spool-general": { "model": "openai/gpt-5.2-codex", "reasoningEffort": "high" },
        "spool-thinking": { "model": "openai/gpt-5.2-codex", "reasoningEffort": "xhigh" }
      }
    },
    "github-copilot": {
      "provider": "github-copilot",
      "agents": {
        "spool-quick": { "model": "github-copilot/claude-haiku-4.5" },
        "spool-general": { "model": "github-copilot/gpt-5.2-codex" },
        "spool-thinking": { "model": "github-copilot/gpt-5.2-codex" }
      }
    }
  }
}
```

### 4. Harness-specific details

#### OpenCode
- **Paths**: `~/.config/opencode/agent/*.md`, `<project>/.opencode/agent/*.md`
- **Format**: YAML frontmatter with `description`, `mode`, `model`, `temperature`, `tools` (object)
- **Provider**: Any from models.dev

#### Claude Code
- **Paths**: `~/.claude/agents/*.md`, `<project>/.claude/agents/*.md`
- **Format**: YAML frontmatter with `name`, `description`, `tools` (comma-separated), `model`
- **Model field**: `model: haiku|sonnet|opus|inherit` (simplified names)
- **Provider**: anthropic only

#### Codex
- **Paths**: Uses `AGENTS.md` + `.agents/skills/` for skills
- **Model field**: Configured in `~/.codex/config.toml`
- **Provider**: openai only

#### GitHub Copilot
- **Paths**: `<project>/.github/agents/*.md`
- **Format**: YAML frontmatter with `name`, `description`, `tools` (array)
- **Provider**: github-copilot only

### 5. Skills that should use Spool agents

| Skill | Proposed Change |
|-------|-----------------|
| `subagent-driven-development` | Use `spool-general` for implementer, `spool-quick` for reviewers |
| `dispatching-parallel-agents` | Recommend `spool-quick` for simple tasks, `spool-general` for complex |
| `requesting-code-review` | Use `spool-quick` for quick reviews, `spool-general` for thorough |
| `brainstorming` | Use `spool-thinking` for complex analysis |

## Risks / Trade-offs

**[Risk] models.dev API changes or goes offline**
→ Mitigation: Local cache provides 24h buffer.

**[Risk] Batch update breaks agent configurations**
→ Mitigation: Always create backups. Require confirmation. Provide rollback.
