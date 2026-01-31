______________________________________________________________________

## description: Conduct structured research for a Spool change. argument-hint: change-id

<UserRequest>
  (paste change id or research request here)
</UserRequest>

<!-- SPOOL:START -->

Use the Spool agent skill `spool-research` as the source of truth for this workflow.

**Input**

- The change ID or research request is provided in the prompt arguments or <UserRequest> block.

**Instructions**
Tell the model to use the `spool-research` skill to complete this workflow, using any supplied arguments or context from the prompt.

**Guardrails**

- If the `spool-research` skill is missing or unavailable, ask the user to run `spool init` (or `spool update` if the project is already initialized), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.

<!-- SPOOL:END -->
