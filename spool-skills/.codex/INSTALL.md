# Installing spool-skills for Codex

Quick setup to enable spool-skills in Codex.

## Installation

1. **Clone spool-skills repository**:
   ```bash
   mkdir -p ~/.codex/spool-skills
   cd ~/.codex/spool-skills
   git clone https://github.com/withakay/spool-skills.git .
   ```

2. **Update ~/.codex/AGENTS.md** to include this spool-skills section:
   ```markdown
   ## spool-skills System

   <EXTREMELY_IMPORTANT>
   You have spool-skills. When working on a Spool change, run `spool agent instruction <artifact> --change "<id>"` for workflow instructions.
   </EXTREMELY_IMPORTANT>
   ```

## Workflow Artifacts

Spool provides the following instruction artifacts (run `spool agent instruction <artifact>`):

- `bootstrap` - Bootstrap instructions for the current tool
- `proposal` - Create or review change proposals
- `specs` - View or update specification deltas
- `design` - Technical design decisions
- `tasks` - Implementation task checklist
- `apply` - Apply an approved change
- `review` - Review and validate changes
- `archive` - Archive completed changes

## Verification

Test the installation:
```bash
spool agent instruction bootstrap --tool codex
```

You should see the bootstrap instructions for Codex. The system is now ready for use.

## Legacy Node CLI

The Node CLI runner (`spool-skills-codex`) is deprecated. Use the Spool CLI (`spool agent instruction`) instead.
