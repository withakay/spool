# Spool Templates Notes

This crate owns the files installed by the Rust CLI via `spool init` / `spool update`.

## Where to edit

- Project templates: `spool-rs/crates/spool-templates/assets/default/project/`
  - Tool prompts/skills/commands: `.opencode/`, `.claude/`, `.github/`, `.codex/`
  - Spool project docs: `.spool/`
- Home templates: `spool-rs/crates/spool-templates/assets/default/home/` (currently unused by default)

Do NOT edit the checked-in, repo-root `.opencode/`, `.claude/`, `.github/`, or `.spool/` files directly when changing what `spool init` installs; those are outputs.

## How to verify changes

```bash
make install
spool init --force --tools all
```

Then inspect installed files (examples):

- `.opencode/skill/*/SKILL.md`
- `.claude/skills/*/SKILL.md`
- `.github/skills/*/SKILL.md`
- `.spool/AGENTS.md`
