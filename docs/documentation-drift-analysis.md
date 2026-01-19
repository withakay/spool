# Documentation Drift Analysis: Projector vs Original OpenSpec

**Date**: 2026-01-18
**Purpose**: Identify and document areas where Projector documentation has drifted from the original OpenSpec spec

---

## Executive Summary

Projector is a fork of OpenSpec that has added significant features for project-centric planning and long-running, multi-agent workflows. This document identifies the key areas of documentation drift between the original OpenSpec conventions and the current Projector implementation.

**Key Finding**: The primary drift is not in documentation, but in **feature additions** and **directory structure changes** that extend beyond the original OpenSpec scope.

---

## 1. Directory Structure Changes

### Original OpenSpec
```
projector/
├── AGENTS.md
├── project.md
├── specs/
└── changes/
    ├── <change-id>/
    │   ├── proposal.md
    │   ├── design.md
    │   ├── tasks.md
    │   └── specs/
    └── archive/
```

### Current Projector
```
.projector/                          # ← Hidden directory (changed from projector/)
├── AGENTS.md                         # Root-level instructions (was in projector/)
├── project.md                        # Minimal project overview
├── planning/                         # NEW: Project-level planning artifacts
│   ├── PROJECT.md                    # NEW: Project vision, constraints
│   ├── ROADMAP.md                    # NEW: Phased milestones
│   └── STATE.md                      # NEW: Session state persistence
├── research/                         # NEW: Domain research artifacts
│   ├── SUMMARY.md
│   └── investigations/
│       ├── stack-analysis.md
│       ├── feature-landscape.md
│       ├── architecture.md
│       └── pitfalls.md
├── changes/
│   ├── <change-id>/
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── tasks.md                  # ENHANCED: Structured with waves
│   │   ├── specs/
│   │   ├── reviews/                  # NEW: Adversarial review outputs
│   │   └── change.yaml               # NEW: Schema metadata (proposed)
│   └── archive/
├── workflows/                        # NEW: YAML workflow definitions
│   ├── research.yaml
│   ├── execute.yaml
│   ├── review.yaml
│   └── .state/                       # NEW: Workflow execution state
├── commands/                         # NEW: AI tool slash command templates
│   ├── research-*.md
│   ├── plan-*.md
│   ├── execute.md
│   └── review-*.md
└── config.yaml                       # NEW: Agent configuration (proposed)
```

### Documentation Inconsistencies

| Document | Uses | Should Use |
|----------|------|------------|
| `README.md` | `.projector/` | ✅ Correct |
| `AGENTS.md` | `.projector/` | ✅ Correct |
| `cli-init/spec.md:28-34` | `projector/` | ❌ Should be `.projector/` |
| `cli-validate/spec.md:13` | `projector/` | ❌ Should be `.projector/` |
| `schema-customization.md` | `projector/` | ⚠️ Context-dependent |
| `schema-workflow-gaps.md` | `projector/` | ⚠️ Context-dependent |

**Critical Issue**: The `cli-init/spec.md` spec explicitly creates a `projector/` directory, but the README says the default is `.projector/`. This is a **documentation vs implementation inconsistency**.

---

## 2. Spec Format Drift

### Original OpenSpec Spec Format

```markdown
# Spec Name

## Purpose
[Brief description of what this spec defines]

## Requirements

### Requirement: [Title]
Descriptive text explaining the requirement.

#### Scenario: [Short name]
- **WHEN** [precondition or action]
- **THEN** [expected result]
- **AND** [additional outcomes]
```

**Key Conventions**:
- `### Requirement:` headers with SHALL statements
- `#### Scenario:` headers with structured WHEN/THEN/AND format
- Bold keywords: `**WHEN**`, `**THEN**`, `**AND**`
- Descriptive text must follow requirement header before scenarios

### Current Projector Spec Format

**Same as original OpenSpec** - ✅ No drift detected.

The `projector-conventions/spec.md` explicitly defines and maintains the original format:
- `### Requirement:` + descriptive text
- `#### Scenario:` + bold WHEN/THEN/AND
- Non-breaking gradual migration support
- Allows alternative formats (OpenAPI, JSON Schema)

**Documentation Accuracy**: ✅ Spec format documentation is consistent.

---

## 3. Change Proposal Format Drift

### Original OpenSpec Change Format

```markdown
## Why
[Reason for the change]

## What Changes
- Bulleted list of changes
```

### Current Projector Change Format

**Enhanced format** (from `schemas/spec-driven/templates/proposal.md`):

```markdown
## Why
[Reason for the change]

## What Changes
- Bulleted list of changes

## Capabilities

### New Capabilities
List of new capabilities being added.

### Modified Capabilities
List of existing capabilities being modified.

## Impact
Description of impact on existing functionality.
```

**Key Enhancements**:
- Explicit `## Capabilities` section
- Separate `New` and `Modified` capabilities
- Structured `## Impact` section
- Delta storage format: `## ADDED`, `## MODIFIED`, `## REMOVED`, `## RENAMED`

**Documentation Accuracy**: ✅ Templates match documentation.

---

## 4. Features Added Beyond OpenSpec

### 4.1 Project Planning (NEW)

**Files**: `planning/PROJECT.md`, `planning/ROADMAP.md`, `planning/STATE.md`

**Purpose**: Multi-session project context, milestone tracking, state persistence.

**Status**: ✅ Documented in README and `project-planning-research-proposal.md`

---

### 4.2 Research Phase (NEW)

**Files**: `research/SUMMARY.md`, `research/investigations/*.md`

**Purpose**: Pre-proposal domain investigation (stack analysis, feature landscape, architecture, pitfalls).

**Status**: ✅ Documented in README and `project-planning-research-proposal.md`

---

### 4.3 Enhanced Tasks Format (ENHANCED)

**File**: `changes/<id>/tasks.md`

**Changes from original**:
- Waves (grouping and parallelizable chunks)
- Explicit `Verify` commands
- `Done When` acceptance criteria
- Task status tracking (pending/in-progress/complete)
- Checkpoint tasks for human approval

**Status**: ✅ Documented in `project-planning-research-proposal.md` but **not reflected in spec template** (`schemas/spec-driven/templates/tasks.md` is just a placeholder).

**Gap**: The enhanced tasks format is documented but the template hasn't been updated.

---

### 4.4 Adversarial Review (NEW)

**Files**: `changes/<id>/reviews/`, command templates

**Purpose**: Systematic multi-perspective review (security, scale, edge cases).

**Status**: ✅ Documented in `project-planning-research-proposal.md`

---

### 4.5 Workflow Orchestration (NEW)

**Files**: `workflows/*.yaml`, `workflows/.state/*.json`

**Purpose**: YAML-defined workflows with waves, tasks, and checkpoints.

**Commands**:
- `projector workflow init`
- `projector workflow list`
- `projector workflow show <workflow>`
- `projector workflow run <workflow> --tool <tool> -v topic="..."`
- `projector workflow status <workflow>`

**Status**: ✅ Documented in README

---

### 4.6 Agent Configuration (NEW)

**File**: `config.yaml`

**Purpose**: Per-tool model selection and context budgets.

**Commands**:
- `projector agent-config init`
- `projector agent-config summary`
- `projector agent-config get <path>`
- `projector agent-config set <path> <value>`

**Status**: ⚠️ Documented in README but **not implemented** in specs (no `agent-config` spec exists).

**Gap**: Feature is documented but not fully specified.

---

### 4.7 Schema Customization (ENHANCED)

**Feature**: 2-level schema resolution (XDG user override → package built-in).

**Resolution Order**:
1. `./projector/schemas/<name>/` (NEW: Project-local)
2. `~/.local/share/projector/schemas/<name>/` (User global)
3. `<npm-package>/schemas/<name>/` (Built-in)

**Status**: ✅ Documented in `schema-customization.md` and `schema-workflow-gaps.md`

**Gap**: Schema management CLI (`projector schema list/copy/diff/reset`) is **proposed but not implemented**.

---

### 4.8 Change Metadata (PROPOSED)

**File**: `changes/<id>/change.yaml`

**Purpose**: Bind schema to change, store metadata.

```yaml
schema: tdd
created: 2025-01-15T10:30:00Z
description: Add user authentication system
```

**Status**: ⚠️ Proposed in `schema-workflow-gaps.md` but **not implemented**.

**Gap**: Feature is proposed but not specified or implemented.

---

## 5. CLI Command Extensions

### 5.1 New Commands

| Command | Status | Documentation |
|---------|--------|----------------|
| `projector plan init/status` | ✅ Implemented | README |
| `projector research init/status` | ⚠️ Proposed | `project-planning-research-proposal.md` |
| `projector tasks init/status/start/complete/next` | ⚠️ Proposed | `project-planning-research-proposal.md` |
| `projector workflow init/list/show/run/status` | ✅ Implemented | README |
| `projector agent-config init/summary/get/set` | ⚠️ Proposed | README |
| `projector schema list/which/copy/diff/reset/validate` | ⚠️ Proposed | `schema-customization.md` |
| `projector state` | ⚠️ Proposed | `project-planning-research-proposal.md` |

### 5.2 Enhanced Commands

| Command | Enhancement | Status |
|---------|-------------|--------|
| `projector init` | AI tool selection, progress indicators | ✅ Implemented |
| `projector list` | `--specs` flag, interactive selection | ✅ Implemented |
| `projector show` | `--json`, `--deltas-only`, `--type` flags | ✅ Implemented |
| `projector validate` | `--all`, `--changes`, `--specs`, `--strict`, `--type`, `--no-interactive` | ✅ Implemented |
| `projector change` | `show`, `list`, `validate` subcommands | ✅ Implemented |
| `projector archive` | Change arguments, dry-run | ✅ Implemented |

---

## 6. Documentation Quality Issues

### 6.1 Inconsistent Directory References

**Issue**: Mixed use of `projector/` and `.projector/` across documentation.

**Examples**:
- `cli-init/spec.md:28-34` creates `projector/` directory
- `cli-validate/spec.md:13` references `projector/changes/`
- `README.md` consistently uses `.projector/`
- `schema-customization.md` uses `projector/schemas/` (project-local context)

**Recommendation**: Audit all documentation and standardize on `.projector/` for the working directory. Update `cli-init/spec.md` to reflect the actual implementation.

---

### 6.2 Missing Implementation Specs

**Issue**: Features are documented in README or proposals but lack corresponding spec files.

**Examples**:
- `agent-config` commands: No spec in `.projector/specs/`
- `plan` commands: No spec in `.projector/specs/`
- `research` commands: No spec in `.projector/specs/`
- `tasks` commands: No spec in `.projector/specs/`
- `workflow` commands: No spec in `.projector/specs/`

**Impact**: Features are described but not formally specified, leading to implementation ambiguity.

**Recommendation**: Create spec files for each command group following the established `cli-*` spec pattern.

---

### 6.3 Template Drift

**Issue**: The `tasks.md` template doesn't reflect the enhanced format documented in proposals.

**Current Template** (`schemas/spec-driven/templates/tasks.md`):
```markdown
## Tasks
- [ ] Task 1
- [ ] Task 2
```

**Documented Format** (`project-planning-research-proposal.md`):
```markdown
## Wave 1

### Task 1.1: [Title]
- **Files**: [...]
- **Dependencies**: [...]
- **Action**: [...]
- **Verify**: [...]
- **Done When**: [...]
- **Status**: [ ] pending / [ ] in-progress / [x] complete
```

**Recommendation**: Update the `tasks.md` template to match the documented enhanced format.

---

### 6.4 Deprecated Documentation

**Issue**: Some archived changes contain outdated directory references.

**Example**: `2025-08-19-structured-spec-format/proposal.md` may contain outdated paths.

**Impact**: Archived documentation can confuse users who reference it for historical context.

**Recommendation**: Add migration notes or deprecation headers to archived documents.

---

## 7. Spec Compliance Analysis

### 7.1 Spec Format Compliance

| Spec File | Format Compliant | Issues |
|-----------|------------------|--------|
| `cli-change/spec.md` | ✅ | None |
| `cli-init/spec.md` | ✅ | Directory name inconsistency |
| `cli-list/spec.md` | ✅ | None |
| `cli-show/spec.md` | ✅ | None |
| `cli-validate/spec.md` | ✅ | Directory name inconsistency |
| `artifact-graph/spec.md` | ✅ | None |
| `projector-conventions/spec.md` | ✅ | None |

**Overall**: ✅ Spec format is consistent and follows original OpenSpec conventions.

---

### 7.2 Change Proposal Compliance

| Change | Format Compliant | Issues |
|--------|------------------|--------|
| `2025-12-25-add-change-manager` | ✅ | None |
| `2025-08-19-structured-spec-format` | ✅ | None |
| `2025-10-14-add-non-interactive-init-options` | ✅ | None |

**Overall**: ✅ Change proposals follow the enhanced Projector format.

---

## 8. Recommendations

### 8.1 High Priority

1. **Fix directory name inconsistency**:
   - Update `cli-init/spec.md` to use `.projector/`
   - Update `cli-validate/spec.md` to use `.projector/`
   - Add a migration note in README explaining the change from `projector/` to `.projector/`

2. **Create missing spec files**:
   - `cli-plan/spec.md` for `projector plan` commands
   - `cli-research/spec.md` for `projector research` commands
   - `cli-tasks/spec.md` for `projector tasks` commands
   - `cli-workflow/spec.md` for `projector workflow` commands
   - `cli-agent-config/spec.md` for `projector agent-config` commands

3. **Update tasks.md template**:
   - Reflect the enhanced format with waves, verify commands, and status tracking

---

### 8.2 Medium Priority

4. **Implement proposed features**:
   - `change.yaml` metadata (as proposed in `schema-workflow-gaps.md`)
   - Schema management CLI (`projector schema list/copy/diff/reset`)
   - Project-local schema resolution

5. **Document migration path**:
   - Add migration guide for users with `projector/` directories
   - Document how to upgrade from older Projector versions

---

### 8.3 Low Priority

6. **Clean up archived documentation**:
   - Add deprecation headers to archived changes
   - Update outdated path references in archive

7. **Improve documentation cross-references**:
   - Add links between related documentation files
   - Create a comprehensive index of all Projector features

---

## 9. Conclusion

**Summary**:
- ✅ **Core spec format** is fully compliant with original OpenSpec
- ✅ **Change proposal format** follows documented conventions
- ⚠️ **Directory structure** has inconsistencies between documentation and specs
- ⚠️ **Feature completeness**: Many features are documented but not specified or implemented
- ⚠️ **Template drift**: Tasks template doesn't match documented enhancements

**Assessment**: Projector has successfully maintained the original OpenSpec core conventions while significantly extending the feature set. The primary documentation drift issues are:
1. Inconsistent directory naming (projector/ vs .projector/)
2. Missing spec files for documented features
3. Outdated templates that don't reflect enhanced formats

**Next Steps**: Address high-priority recommendations to align documentation, specs, and implementation.

---

## Appendix A: File Inventory

### Documentation Files
- `README.md` - Main project documentation
- `AGENTS.md` - AI assistant instructions (root level)
- `.projector/AGENTS.md` - AI assistant instructions (projector level)
- `docs/schema-customization.md` - Schema customization guide
- `docs/project-planning-research-proposal.md` - Planning and research extension proposal
- `docs/schema-workflow-gaps.md` - Schema workflow analysis
- `CHANGELOG.md` - Version history

### Template Files
- `schemas/spec-driven/templates/proposal.md`
- `schemas/spec-driven/templates/spec.md`
- `schemas/spec-driven/templates/design.md`
- `schemas/spec-driven/templates/tasks.md`
- `schemas/tdd/templates/*.md`

### Spec Files
- `.projector/specs/cli-change/spec.md`
- `.projector/specs/cli-init/spec.md`
- `.projector/specs/cli-list/spec.md`
- `.projector/specs/cli-show/spec.md`
- `.projector/specs/cli-validate/spec.md`
- `.projector/specs/artifact-graph/spec.md`
- `.projector/specs/projector-conventions/spec.md`

### Archived Changes
- `.projector/changes/archive/` - Historical change proposals

---

**Document Version**: 1.0
**Last Updated**: 2026-01-18
**Maintainer**: Projector Team
