Unified entry point for spool commands with intelligent routing.

## When to Use

Use this skill when you need to invoke spool CLI commands from within the agent harness. The skill provides intelligent command routing:

1. **Skill-first routing**: If a spool-* skill exists for a command, it takes precedence over the CLI
2. **CLI fallback**: If no matching skill exists, the command is passed to the spool CLI
3. **Full argument passthrough**: All arguments are preserved when delegating to skills or CLI

## Examples

- `spool archive 123-45` → Invokes spool-archive skill if available, otherwise CLI
- `spool status` → Invokes spool-status skill if available, otherwise CLI
- `spool view change-123` → Invokes spool-view skill if available, otherwise CLI

## Routing Logic

The skill discovers installed spool-* skills and builds a command mapping. When invoked:

1. Parse the incoming command to extract the primary command and arguments
2. Check if the command matches an installed spool-* skill
3. If yes → invoke the skill with all arguments
4. If no → invoke spool CLI with all arguments

## Error Handling

Errors from skill invocations are prefixed with `[spool-* skill error]`
Errors from CLI invocations are prefixed with `[spool CLI error]`

## Help and Usage

To get help for spool commands, use `--help` or `-help` flag:

```bash
spool --help
```

### Common Spool Commands

- `spool list` - List all spool changes
- `spool status <change-id>` - Show detailed status of a change
- `spool view <change-id>` - View change details
- `spool proposal <name>` - Create a new change proposal
- `spool apply <change-id>` - Implement a change
- `spool archive <change-id>` - Archive a completed change
- `spool validate <change-id>` - Validate change completeness
- `spool module list` - List available modules
- `spool spec create <name>` - Create a new spec for a change

### Usage Examples

```bash
# List all changes
spool list

# View change status
spool status 001-01_add-feature

# Validate a change
spool validate 001-01_add-feature --strict

# Archive a completed change
spool archive 001-01_add-feature
```

### Getting More Help

If you receive an unknown command error, try:
```bash
spool --help
```

This will display all available commands and their descriptions.
