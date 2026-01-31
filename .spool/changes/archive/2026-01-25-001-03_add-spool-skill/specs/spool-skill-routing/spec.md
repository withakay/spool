## ADDED Requirements

### Requirement: Skill-first command routing

The spool skill SHALL route incoming commands to matching spool-\* skills with higher precedence than the spool CLI. When a command matches both a spool-\* skill and the CLI, the skill MUST be invoked.

#### Scenario: Command matches spool-\* skill

- **WHEN** user invokes spool with command 'archive'
- **THEN** skill checks for spool-archive skill
- **AND** spool-archive skill exists
- **AND** skill invokes spool-archive with provided arguments
- **AND** spool CLI is NOT invoked

#### Scenario: Command matches both skill and CLI

- **WHEN** user invokes spool with command 'status'
- **THEN** skill checks for spool-status skill
- **AND** both spool-status skill and CLI 'status' command exist
- **AND** skill invokes spool-status skill
- **AND** CLI 'status' command is NOT invoked

### Requirement: CLI fallback for unmatched commands

The spool skill SHALL fallback to invoking the spool CLI when no matching spool-\* skill exists. The skill MUST preserve all original command arguments.

#### Scenario: No matching skill exists

- **WHEN** user invokes spool with command 'version'
- **THEN** skill checks for spool-version skill
- **AND** spool-version skill does not exist
- **AND** skill invokes spool CLI with 'version' command
- **AND** all original arguments are passed to CLI

#### Scenario: Skill exists but is not installed

- **WHEN** user invokes spool with command 'archive'
- **AND** spool-archive skill exists in repository
- **BUT** spool-archive is not installed in the agent
- **THEN** skill checks for installed spool-archive skill
- **AND** skill does not find installed spool-archive
- **AND** skill invokes spool CLI with 'archive' command

### Requirement: Argument passthrough

The spool skill MUST pass through all command arguments unchanged to the invoked target (either spool-\* skill or CLI).

#### Scenario: Single argument passthrough

- **WHEN** user invokes spool with command 'view' and argument 'change-123'
- **AND** spool-view skill exists
- **THEN** skill invokes spool-view with argument 'change-123'
- **AND** argument is not modified

#### Scenario: Multiple arguments passthrough

- **WHEN** user invokes spool with command 'validate' and arguments '--strict' and 'change-123'
- **AND** spool-validate skill exists
- **THEN** skill invokes spool-validate with arguments '--strict' and 'change-123'
- **AND** all arguments are passed in original order

#### Scenario: CLI fallback with arguments

- **WHEN** user invokes spool with command 'module' and arguments 'list' and '--json'
- **AND** no spool-module skill exists
- **THEN** skill invokes spool CLI with arguments 'module' 'list' '--json'
- **AND** all arguments are passed unchanged

### Requirement: Command parsing and validation

The spool skill SHALL parse incoming commands to extract the primary command and arguments. The skill MUST validate that at least one command is provided.

#### Scenario: Valid command provided

- **WHEN** user invokes spool with input 'archive 123-45'
- **THEN** skill parses command as 'archive'
- **AND** skill parses arguments as \['123-45'\]
- **AND** routing proceeds

#### Scenario: No command provided

- **WHEN** user invokes spool with no arguments
- **THEN** skill detects missing command
- **AND** skill outputs error message indicating command is required
- **AND** skill does not invoke any skill or CLI

### Requirement: Error handling and reporting

The spool skill SHALL capture and report errors from invoked skills or CLI in a consistent format. Error messages MUST indicate whether the error came from a skill or the CLI.

#### Scenario: Skill invocation fails

- **WHEN** skill invokes spool-archive with arguments
- **AND** spool-archive skill fails with error
- **THEN** skill captures the error output
- **AND** skill reports error with prefix '\[spool-archive skill error\]'
- **AND** original error message is preserved

#### Scenario: CLI invocation fails

- **WHEN** skill invokes spool CLI with command and arguments
- **AND** CLI returns error exit code
- **THEN** skill captures the error output
- **AND** skill reports error with prefix '\[spool CLI error\]'
- **AND** original error message is preserved

### Requirement: Skill discovery

The spool skill SHALL discover available spool-\* skills by querying the installed skills in the agent harness. The skill MUST maintain a cache of discovered skills for performance.

#### Scenario: Initial skill discovery

- **WHEN** spool skill is first invoked
- **THEN** skill queries agent harness for all installed skills
- **AND** skill filters skills matching pattern 'spool-\*'
- **AND** skill builds mapping of commands to skill names
- **AND** mapping is cached for subsequent invocations

#### Scenario: Skill cache invalidation

- **WHEN** spool skill receives command
- **AND** skill cache is stale (older than configured TTL)
- **THEN** skill refreshes skill discovery
- **AND** cache is updated with current installed skills
