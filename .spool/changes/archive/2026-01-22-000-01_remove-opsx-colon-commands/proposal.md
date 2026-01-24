# Proposal: Remove OPSX Colon Commands

## Why

- The `/opsx:*` slash commands are Claude-specific and inconsistent with the hyphenated experimental workflow command naming.
- Standardizing on `/spool-*` keeps the experimental workflow consistent with other Spool tooling.

## What Changes

- Remove all `/opsx:*` command references from templates, generated command wrappers, and docs.
- Standardize the experimental workflow slash commands to:
  - `/spool-explore`
  - `/spool-new-change`
  - `/spool-continue-change`
  - `/spool-apply-change`
  - `/spool-ff-change`
  - `/spool-sync-specs`
  - `/spool-archive-change`

## Capabilities

### New

- None (this is a rename / standardization).

### Modified

- Experimental workflow command wrappers and docs use `/spool-*`.

## Impact

- Breaking change: `/opsx:*` commands are removed (no backward compatibility).
