---
description: Unified entry point for spool commands with intelligent skill-first routing.
---
You are being asked to execute a spool command. Your job is to intelligently route the command to the appropriate handler.

**Command to execute:** $ARGUMENTS

## Routing Logic

1. **Parse the command**: Extract the primary command and arguments from the input
2. **Check for spool-* skill**: Determine if there's a matching spool-* skill installed
3. **Route accordingly**:
   - If matching spool-* skill exists → Use the Task tool to invoke that skill with all arguments
   - If no matching skill → Use the Bash tool to invoke the spool CLI with all arguments

**Important**: Skills take precedence over the CLI. If both exist, use the skill.

## Examples

- Input: `archive 123-45` → Check for `spool-archive` skill, use it if available, otherwise CLI
- Input: `status` → Check for `spool-status` skill, use it if available, otherwise CLI
- Input: `view change-123` → Check for `spool-view` skill, use it if available, otherwise CLI

## How to Check for Skills

List available skills and check if a matching spool-* skill exists. You can do this by checking the `.opencode/skill/` directory or by attempting to use the skill.

## Error Handling

When invoking skills or CLI, capture any errors and report them with clear context:
- `[spool-* skill error]: <error message>` for skill errors
- `[spool CLI error]: <error message>` for CLI errors
