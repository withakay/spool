---
description: Conduct adversarial review via Spool review skill.
---
Review the following change or scope using the Spool review skill instructions.
<ChangeId>
  $ARGUMENTS
</ChangeId>
<!-- SPOOL:START -->
Use the Spool agent skill `spool-review` as the source of truth for this workflow.

**Input**
- The change ID or review target is provided in the prompt arguments or <ChangeId> block.

**Instructions**
Tell the model to use the `spool-review` skill to complete this workflow, using any supplied arguments or context from the prompt.

 **Guardrails**
- If the `spool-review` skill is missing or unavailable, ask the user to run `spool init` (or `spool update` if the project is already initialized), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.
<!-- SPOOL:END -->
