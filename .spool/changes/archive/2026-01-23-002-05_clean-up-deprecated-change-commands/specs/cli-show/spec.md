## MODIFIED Requirements

### Requirement: Interactivity controls

The show command SHALL NOT show interactive prompts in non-interactive environments and MUST support type detection.

#### Scenario: Non-interactive environments do not prompt

- **GIVEN** stdin is not a TTY or `--no-interactive` is provided or environment variable `SPOOL_INTERACTIVE=0`
- **WHEN** executing `spool show` without arguments
- **THEN** do not prompt
- **AND** print a helpful hint with examples for `spool show <item>`
- **AND** exit with code 1

#### Scenario: Type detection and ambiguity handling

- **WHEN** executing `spool show <item-name>`
- **THEN** if `<item-name>` uniquely matches a change or a spec, show that item
- **AND** if it matches both, print an ambiguity error and suggest `--type change|spec` or using `spool show --type change <item>` / `spool show --type spec <item>`
- **AND** if it matches neither, print not-found with nearest-match suggestions
