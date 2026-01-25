# Core Templates (Prompts)

This directory (`src/core/templates/`) is the source of truth for Spool's templated prompts.

When a user asks to update a prompt in Spool, make the change here (in the template code), not in generated/install output.

Where prompts live:
- `src/core/templates/skill-templates.ts`: templated skill prompts
- `src/core/templates/slash-command-templates.ts` and `src/core/templates/command-templates.ts`: templated slash command prompts
- `src/core/templates/agents-template.ts` / `src/core/templates/agents-root-stub.ts`: AGENTS.md scaffolding

Notes:
- Keep templates path-aware (accept a `spoolDir` param and normalize hardcoded `.spool/` paths).
- Prefer updating the template function(s) and letting installation/configurators write the generated files.
