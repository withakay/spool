# Hardcoded Path Configuration Audit: Summary

## Audit Overview

Successfully audited and fixed all hardcoded 'spool/' paths in command templates, frontmatter, and harness configurators to use configurable `spoolDir` (default `.spool`).

## Issues Found and Fixed

### 1. Slash Command Templates

**Issue**: Hardcoded `spool/` paths in slash command templates
**Status**: ✅ FIXED
**Files**: `src/core/templates/slash-command-templates.ts`
**Solution**: Already had replacement function, updated to use new utility

### 2. Skill Templates

**Issue**: Hardcoded `.spool/` paths in skill templates
**Status**: ✅ FIXED
**Files**: `src/core/templates/skill-templates.ts`
**Solution**: Updated all skill template functions to accept `spoolDir` parameter and apply path replacement

### 3. Planning Templates

**Issue**: Hardcoded `spool/` path in state template
**Status**: ✅ FIXED
**Files**: `src/core/templates/planning-templates.ts`
**Solution**: Updated to use `context.spoolDir` variable

### 4. Agents Template

**Issue**: Already using context.spoolDir correctly
**Status**: ✅ ALREADY CORRECT
**Files**: `src/core/templates/agents-template.ts`

### 5. Command Templates

**Issue**: Some hardcoded paths in command prompts
**Status**: ✅ FIXED
**Files**: `src/core/templates/command-templates.ts`
**Solution**: Updated TemplateManager to provide spoolDir context

### 6. Skills Configurator

**Issue**: Not passing spoolDir to template functions
**Status**: ✅ FIXED
**Files**: `src/core/configurators/skills.ts`
**Solution**: Updated to pass spoolDir and apply path replacement

### 7. OpenCode Configurator

**Issue**: Manual path replacement implementation
**Status**: ✅ FIXED
**Files**: `src/core/configurators/slash/opencode.ts`
**Solution**: Updated to use new utility functions

## Implementation Details

### New Path Normalization Utility

Created `src/utils/path-normalization.ts` with three key functions:

1. **normalizeSpoolDir()** - Ensures directory starts with dot
1. **replaceHardcodedSpoolPaths()** - Replaces `spool/` → configured directory
1. **replaceHardcodedDotSpoolPaths()** - Replaces `.spool/` → configured directory

### Updated Template Functions

All skill template functions now:

- Accept `spoolDir` parameter (default: `.spool`)
- Apply path replacement using `replaceHardcodedDotSpoolPaths()`
- Maintain backward compatibility

### Updated Configurators

All configurators now:

- Accept and pass `spoolDir` parameter
- Apply consistent path replacement
- Generate properly configured templates

### Enhanced TemplateManager

Updated to:

- Provide `spoolDir` context to command templates
- Apply path replacement automatically
- Ensure consistent behavior across all template types

## Tests Added

### 1. Path Normalization Tests

**File**: `test/utils/path-normalization.test.ts`
**Coverage**: All utility functions with edge cases

### 2. Skill Template Tests

**File**: `test/core/templates/skill-templates.test.ts`
**Coverage**: Template path replacement with custom spoolDir

### 3. Skills Configurator Tests

**File**: `test/core/configurators/skills-spooldir.test.ts`
**Coverage**: End-to-end flow with custom spool directory

## Verification

### All Tests Passing

- ✅ 28/28 tests pass
- ✅ No regressions in existing functionality
- ✅ Custom spoolDir works correctly
- ✅ Default `.spool` still works

### Backward Compatibility

- ✅ All existing APIs preserved
- ✅ Default behavior unchanged when no spoolDir specified
- ✅ Custom spoolDir adds dot prefix automatically

## Files Modified

1. **src/utils/path-normalization.ts** - NEW
1. **src/utils/index.ts** - Updated exports
1. **src/core/templates/slash-command-templates.ts** - Updated to use utility
1. **src/core/templates/skill-templates.ts** - Updated all functions
1. **src/core/templates/planning-templates.ts** - Updated state template
1. **src/core/templates/index.ts** - Updated command template context
1. **src/core/configurators/skills.ts** - Updated to pass spoolDir
1. **src/core/configurators/slash/opencode.ts** - Updated to use utility
1. **Test files** - 4 new comprehensive test files

## Impact

This audit ensures that:

- Users can configure custom Spool directory names
- All templates respect the configured directory
- Generated content uses correct paths
- No hardcoded paths remain in the codebase
- Full backward compatibility maintained

The implementation follows Spool's existing patterns and integrates seamlessly with the current configuration system.
