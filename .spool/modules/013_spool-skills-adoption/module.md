# Spool Skills Adoption

## Purpose
Adopt and adapt the vendored `spool-skills/` (fork of Superpowers skills) into Spool, enabling consistent workflow instructions across OpenCode, Claude Code, and Codex. All workflow content flows through `spool agent instruction <artifact>` as the single source of truth.

## Scope
- agent-instructions
- tool-adapters
- distribution

## Depends On
- 001 (workflow-enhancements - for instruction artifacts)

## Changes
- [x] 013-01_opencode-adapter
- [x] 013-02_claude-code-integration
- [x] 013-03_codex-bootstrap
- [x] 013-04_bootstrap-artifact-cli
- [x] 013-05_distribution-fetch-mechanics
- [x] 013-06_fix-skill-distribution-paths
- [ ] 013-07_integrate-brainstorming-with-spool
- [ ] 013-08_integrate-plan-execution-with-spool
- [ ] 013-09_fix-using-spool-skills-identity
- [ ] 013-10_add-spool-integration-to-branch-finishing
- [ ] 013-11_enhance-review-skills-with-spool-cli
- [x] 013-12_integrate-plan-skills-with-spool-workflow
- [x] 013-13_merge-writing-plans-into-spool-proposal
- [x] 013-14_rename-spool-workflow-skills
- [x] 013-15_update-subagent-driven-development
- [x] 013-16_fix-using-spool-skills-naming
- [x] 013-17_update-finishing-branch-skill
