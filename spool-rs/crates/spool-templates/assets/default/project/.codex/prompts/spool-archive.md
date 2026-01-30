---
description: Archive a deployed Spool change and update specs.
argument-hint: change-id
---

<UserRequest>
  (paste change id here)
</UserRequest>

<!-- SPOOL:START -->
Use the Spool agent skill `spool-archive` as the source of truth for this workflow.

**Input**
- The change ID is provided in the prompt arguments or <UserRequest> block.

**Instructions**
Tell the model to use the `spool-archive` skill to complete this workflow, using any supplied arguments or context from the prompt.

 **Guardrails**
- If the `spool-archive` skill is missing or unavailable, ask the user to run `spool init` (or `spool update` if the project is already initialized), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.
<!-- SPOOL:END -->
