# Spool CLI Parity Matrix (TS oracle -> Rust candidate)

This matrix enumerates the current `spool` CLI surface that the Rust port must
match (flags, exit codes, error messages, JSON shapes, interactive behavior, and
filesystem writes).

Sources:

- CLI help output (TypeScript oracle): `spool --help` and `spool <cmd> --help`
- Specs (requirements guidance): `.spool/specs/*/spec.md` (notably: `cli-init`,
  `cli-update`, `cli-list`, `cli-show`, `cli-validate`, `cli-archive`,
  `cli-config`, `cli-completion`, `cli-artifact-workflow`, `cli-ralph`)

Legend:

- Mutates FS: writes or edits files
- Interactive: prompts/TTY-only behavior
- Parity tests: snapshot (text), json (structured), fs (tree/bytes), pty

| Command | Mutates FS | Interactive | JSON | Primary parity tests |
|---|---:|---:|---:|---|
| `spool --help` | no | no | no | snapshot |
| `spool --version` | no | no | no | snapshot |
| `spool init [path]` | yes | yes | no | fs + pty |
| `spool init --tools ...` | yes | no | no | fs |
| `spool init --force` | yes | maybe | no | fs |
| `spool update [path]` | yes | no | yes (`--json`) | fs + json |
| `spool list` | no | no | yes (`--json`) | snapshot + json |
| `spool list --specs` | no | no | yes (`--json`) | snapshot + json |
| `spool list --modules` | no | no | yes (`--json`) | snapshot + json |
| `spool dashboard` | no | yes (interactive UI) | no | snapshot (non-interactive fallback) + pty |
| `spool show [item]` | no | yes | yes | snapshot + json + pty |
| `spool show module <id>` | no | maybe | yes | snapshot + json |
| `spool validate [item]` | no | yes | yes | snapshot + json + pty |
| `spool validate --all/--changes/--specs/--modules` | no | no | yes | json + snapshot |
| `spool archive <change>` | yes | yes | no | fs + pty |
| `spool archive --skip-specs` | yes | no | no | fs |
| `spool config ...` | yes | maybe (editor) | yes (`list --json`) | snapshot + json + fs |
| `spool create module` | yes | yes | no | fs + pty |
| `spool create change` | yes | yes | no | fs + pty |
| `spool status --change <id>` | no | no | yes (`--json`) | snapshot + json |
| `spool instructions <artifact> --change <id>` | no | no | yes (`--json`) | snapshot + json |
| `spool x-templates` | no | no | yes (`--json`) | snapshot + json |
| `spool x-schemas` | no | no | yes (`--json`) | snapshot + json |
| `spool agent instruction ...` | no | no | yes (agent output) | json |
| `spool completions ...` | yes (install/uninstall) | yes | no | fs + pty |
| `spool ralph [prompt]` | yes (state) | yes | no | pty + fs |
| `spool split <change-id>` | yes | yes | no | pty + fs |
| `spool tasks ...` | yes (tasks.md edits) | yes | no | fs + pty |

## Installer Output Parity (Critical)

Commands `spool init` and `spool update` install and/or update tool instruction
files and marker-managed blocks. Byte-for-byte parity is required in
non-interactive mode.

Paths and notes (from specs and current repo conventions):

- Spool directory: `.spool/` (or user-selected spool dir if supported)
- OpenCode paths are singular: `.opencode/skill/`, `.opencode/command/`, `.opencode/plugin/`
- GitHub Copilot prompts: `.github/prompts/*.prompt.md` (YAML frontmatter + `$ARGUMENTS`)
- Codex prompts: `$CODEX_HOME/prompts` or `~/.codex/prompts`
