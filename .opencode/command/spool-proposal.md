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
Tell the model to use the `spool-proposal` skill to complete this workflow, using any supplied arguments or context from the prompt.

**Guardrails**
- If the `spool-proposal` skill is missing or unavailable, ask the user to run `spool init` (or install it with `spool skills install spool-proposal`), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.
<!-- SPOOL:END -->
