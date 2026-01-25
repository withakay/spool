<!-- SPOOL:START -->
# Spool Instructions

These instructions are for AI assistants working in this project.

Always open `@/.spool/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/.spool/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'spool update' can refresh the instructions.

<!-- SPOOL:END -->

## Development Commands

Use the Makefile for common development tasks:

```bash
# Build the project
make build

# Run tests
make test

# Run tests in watch mode
make test-watch

# Run tests with coverage
make test-coverage

# Run linter
make lint

# Clean build artifacts
make clean

# Show all available targets
make help
```

All Makefile commands use Bun internally.

## OpenCode Path Convention

**IMPORTANT**: OpenCode uses **singular** directory names for its configuration paths:
- `.opencode/skill/` (NOT `.opencode/skills/`)
- `.opencode/command/` (NOT `.opencode/commands/`)
- `.opencode/plugin/` (NOT `.opencode/plugins/`)

This differs from other tools like Claude Code which use plural forms (`.claude/skills/`, `.claude/commands/`).

When writing tests or code that references OpenCode paths, always use the singular form.

## Markdown Templating

**IMPORTANT**: When the proposal or specs mention installation via `spool init`, this means the artifact should be:
- Templated in TypeScript using the template system
- Path-aware (using `replaceHardcodedDotSpoolPaths` for `.spool/` path normalization)
- Installed via the appropriate configurator (e.g., `SkillsConfigurator`)

**Pattern**: Skills use `SkillTemplate` interface, slash commands use `CommandTemplate` interface:
```typescript
// Skills - src/core/templates/skill-templates.ts
export function getExampleSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'Example Skill',
    description: '...',
    instructions: replaceHardcodedDotSpoolPaths(rawInstructions, spoolDir)
  };
}

// Slash Commands - src/core/templates/skill-templates.ts
export function getExampleCommandTemplate(spoolDir: string = '.spool'): CommandTemplate {
  return {
    name: 'Example Command',
    description: '...',
    category: 'Workflow',
    tags: ['example'],
    content: replaceHardcodedDotSpoolPaths(rawInstructions, spoolDir)
  };
}
```

**Do not**: Direct file copies or hardcoded `.spool/` paths in install logic
**Do**: Use template functions with `spoolDir` parameter for path normalization
