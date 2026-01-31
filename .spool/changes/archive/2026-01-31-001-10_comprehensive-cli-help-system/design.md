## Context

The current CLI implementation in `spool-rs/crates/spool-cli/src/main.rs` uses manually maintained help string constants (`HELP`, `LIST_HELP`, `AGENT_HELP`, etc.) and explicit `-h|--help` checks scattered throughout command handlers. This pattern has led to:

1. Help routing issues where subcommand help shows parent help instead
2. No mechanism to dump complete CLI documentation
3. No consistent footer hints for navigation
4. The `[options]` marker in top-level help without revealing what options exist

Key code patterns observed:
- ~25 `*_HELP` constants with manually formatted strings
- Each command handler checks `args.iter().any(|a| a == "--help" || a == "-h")`
- Some commands like `agent` have nested subcommands (`instruction`) with separate help

## Goals / Non-Goals

**Goals:**
- Fix help routing so each command level shows its own help
- Add `spool help --all` and `spool --help-all` for complete API dump
- Add JSON format for machine-readable help dump
- Add navigation hints to help output footers
- Keep changes minimal and focused on help UX

**Non-Goals:**
- Migrating to clap or other argument parsing libraries (too invasive)
- Auto-generating help from arg parsing (would require major refactor)
- Changing the argument parsing logic itself

## Decisions

### Decision 1: Help routing fix approach

**Choice**: Move help checks to the earliest point in each command handler BEFORE subcommand dispatch, and ensure subcommand handlers have their own help checks.

**Rationale**: The current issue is that help flags are checked after arguments are partially consumed. By checking at the right level, we ensure the correct help is shown. This is a minimal change.

**Implementation**:
```rust
// In handle_agent():
if args.first() == Some(&"instruction".to_string()) {
    let instruction_args: Vec<_> = args.into_iter().skip(1).collect();
    // Check help AFTER extracting subcommand args
    if instruction_args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{AGENT_INSTRUCTION_HELP}");
        return Ok(());
    }
    return handle_agent_instruction(instruction_args, spool_dir).await;
}
// If no subcommand matched, check for parent help
if args.iter().any(|a| a == "--help" || a == "-h") {
    println!("{AGENT_HELP}");
    return Ok(());
}
```

### Decision 2: Help dump command structure

**Choice**: Add `spool help --all` as the primary interface, with `spool --help-all` as an alias.

**Rationale**:
- `help --all` follows the existing `help [command]` pattern
- `--help-all` provides convenience for those expecting global flags
- Both are easy to implement

**Output format**:
```
================================================================================
SPOOL CLI REFERENCE
================================================================================

spool
-----
Usage: spool [options] [command]
...

--------------------------------------------------------------------------------

spool init
----------
Usage: spool init [options] [path]
...

--------------------------------------------------------------------------------

spool agent
-----------
Usage: spool agent [command] [options]
...

  spool agent instruction
  -----------------------
  Usage: spool agent instruction <artifact> [options]
  ...
```

### Decision 3: JSON help structure

**Choice**: Structured JSON with commands array, each containing name, description, usage, options array, and subcommands array.

```json
{
  "version": "1.0",
  "commands": [
    {
      "name": "init",
      "path": "spool init",
      "description": "Initialize Spool in your project",
      "usage": "spool init [options] [path]",
      "options": [
        {
          "name": "--tools",
          "short": null,
          "description": "Configure AI tools non-interactively",
          "required": false,
          "default": null
        }
      ],
      "subcommands": []
    }
  ]
}
```

### Decision 4: Footer hints

**Choice**: Add a consistent footer to each help constant.

**Template for commands with subcommands**:
```
Run 'spool <command> <subcommand> -h' for subcommand options.
```

**Template for leaf commands**:
```
Run 'spool -h' to see all commands.
```

## Risks / Trade-offs

**[Risk]** Help constants are already large; adding footers increases size
→ **Mitigation**: Footer is small (~60 chars). Worth the UX improvement.

**[Risk]** `--help-all` could be confused with regular help
→ **Mitigation**: Naming is clear. Also available as `spool help --all`.

**[Trade-off]** Manual help maintenance continues
→ Accepted. Full auto-generation would require major refactoring beyond scope.

## Implementation Notes

Files to modify:
1. `spool-rs/crates/spool-cli/src/main.rs`:
   - Add `handle_help_all()` function
   - Update `HELP` and other constants with footers
   - Fix help routing in `handle_agent()` and other nested commands
   - Add `--help-all` global flag handling

Consider extracting help constants to a separate module `help.rs` for maintainability, but this is optional.
