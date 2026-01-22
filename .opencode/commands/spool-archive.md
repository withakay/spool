---
description: Archive a deployed Spool change and update specs.
---
<ChangeId>
  $ARGUMENTS
</ChangeId>
<!-- SPOOL:START -->
Use the Spool agent skill `spool-archive` as the source of truth for this workflow.

**Input**
- The change ID is provided in the prompt arguments or <ChangeId> block.

**Instructions**
1. Open the Spool skill file for `spool-archive` in your agent skills directory (for example, `.claude/skills/spool-archive/SKILL.md`).
2. Follow the skill instructions exactly, using any supplied arguments or context from the prompt.

**Guardrails**
- If the skill file is missing, ask the user to run `spool init` to install Spool skills, then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.
<!-- SPOOL:END -->
