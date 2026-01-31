# Agent Command Group Specification

## Purpose

Define the `agent-command-group` capability, including required behavior and validation scenarios, so it remains stable and testable.


## Requirements

### Requirement: CLI command group for agent utilities

The CLI SHALL provide a top-level `agent` command group that namespaces commands designed for AI agent consumption rather than human use.

#### Scenario: Running spool agent without subcommand

- **WHEN** user runs `spool agent`
- **THEN** system displays available subcommands under the agent group
- **AND** help text indicates these commands are for AI agent consumption

#### Scenario: Help text describes agent-facing purpose

- **WHEN** user runs `spool agent --help`
- **THEN** system displays description indicating these commands generate machine-readable output for AI agents
- **AND** lists available subcommands with brief descriptions

### Requirement: Agent group is visible in main help

The `agent` command group SHALL appear in `spool --help` output, not hidden like experimental commands.

#### Scenario: Agent appears in main CLI help

- **WHEN** user runs `spool --help`
- **THEN** the `agent` command group appears in the command list
- **AND** it is NOT marked as hidden or experimental
