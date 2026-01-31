## Why

The spool CLI and spool-\* skills are currently separate entry points, making it harder for users to discover and use spool commands from within agent harnesses. This change unifies the spool experience by creating a master 'spool' skill that provides intelligent command routing and fallback to the CLI, while also adding a slash command for easier access.

## What Changes

- Create a new OpenCode skill called 'spool' that handles command routing
- The 'spool' skill will attempt to match commands to existing spool-\* skills first (e.g., 'spool archive' matches 'spool-archive' skill)
- If no matching spool-\* skill exists, the skill will fallback to calling the spool CLI directly
- Create a slash command 'spool.md' that is installed during 'spool init' to enable '/spool <command>' syntax in agent harnesses like opencode
- The skill will pass through command arguments to either the matched skill or the CLI
- Both the spool skill and spool.md slash command will be automatically installed as part of spool init

## Capabilities

### New Capabilities

- `spool-skill-routing`: Intelligent routing of spool commands to matching spool-\* skills with fallback to CLI
- `spool-slash-command`: Installation and execution of '/spool' slash command for agent harness integration

### Modified Capabilities

None

## Impact

- New skill file at `.opencode/skill/spool/`
- New slash command at `.opencode/command/spool.md`
- No breaking changes to existing spool-\* skills or CLI
- Enhances user experience by providing a unified entry point for all spool functionality
- Requires agents to have the 'spool' skill available (automatic via skill system)
