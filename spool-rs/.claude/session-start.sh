#!/usr/bin/env bash
# Minimal SessionStart hook shim for Claude Code integration
# Points to Spool CLI instruction artifacts instead of embedding workflow content

set -euo pipefail

# Determine plugin root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Output a minimal pointer to the Spool CLI bootstrap artifact
# This hook does NOT embed workflow content - it delegates to the CLI
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<EXTREMELY_IMPORTANT>\\n\\nSpool workflows are managed by the Spool CLI.\\n\\nTo bootstrap Spool workflows in Claude Code, run:\\n\\n\\`\\`\\`bash\\nspool agent instruction bootstrap --tool claude\\n\\`\\`\\`\\n\\nThis command returns the canonical preamble and available workflow artifacts.\\n\\nFor a list of available instruction artifacts, run:\\n\\`\\`\\`bash\\nspool agent instruction --list\\n\\`\\`\\`\\n</EXTREMELY_IMPORTANT>"
  }
}
EOF

exit 0
