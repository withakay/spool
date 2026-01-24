## Why

The Spool CLI has drifted into a mixed command surface (some verb-first commands like `list/show/validate`, some noun-group commands like `config/module/completion`, plus scattered experimental commands). This makes the CLI harder to learn, harder to document, and easy for shell completion to fall out of sync.

We want one predictable, modern CLI grammar across the *entire* surface: `spool <verb> <noun> ...` (with the noun often being implied, or expressed via a flag).

## What Changes

- Confirm and standardize the global CLI grammar as **verb-first**: `spool <verb> <noun> ...`.
- Keep `spool list/show/validate/archive/split/init/update/view` as the primary UX.
- Continue rationalizing experimental commands under `x-*` (already the chosen experimental naming convention).
- Introduce (and document) verb-noun equivalents for remaining noun-group command families, while keeping the existing noun-group forms as deprecated compatibility shims for at least one release:
  - `spool module ...` -> `spool <verb> module ...` (e.g., `spool list module`, `spool new module`, `spool show module <id>`, `spool validate module <id>`)
  - `spool config ...` -> `spool <verb> config ...` (e.g., `spool get config <key>`, `spool set config <key> <value>`, `spool list config`, `spool edit config`)
  - `spool completion ...` -> `spool <verb> completion ...` (e.g., `spool generate completion zsh`, `spool install completion zsh`, `spool uninstall completion zsh`)
  - `spool skills ...` -> `spool <verb> skills ...` (e.g., `spool list skills`, `spool install skills <skills...>`, `spool status skills`)
- Treat legacy noun-based entrypoints (`spool spec ...`, `spool change ...`) the same way: keep them callable as deprecated shims but hide them from the preferred help/completion surface.
- Align shell completion with the actual exposed command surface (stable + experimental + legacy shims where appropriate).

## Capabilities

### New Capabilities
- `cli-module`: specify the module CLI surface (including verb-first equivalents)
- `cli-skills`: specify the skills CLI surface (including verb-first equivalents)

### Modified Capabilities
- `cli-artifact-workflow`: expose artifact workflow commands under the `x-*` experimental naming convention; define compatibility/alias expectations for the old names.
- `cli-research`: align the research CLI entrypoint with the experimental naming convention (`x-research`) instead of a bespoke `spool-research` command.
- `cli-completion`: ensure completions are generated for the full exposed command surface, including experimental `x-*` commands.
- `experimental-workflow-commands`: align any references to `artifact-experimental-setup` with `x-artifact-experimental-setup` (and document compatibility behavior).
- `qa-testing-area`: update any documented invocations of `spool ralph` to reflect the supported experimental naming and/or alias behavior.
- `projector-conventions`: codify the single global CLI grammar as `spool <verb> <noun> ...` and broaden the deprecation policy beyond only `spec/change`.
- `cli-config`: add verb-first equivalents for config operations while keeping `spool config ...` as deprecated compatibility.
- `cli-change`: treat `spool change ...` as a deprecated noun-based entrypoint (callable, warned, hidden).
- `cli-spec`: treat `spool spec ...` as a deprecated noun-based entrypoint (callable, warned, hidden).

## Impact

- CLI UX: consistent verb-first command grammar across the CLI; experimental commands remain clearly isolated under `x-*`.
- Compatibility: existing invocations will continue to work during a deprecation window (warnings + migration hints); help + completions will prioritize the preferred verb-first forms.
- Code: command registration and completion registry will be updated to expose verb-first forms and keep deprecated shims as thin wrappers.
