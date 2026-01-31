## Design

### Overview

This change focuses on updating all references to the deprecated `spool change` noun-based commands to the verb-first equivalents throughout the codebase. The deprecated commands were replaced in change `2025-08-19-adopt-verb-noun-cli-structure` but many references remain in error messages, hints, tests, and documentation.

### Command Mapping

The following command mappings are used for replacements:

| Deprecated Command | Verb-First Equivalent |
|-------------------|----------------------|
| `spool change list` | `spool list` |
| `spool change show <id>` | `spool show <id>` |
| `spool change validate <id>` | `spool validate --changes <id>` |
| `spool change create` | `spool new` |
| `spool change apply` | (Use `spool apply` - new command) |

### Implementation Strategy

The implementation is divided into three phases:

1. **Phase 1: Update Source Code** - Update error messages and hints in TypeScript files
1. **Phase 2: Update Tests** - Update test assertions to expect verb-first commands
1. **Phase 3: Update Documentation** - Update spec files and core documentation

### Phase 1: Source Code Updates

#### Error Messages and Hints

All error messages that suggest using a `spool change` command should be updated to use the verb-first equivalent. The pattern is:

- Replace "Use `spool change show <id>`" with "Use `spool show <id>`"
- Replace "Run `spool change validate <id>`" with "Run `spool validate --changes <id>`"
- Replace "List changes with `spool change list`" with "List changes with `spool list`"

#### Files to Update

1. **`src/commands/validate.ts`**

   - Line 179: Hint command reference
   - Line 266: Debug hint command reference

1. **`src/commands/show.ts`**

   - Line 102: Hint command reference
   - Line 120: Hint command reference

1. **`src/core/validation/constants.ts`**

   - Line 61: Validation error hint

1. **`src/core/templates/agents-template.ts`**

   - Line 88: Command reference in generated agent instructions

### Phase 2: Test Updates

Test assertions need to be updated to expect the new verb-first command references instead of the deprecated ones.

#### Files to Update

1. **`test/commands/show.test.ts`**

   - Line 47: Update expected hint text

1. **`test/commands/change.interactive-show.test.ts`**

   - Line 38: Update expected hint text

1. **`test/commands/validate.enriched-output.test.ts`**

   - Line 43: Update expected hint text

1. **`test/commands/change.interactive-validate.test.ts`**

   - Line 41: Update expected hint text

### Phase 3: Documentation Updates

#### Spec Files

Update spec files to use verb-first command examples:

1. **`.spool/specs/cli-change/spec.md`**

   - Replace all `spool change` references with verb-first equivalents
   - Update command examples

1. **`.spool/specs/cli-show/spec.md`**

   - Replace all `spool change` references with verb-first equivalents
   - Update command examples

1. **`.spool/specs/cli-validate/spec.md`**

   - Replace all `spool change` references with verb-first equivalents
   - Update command examples

1. **`.spool/specs/projector-conventions/spec.md`**

   - Update command pattern description to use verb-first structure

#### Core Documentation

1. **`.spool/AGENTS.md`**
   - Line 84: Update enumeration command reference

#### Archived Changes

The following archived change specs reference deprecated commands in historical context. These should **NOT** be modified:

- `.spool/changes/archive/2025-08-19-add-change-commands/`
- `.spool/changes/archive/2025-08-19-add-interactive-show-command/`
- `.spool/changes/archive/2025-08-19-bulk-validation-interactive-selection/`
- `.spool/changes/archive/2025-08-19-improve-validate-error-messages/`
- `.spool/changes/archive/2025-10-14-enhance-validation-error-messages/`

These represent the historical implementation of the deprecated commands and should remain unchanged for historical accuracy.

### What NOT to Change

1. **Deprecation warnings in `src/cli/index.ts`** - Lines 173, 200

   - These warnings are part of the implementation that shows the deprecation message
   - They reference the deprecated commands intentionally
   - Should remain until the deprecated commands are fully removed in a future change

1. **Archived change specs** - See above

   - Historical context should be preserved

### Testing Strategy

1. Run unit tests for affected commands:

   ```bash
   make test
   ```

1. Specifically run tests for:

   - `test/commands/show.test.ts`
   - `test/commands/change.interactive-show.test.ts`
   - `test/commands/validate.enriched-output.test.ts`
   - `test/commands/change.interactive-validate.test.ts`

1. Manual verification:

   - Run `spool validate` on a change to see updated error messages
   - Run `spool show` on a non-existent change to see updated hints
   - Check that deprecation warnings still appear when using deprecated commands

### Risk Assessment

**Low Risk**: This change only updates text references in error messages, hints, tests, and documentation. The actual functionality of the CLI commands is not changed.

**No Breaking Changes**: The deprecated commands still work and show deprecation warnings. Users can continue using them during the transition period.

### Future Work

A separate future change will:

1. Remove the deprecated `spool change` commands entirely
1. Remove the deprecation warnings
1. Clean up any remaining references

This change is a stepping stone to that eventual removal.
