## MODIFIED Requirements

### Requirement: Asset Distribution

The system SHALL distribute skills, adapters, and commands from embedded binary assets to harness-specific directories at install time.

#### Scenario: Skills installed to all harnesses
- **WHEN** `spool init --tools all` is executed
- **THEN** skills are copied from embedded assets/skills/ to each harness's skills directory
- **AND** skills without `spool-` prefix get the prefix added
- **AND** skills already starting with `spool` keep their original name

#### Scenario: Commands installed to all harnesses
- **WHEN** `spool init --tools all` is executed
- **THEN** commands are copied from embedded assets/commands/ to each harness's commands/prompts directory
- **AND** GitHub prompts get `.prompt.md` suffix

#### Scenario: Adapters installed per harness
- **WHEN** `spool init --tools <harness>` is executed
- **THEN** harness-specific adapters are copied from embedded assets/adapters/
