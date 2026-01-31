# Installing spool-skills for Codex

> **Note:** This is a fork of [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent.

Quick setup to enable spool-skills in Codex.

## Installation

1. **Clone spool-skills repository**:
   ```bash
   mkdir -p ~/.codex/spool-skills
   cd ~/.codex/spool-skills
   git clone https://github.com/withakay/spool-skills.git .
   ```

2. **Create personal skills directory**:
   ```bash
   mkdir -p ~/.codex/skills
   ```

3. **Update ~/.codex/AGENTS.md** to include this spool-skills section:
   ```markdown
   ## spool-skills System

   <EXTREMELY_IMPORTANT>
   You have spool-skills. spool-skills teach you new capabilities. RIGHT NOW run: `~/.codex/spool-skills/.codex/spool-skills-codex bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
~/.codex/spool-skills/.codex/spool-skills-codex bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.
