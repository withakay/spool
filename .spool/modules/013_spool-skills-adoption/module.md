# Spool Skills Adoption

## Purpose

Adopt and adapt the vendored `spool-skills/` (fork of Superpowers skills) into Spool, enabling consistent workflow instructions across OpenCode, Claude Code, and Codex. All workflow content flows through `spool agent instruction <artifact>` as the single source of truth.

## Depends On

- 001 (workflow-enhancements - for instruction artifacts)

## Scope

- agent-instructions
- tool-adapters
- distribution

## Changes

- [x] 013-01_opencode-adapter
- [x] 013-02_claude-code-integration
- [x] 013-03_codex-bootstrap
- [x] 013-04_bootstrap-artifact-cli
- [x] 013-05_distribution-fetch-mechanics
