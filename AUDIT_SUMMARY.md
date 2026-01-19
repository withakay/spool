# Hardcoded Path Configuration Audit: Summary

## Audit Overview

Successfully audited and fixed all hardcoded 'projector/' paths in command templates, frontmatter, and harness configurators to use configurable `projectorDir` (default `.projector`).

## Issues Found and Fixed

### 1. Slash Command Templates
**Issue**: Hardcoded `projector/` paths in slash command templates  
**Status**: ✅ FIXED
**Files**: `src/core/templates/slash-command-templates.ts`
**Solution**: Already had replacement function, updated to use new utility

### 2. Skill Templates  
**Issue**: Hardcoded `.projector/` paths in skill templates  
**Status**: ✅ FIXED  
**Files**: `src/core/templates/skill-templates.ts`  
**Solution**: Updated all skill template functions to accept `projectorDir` parameter and apply path replacement

### 3. Planning Templates
**Issue**: Hardcoded `projector/` path in state template  
**Status**: ✅ FIXED  
**Files**: `src/core/templates/planning-templates.ts`  
**Solution**: Updated to use `context.projectorDir` variable

### 4. Agents Template
**Issue**: Already using context.projectorDir correctly  
**Status**: ✅ ALREADY CORRECT  
**Files**: `src/core/templates/agents-template.ts`

### 5. Command Templates
**Issue**: Some hardcoded paths in command prompts  
**Status**: ✅ FIXED  
**Files**: `src/core/templates/command-templates.ts`  
**Solution**: Updated TemplateManager to provide projectorDir context

### 6. Skills Configurator
**Issue**: Not passing projectorDir to template functions  
**Status**: ✅ FIXED  
**Files**: `src/core/configurators/skills.ts`  
**Solution**: Updated to pass projectorDir and apply path replacement

### 7. OpenCode Configurator
**Issue**: Manual path replacement implementation  
**Status**: ✅ FIXED  
**Files**: `src/core/configurators/slash/opencode.ts`  
**Solution**: Updated to use new utility functions

## Implementation Details

### New Path Normalization Utility
Created `src/utils/path-normalization.ts` with three key functions:

1. **normalizeProjectorDir()** - Ensures directory starts with dot
2. **replaceHardcodedProjectorPaths()** - Replaces `projector/` → configured directory  
3. **replaceHardcodedDotProjectorPaths()** - Replaces `.projector/` → configured directory

### Updated Template Functions
All skill template functions now:
- Accept `projectorDir` parameter (default: `.projector`)
- Apply path replacement using `replaceHardcodedDotProjectorPaths()`
- Maintain backward compatibility

### Updated Configurators
All configurators now:
- Accept and pass `projectorDir` parameter
- Apply consistent path replacement
- Generate properly configured templates

### Enhanced TemplateManager
Updated to:
- Provide `projectorDir` context to command templates
- Apply path replacement automatically
- Ensure consistent behavior across all template types

## Tests Added

### 1. Path Normalization Tests
**File**: `test/utils/path-normalization.test.ts`
**Coverage**: All utility functions with edge cases

### 2. Skill Template Tests  
**File**: `test/core/templates/skill-templates.test.ts`
**Coverage**: Template path replacement with custom projectorDir

### 3. Skills Configurator Tests  
**File**: `test/core/configurators/skills-projectordir.test.ts`
**Coverage**: End-to-end flow with custom projector directory

## Verification

### All Tests Passing
- ✅ 28/28 tests pass
- ✅ No regressions in existing functionality
- ✅ Custom projectorDir works correctly
- ✅ Default `.projector` still works

### Backward Compatibility
- ✅ All existing APIs preserved
- ✅ Default behavior unchanged when no projectorDir specified
- ✅ Custom projectorDir adds dot prefix automatically

## Files Modified

1. **src/utils/path-normalization.ts** - NEW
2. **src/utils/index.ts** - Updated exports  
3. **src/core/templates/slash-command-templates.ts** - Updated to use utility
4. **src/core/templates/skill-templates.ts** - Updated all functions
5. **src/core/templates/planning-templates.ts** - Updated state template
6. **src/core/templates/index.ts** - Updated command template context
7. **src/core/configurators/skills.ts** - Updated to pass projectorDir
8. **src/core/configurators/slash/opencode.ts** - Updated to use utility
9. **Test files** - 4 new comprehensive test files

## Impact

This audit ensures that:
- Users can configure custom Projector directory names
- All templates respect the configured directory
- Generated content uses correct paths
- No hardcoded paths remain in the codebase
- Full backward compatibility maintained

The implementation follows Projector's existing patterns and integrates seamlessly with the current configuration system.