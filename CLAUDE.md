<!-- SPOOL:START -->
# Spool Instructions

These instructions are for AI assistants working in this project.

Always open `@/.spool/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/.spool/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Note: Files under `.spool/`, `.opencode/`, `.github/`, and `.codex/` are installed/updated by Spool (`spool init`, `spool update`) and may be overwritten.
Add project-specific guidance in `.spool/user-guidance.md` (injected into agent instruction outputs) and/or below this managed block.

Keep this managed block so 'spool update' can refresh the instructions.

<!-- SPOOL:END -->