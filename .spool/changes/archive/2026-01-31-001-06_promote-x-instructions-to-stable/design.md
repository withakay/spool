## Context

The `spool x-instructions` command is a hidden, experimental command that generates enriched instructions for AI agents when creating artifacts. It was introduced to provide context-aware templates that include dependency information, output paths, and unlock status - information that a static prompt file cannot provide.

The command is currently:

- Hidden from `--help` output via Commander's `{ hidden: true }` option
- Prefixed with `x-` to indicate experimental status
- Stable in usage by all Spool skills for the past several iterations

The target namespace `spool agent instruction` reflects that this command:

1. Generates output intended for AI agents, not humans
1. Provides machine-readable instructions for artifact generation
1. Belongs in a logical grouping separate from human-facing commands

## Goals / Non-Goals

**Goals:**

- Promote `x-instructions` to stable API under `spool agent instruction`
- Create `spool agent` command group for agent-facing utilities
- Maintain backward compatibility with deprecation warning on old command
- Update all Spool skills to use the new command path

**Non-Goals:**

- Promoting other `x-` commands (`x-templates`, `x-schemas`, `x-new`) - they stay experimental
- Changing the output format of the instruction generator
- Adding new functionality to the instruction generator itself

## Decisions

### Decision 1: Use `agent` as the command group name

**Choice**: `spool agent` over alternatives like `spool agents`, `spool ai`, `spool machine`, `spool internal`

**Rationale**:

- Singular "agent" is more consistent with singular subcommand "instruction"
- Commands work on a single artifact at a time, so singular form is semantically correct
- Reads better: "spool agent instruction spec" vs "spool agents instruction spec"
- Aligns with singular command naming convention in the CLI (like `git`, `npm`, etc.)

**Alternatives considered**:

- `spool agents instruction` - plural/singular inconsistency
- `spool ai instruction` - too generic, could be confused with AI features
- `spool internal instruction` - suggests it's for developers, not necessarily AI
- `spool machine instruction` - awkward phrasing

### Decision 2: Singular `instruction` subcommand

**Choice**: `spool agent instruction [artifact]` (singular)

**Rationale**:

- The command generates a single instruction set for one artifact at a time
- Singular form reads better: "get the instruction for proposal"
- Consistent with REST-like conventions where singular refers to a specific resource
- Consistent with singular `agent` command group name

### Decision 3: Deprecation strategy with stderr warning

**Choice**: Keep `x-instructions` as deprecated alias that emits warning to stderr

**Rationale**:

- Allows gradual migration without breaking existing workflows
- Warning goes to stderr so JSON output parsing isn't affected
- Skills can be updated independently without immediate breakage

**Implementation**:

```typescript
// In artifact-workflow.ts
program
  .command('x-instructions [artifact]', { hidden: true })
  .action(async (artifact, options) => {
    console.error('Warning: spool x-instructions is deprecated, use spool agent instruction');
    // delegate to agent instruction handler
  });
```

### Decision 4: File organization for agent commands

**Choice**: Create new `src/commands/agent.ts` file for the agent command group

**Rationale**:

- Clean separation from human-facing commands
- Future agent-facing commands can be added to this file
- `artifact-workflow.ts` is already large; this reduces its scope

## Risks / Trade-offs

**\[Risk\] Skills referencing old command break after x-instructions removal**
→ Mitigation: Keep deprecated alias indefinitely, only remove after all known skills updated

**\[Risk\] Users manually running x-instructions see confusing deprecation warning**
→ Mitigation: Clear warning message with exact replacement command

**\[Risk\] New `agent` namespace creates confusion about what belongs there**
→ Mitigation: Document clear criteria: "commands that generate machine-readable output for AI agent consumption"

**\[Trade-off\] Adding another command group increases CLI surface area**
→ Acceptable: The namespacing provides clearer organization and signals intended audience

## Migration Plan

### Phase 1: Add new command (non-breaking)

1. Create `src/commands/agent.ts` with `agent instruction` command
1. Wire up to existing `instructionsCommand` function
1. Register `agent` group in main CLI

### Phase 2: Deprecate old command

1. Add deprecation warning to `x-instructions` that points to new command
1. Update all Spool skills to use `spool agent instruction`
1. Update documentation

### Phase 3: Cleanup (future, not part of this change)

1. Remove `x-instructions` alias after sufficient migration period
1. Consider adding other agent-facing commands to the `agent` group

## Open Questions

1. **Should we move other experimental commands to `agent` group?** - Defer to future changes
1. **Deprecation timeline for x-instructions?** - No removal planned, keep as long-lived alias
