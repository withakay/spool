---
description: Conduct Spool research via skills (stack, architecture, features, pitfalls).
---
Conduct Spool research for the following topic. The prompt may include a focus like stack, architecture, features, or pitfalls.
Write findings under ./Users/jack/Code/withakay/spool/.spool/research/investigations/ as directed by the skill.
<Topic>
  $ARGUMENTS
</Topic>
<!-- SPOOL:START -->
Use the Spool agent skill `spool-research` as the source of truth for this workflow.

**Input**
- The research topic is provided in the prompt arguments or <Topic> block. It may include an optional focus (stack, architecture, features, pitfalls).

**Instructions**
1. Open the Spool skill file for `spool-research` in your agent skills directory (for example, `.claude/skills/spool-research/SKILL.md`).
2. Follow the skill instructions exactly, using any supplied arguments or context from the prompt.

**Focus**
- If the user specifies one of: stack, architecture, features, pitfalls, focus only on that investigation and write to the matching file under `./Users/jack/Code/withakay/spool/.spool/research/investigations/`.
- If the focus is missing or unclear, ask the user whether they want a single investigation or the full research suite.

**Guardrails**
- If the skill file is missing, ask the user to run `spool init` to install Spool skills, then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.
<!-- SPOOL:END -->
