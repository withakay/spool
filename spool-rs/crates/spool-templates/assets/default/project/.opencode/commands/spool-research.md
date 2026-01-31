______________________________________________________________________

## description: Conduct Spool research via skills (stack, architecture, features, pitfalls).

Conduct Spool research for the following topic. The prompt may include a focus like stack, architecture, features, or pitfalls.
<Topic>
$ARGUMENTS
</Topic>

<!-- SPOOL:START -->

Use the Spool agent skill `spool-research` as the source of truth for this workflow.

**Input**

- The research topic is provided in the prompt arguments or <Topic> block. It may include an optional focus (stack, architecture, features, pitfalls).

**Instructions**
Tell the model to use the `spool-research` skill to complete this workflow, using any supplied arguments or context from the prompt.

**Focus**

- If the user specifies one of: stack, architecture, features, pitfalls, follow the skill's focus guidance.
- If the focus is missing or unclear, ask the user whether they want a single investigation or the full research suite.

**Guardrails**

- If the `spool-research` skill is missing or unavailable, ask the user to run `spool init` (or `spool update` if the project is already initialized), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.

<!-- SPOOL:END -->
