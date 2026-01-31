## ADDED Requirements

### Requirement: OpenCode Plugin Integration

The system SHALL provide an OpenCode plugin that integrates Spool workflows into the OpenCode agent environment.

#### Scenario: Plugin reads skills from stable location
- **GIVEN** the plugin is installed to `${OPENCODE_CONFIG_DIR}/plugins/spool-skills.js`
- **AND** skills are installed to `${OPENCODE_CONFIG_DIR}/skills/spool-skills/`
- **WHEN** the plugin loads
- **THEN** it SHALL read skills from the config directory (not relative to plugin path)

#### Scenario: Plugin injects bootstrap via system transform
- **GIVEN** the plugin is loaded in OpenCode
- **WHEN** a chat session starts
- **THEN** the plugin SHALL use `experimental.chat.system.transform` hook to inject bootstrap content

#### Scenario: Bootstrap content is minimal
- **GIVEN** the plugin injects bootstrap content
- **WHEN** the content is rendered
- **THEN** it SHALL contain a preamble pointing to `spool agent instruction <artifact>`
- **AND** it SHALL include OpenCode-specific tool-mapping notes only where tools differ from Claude Code
- **AND** it SHALL NOT embed full workflow text
