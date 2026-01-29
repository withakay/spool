/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */

export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_spool_complete_changes() {
  local changes
  changes=$(spool-bun __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_spool_complete_specs() {
  local specs
  specs=$(spool-bun __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_spool_complete_items() {
  local items
  items=$(spool-bun __complete changes 2>/dev/null | cut -f1; spool-bun __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}`;
