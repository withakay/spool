---
name: spool-apply
description: Implement an approved Spool change and keep tasks in sync.
category: Spool
tags: [spool, apply]
---

The user has requested to implement the following change proposal.
<UserRequest>
$ARGUMENTS
</UserRequest>

<!-- SPOOL:START -->

Use the Spool agent skill `spool-apply-change-proposal` (alias: `spool-apply`) as the source of truth for this workflow.

**Input**

- The change ID or implementation request is provided in the prompt arguments or <UserRequest> block.

**Instructions**

Tell the model to use the `spool-apply-change-proposal` skill to complete this workflow, using any supplied arguments or context from the prompt.

**Testing Policy (TDD + coverage)**

- Follow the Testing Policy printed by `spool agent instruction proposal` / `spool agent instruction apply`.
- Default workflow: RED/GREEN/REFACTOR (write a failing test, implement the minimum to pass, then refactor).
- Coverage target: 80% (guidance; projects may override).
- Override defaults via cascading project config (low -> high precedence): `spool.json`, `.spool.json`, `.spool/config.json`, `$PROJECT_DIR/config.json` (when set).
- Keys: `defaults.testing.tdd.workflow`, `defaults.testing.coverage.target_percent`.

```json
{
  "defaults": {
    "testing": {
      "tdd": { "workflow": "red-green-refactor" },
      "coverage": { "target_percent": 80 }
    }
  }
}
```

**Guardrails**

- If the `spool-apply-change-proposal` skill is missing or unavailable, ask the user to run `spool init` (or `spool update` if the project is already initialized), then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.

<!-- SPOOL:END -->
