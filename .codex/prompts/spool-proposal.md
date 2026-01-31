______________________________________________________________________

## description: Scaffold a new Spool change and validate strictly. argument-hint: request or feature description

<UserRequest>
  (paste the request here)
</UserRequest>

<!-- SPOOL:START -->

Use the Spool agent skill `spool-proposal` as the source of truth for this workflow.

**Input**

- The request is provided in the prompt arguments or <UserRequest> block. Use it to scope the change and name the change ID.

**Module selection**

- Choose a module by semantic fit (use `spool list --modules`).
- If nothing fits, suggest creating a new module for the theme of the work.

**Instructions**
Tell the model to use the `spool-proposal` skill to complete this workflow, using any supplied arguments or context from the prompt.

**Guardrails**

- If the `spool-proposal` skill is missing or unavailable, ask the user to run `spool init` (or `spool update` if the project is already initialized), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.

<!-- SPOOL:END -->
