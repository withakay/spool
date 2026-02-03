## Context

Spool maintains local, developer-specific session state in `.spool/session.json`. This file should remain local and is not meaningful to commit.

`spool init` is the natural place to ensure a newly initialized project has sensible defaults that reduce git noise and prevent accidental commits.

## Goals / Non-Goals

**Goals:**
- Ensure `.spool/session.json` is ignored by Git immediately after `spool init`.
- Make the `.gitignore` update idempotent and non-destructive.

**Non-Goals:**
- Introduce a generalized `.gitignore` management system.
- Modify ignore rules beyond the single `.spool/session.json` entry.

## Decisions

- Update the repository root `.gitignore` by inserting `.spool/session.json` if missing.
- Create `.gitignore` if it does not exist.
- Preserve all existing `.gitignore` content and avoid duplicate entries.

## Risks / Trade-offs

- Touching `.gitignore` during init can surprise some users -> mitigate by only adding a single, minimal line and doing nothing if already present.
