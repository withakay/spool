## Why

Spool already provides spec-driven change proposals, but running an iterative AI “work loop” still requires a separate tool and a prompt file. Bringing the Ralph loop into `spool` lets users run iterative development directly against a Change Proposal (or Module) with consistent defaults, persisted state, and repeatable agent execution.

## What Changes

- Add a new command `spool ralph` (alias: `spool loop`) that runs an iterative agent loop until a completion promise is detected (or max iterations is reached).
- Use Spool artifacts for context:
  - `--change <id>` targets a specific Change Proposal (primary context).
  - `--module <id>` provides module-level context and can be used to resolve a default change when `--change` is omitted.
- Add agent execution configuration:
  - `--harness <tool>` selects the agent harness (initially `opencode`).
  - `--model <name>` passes the model identifier to the harness.
  - `--allow-all` (and alias flags like `--yolo` / `--dangerously-allow-all`) enables non-interactive runs by auto-approving tool permissions.
- Persist per-change loop state and context under `.spool/.state/ralph/` so switching changes preserves independent history.
- Support loop control options (`--min-iterations`, `--max-iterations`, `--completion-promise`) and convenience commands (`--status`, `--add-context`, `--clear-context`).
- Optionally auto-commit after each iteration (default on, with `--no-commit` to disable).

## Capabilities

### New Capabilities

- `cli-ralph`: Provide `spool ralph` / `spool loop` with change/module targeting, harness selection, loop state, and completion-based iteration control.

### Modified Capabilities

- (none)

## Impact

- Adds a new CLI surface area and new state files under `.spool/.state/ralph/`.
- Invokes external agent CLIs (starting with `opencode`), so behavior depends on the installed toolchain.
- Interacts with git when auto-commit is enabled; this may create additional commits during iterative runs.
