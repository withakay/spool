## ADDED Requirements

### Requirement: Completion operations are grouped

The CLI SHALL expose completion operations under the `spool completions` group.

#### Scenario: Generate completions
- **WHEN** user executes `spool completions generate zsh`
- **THEN** output a complete Zsh completion script to stdout

#### Scenario: Install completions
- **WHEN** user executes `spool completions install zsh`
- **THEN** the completion script is installed for that shell

#### Scenario: Uninstall completions
- **WHEN** user executes `spool completions uninstall zsh`
- **THEN** the completion script is uninstalled for that shell

#### Scenario: Deprecated completion shim remains callable
- **WHEN** user executes `spool completion <subcommand>`
- **THEN** the command executes successfully
- **AND** prints a deprecation warning pointing to `spool completions <subcommand>`
- **AND** the shim is hidden from help and omitted from shell completions

## MODIFIED Requirements

### Requirement: Completion Generation

The completion command SHALL generate completion scripts for all supported shells on demand.

#### Scenario: Generating Zsh completion

- **WHEN** user executes `spool completions generate zsh`
- **THEN** output a complete Zsh completion script to stdout
- **AND** include completions for all preferred commands exposed by `spool --help`
- **AND** include only the visible experimental commands (`x-templates`, `x-schemas`)
- **AND** omit hidden/deprecated compatibility shims from suggestions
- **AND** include all command-specific flags and options
- **AND** use Zsh's `_arguments` and `_describe` built-in functions
- **AND** support dynamic completion for change and spec IDs

#### Scenario: Generating Bash completion

- **WHEN** user executes `spool completions generate bash`
- **THEN** output a complete Bash completion script to stdout
- **AND** include completions for all commands and subcommands
- **AND** use `complete -F` with custom completion function
- **AND** populate `COMPREPLY` with appropriate suggestions
- **AND** support dynamic completion for change and spec IDs via `spool __complete`

#### Scenario: Generating Fish completion

- **WHEN** user executes `spool completions generate fish`
- **THEN** output a complete Fish completion script to stdout
- **AND** use `complete -c spool` with conditions
- **AND** include command-specific completions with `--condition` predicates
- **AND** support dynamic completion for change and spec IDs via `spool __complete`
- **AND** include descriptions for each completion option

#### Scenario: Generating PowerShell completion

- **WHEN** user executes `spool completions generate powershell`
- **THEN** output a complete PowerShell completion script to stdout
- **AND** use `Register-ArgumentCompleter -CommandName spool`
- **AND** implement scriptblock that handles command context
- **AND** support dynamic completion for change and spec IDs via `spool __complete`
- **AND** return `[System.Management.Automation.CompletionResult]` objects
