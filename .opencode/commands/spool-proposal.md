---
description: Scaffold a new Spool change and validate strictly.
---
The user has requested the following change proposal. Use the Spool skill to create their proposal.
<UserRequest>
  $ARGUMENTS
</UserRequest>
<!-- SPOOL:START -->
Use the Spool agent skill `spool-proposal` as the source of truth for this workflow.

**Input**
- The request is provided in the prompt arguments or <UserRequest> block. Use it to scope the change and name the change ID.

**Instructions**
1. Open the Spool skill file for `spool-proposal` in your agent skills directory (for example, `.claude/skills/spool-proposal/SKILL.md`).
2. Follow the skill instructions exactly, using any supplied arguments or context from the prompt.

**Guardrails**
- If the skill file is missing, ask the user to run `spool init` to install Spool skills, then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.
<!-- SPOOL:END -->
