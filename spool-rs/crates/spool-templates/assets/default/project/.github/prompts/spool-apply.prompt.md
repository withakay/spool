______________________________________________________________________

## description: Implement an approved Spool change and keep tasks in sync.

<UserRequest>
  ${input:change_id:Change ID (e.g. 006-18_dedupe-harness-prompts) or implementation request}
</UserRequest>

<!-- SPOOL:START -->

Use the Spool agent skill `spool-apply-change-proposal` (alias: `spool-apply`) as the source of truth for this workflow.

**Input**

- The change ID or implementation request is provided in the prompt arguments or <UserRequest> block.

**Instructions**
Tell the model to use the `spool-apply-change-proposal` skill to complete this workflow, using any supplied arguments or context from the prompt.

**Guardrails**

- If the `spool-apply-change-proposal` skill is missing or unavailable, ask the user to run `spool init` (or `spool update` if the project is already initialized), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.

<!-- SPOOL:END -->
