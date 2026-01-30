---
description: Route spool commands via the spool skill (skill-first, CLI fallback).
---

<SpoolCommand>
  ${input:command:Spool command (e.g. apply 006-18_dedupe-harness-prompts)}
</SpoolCommand>

<!-- SPOOL:START -->
Use the Spool agent skill `spool` as the source of truth for this workflow.

**Input**
- The spool command and arguments are provided in the prompt arguments or <SpoolCommand> block.

**Instructions**
Tell the model to use the `spool` skill to complete this workflow, using any supplied arguments or context from the prompt.

 **Guardrails**
- If the `spool` skill is missing or unavailable, ask the user to run `spool init` (or `spool update` if the project is already initialized), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.
<!-- SPOOL:END -->
