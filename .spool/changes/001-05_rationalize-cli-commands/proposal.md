## Why

The Spool CLI has accumulated top-level commands that are experimental, inconsistently named, or not represented in shell completion, making the command surface harder to learn and maintain. We need a clear, enforceable policy for experimental commands and to align implemented commands with documented specs.

## What Changes

- Adopt an experimental CLI naming convention: experimental commands are exposed as `spool x-<command>`.
- Rename/move the artifact workflow experimental commands from top-level to `x-*` (e.g., `status` -> `x-status`, `instructions` -> `x-instructions`, `templates` -> `x-templates`, `schemas` -> `x-schemas`, `new` -> `x-new`).
- Rename/move `artifact-experimental-setup` to `x-artifact-experimental-setup`.
- Replace the top-level `spool-research` command with `x-research`.
- Replace `ralph`/`loop` with `x-ralph` (keeping `ralph` and `loop` as deprecated aliases during a transition period).
- Update shell completion registry to match the actual exposed command surface, including `x-*` commands and any other commands that are currently missing.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `cli-artifact-workflow`: expose artifact workflow commands under the `x-*` experimental naming convention; define compatibility/alias expectations for the old names.
- `cli-research`: align the research CLI entrypoint with the experimental naming convention (`x-research`) instead of a bespoke `spool-research` command.
- `cli-completion`: ensure completions are generated for the full exposed command surface, including experimental `x-*` commands.
- `experimental-workflow-commands`: align any references to `artifact-experimental-setup` with `x-artifact-experimental-setup` (and document compatibility behavior).
- `qa-testing-area`: update any documented invocations of `spool ralph` to reflect the supported experimental naming and/or alias behavior.

## Impact

- CLI UX: experimental commands no longer pollute the top-level help output; users have a consistent way to discover and use experimental commands.
- Compatibility: existing invocations of `status`, `instructions`, `templates`, `schemas`, `new`, `artifact-experimental-setup`, `spool-research`, `ralph`, and `loop` may require migration; the change will include a deprecation/alias period to minimize breakage.
- Code: command registration in `src/cli/index.ts`, `src/commands/artifact-workflow.ts`, `src/commands/research.ts`, and `src/commands/ralph.ts` will change; completions in `src/core/completions/command-registry.ts` will be updated.
