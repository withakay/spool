---
description: Implement an approved Spool change and keep tasks in sync.
---
The user has requested to implement the following change proposal. Follow the Spool skill instructions.
<UserRequest>
  $ARGUMENTS
</UserRequest>
<!-- SPOOL:START -->
Use the Spool agent skill `spool-apply` as the source of truth for this workflow.

**Input**
- The change ID or implementation request is provided in the prompt arguments or <UserRequest> block.

**Instructions**
1. Open the Spool skill file for `spool-apply` in your agent skills directory (for example, `.claude/skills/spool-apply/SKILL.md`).
2. Follow the skill instructions exactly, using any supplied arguments or context from the prompt.

**Guardrails**
- If the skill file is missing, ask the user to run `spool init` to install Spool skills, then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.
<!-- SPOOL:END -->
