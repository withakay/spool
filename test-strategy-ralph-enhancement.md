# Test Strategy for Ralph Command Gaps Fix

## Overview

This document outlines a comprehensive testing strategy for the ralph command enhancement that adds interactive selection and module inference capabilities. The strategy focuses on avoiding real interactive prompts and filesystem dependencies while providing thorough test coverage.

## Test Architecture

### 1. Unit Tests (`test/core/ralph/target-resolver.test.ts`)

**Purpose**: Test the core logic for target resolution and module inference

**Approach**: 
- Mock all external dependencies (`item-discovery`, `@inquirer/prompts`)
- Focus on pure business logic
- Test all code paths and edge cases

**Key Test Scenarios**:
- Explicit `--change` validation and module inference
- Module-scoped selection with single/multiple changes
- Interactive selection from all available changes
- Non-interactive mode error handling
- Invalid input validation

### 2. Utility Tests (`test/utils/item-discovery.test.ts`)

**Purpose**: Test filesystem discovery utilities that the ralph command depends on

**Approach**:
- Use temporary directories with realistic test data
- Test actual filesystem operations in isolation
- Verify proper filtering and sorting behavior

**Key Test Scenarios**:
- Active change discovery
- Module-specific change filtering  
- Module info extraction
- ID resolution with flexible inputs
- Hidden directory and archive handling

### 3. CLI Integration Tests (`test/commands/ralph.interactive-selection.test.ts`)

**Purpose**: Test the full CLI command flow with mocked external dependencies

**Approach**:
- Use `runCLI` helper for realistic command execution
- Mock `@inquirer/prompts` to avoid actual interactive prompts
- Mock `runRalphLoop` to avoid AI execution
- Use temporary directories with real `.spool` structure

**Key Test Scenarios**:
- Interactive change selection with multiple options
- Auto-selection with single change
- Module-scoped interactive selection
- Non-interactive mode enforcement
- Error handling and user feedback

### 4. Integration Tests (`test/core/ralph/integration.test.ts`)

**Purpose**: Test the complete flow from command registration to target resolution

**Approach**:
- Mock the entire ralph system (`runner`, `target-resolver`, `prompts`)
- Test command registration and option parsing
- Verify proper integration between components
- Simulate real-world usage patterns

## Mock Strategy

### Inquirer Prompts (`@inquirer/prompts`)

```typescript
// Global mock in test files
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  confirm: vi.fn(),
  input: vi.fn(),
}));

// Usage in tests
const { select } = await import('@inquirer/prompts');
vi.mocked(select).mockResolvedValueOnce('001-01_add-auth');
```

### Ralph Runner

```typescript
// Mock to avoid actual AI execution
vi.mock('../../src/core/ralph/runner.js', () => ({
  runRalphLoop: vi.fn(),
}));

// Verify calls in tests
expect(runRalphLoop).toHaveBeenCalledWith(expectedOptions);
```

### Filesystem Operations

```typescript
// Create realistic test structure
const changesPath = getChangesPath(tempDir);
await fs.mkdir(path.join(changesPath, '001-01_add-auth'), { recursive: true });
await fs.writeFile(
  path.join(changesPath, '001-01_add-auth', 'proposal.md'),
  '# Change: Add Auth\n\n## Why\nNeed auth.',
  'utf-8'
);
```

## Test Data Strategy

### Realistic Change Structure

```
.spool/
├── changes/
│   ├── 001-01_add-auth/
│   │   └── proposal.md
│   ├── 001-02_improve-login/
│   │   └── proposal.md
│   └── 002-01_update-buttons/
│       └── proposal.md
└── modules/
    ├── 001_auth/
    │   └── module.md
    └── 002_ui/
        └── module.md
```

### Edge Cases Covered

- Empty project (no changes/modules)
- Single change/module (no prompting needed)
- Multiple changes in same module
- Cross-module changes
- Invalid/missing files
- Hidden directories and archive folders

## Environment Testing

### Interactive Mode Detection

```typescript
// Force interactive mode
env: { SPOOL_INTERACTIVE: '1' }

// Force non-interactive mode  
env: { SPOOL_INTERACTIVE: '0' }

// Simulate CI environment
env: { CI: 'true' }
```

### Working Directory Management

```typescript
beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `spool-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tempDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await fs.rm(tempDir, { recursive: true, force: true });
});
```

## Coverage Goals

### Code Paths Tested

1. **Happy Paths**:
   - Interactive selection with multiple options
   - Auto-selection with single option
   - Explicit target specification
   - Module inference from change ID

2. **Error Paths**:
   - No changes found
   - Invalid change/module IDs
   - Non-interactive mode without explicit target
   - Multiple module changes without interactive mode

3. **Edge Cases**:
   - Empty directories
   - Malformed change IDs
   - Missing proposal files
   - CI environment restrictions

### Coverage Metrics Target

- **Line Coverage**: >90% for new code
- **Branch Coverage**: >85% for conditional logic
- **Function Coverage**: 100% for public APIs

## Performance Considerations

### Fast Test Execution

- Use mocks instead of real I/O operations where possible
- Parallel test execution with proper isolation
- Minimal test data setup
- Cleanup after each test

### Memory Management

```typescript
// Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

// Explicit cleanup of temp directories
afterAll(async () => {
  await Promise.all(tempRoots.map(dir => 
    fs.rm(dir, { recursive: true, force: true })
  ));
});
```

## Continuous Integration

### CI Environment Handling

```typescript
// Tests that verify CI behavior
it('should force non-interactive mode in CI', async () => {
  const result = await runCLI(['ralph'], {
    env: { CI: 'true' },
  });
  
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('requires interactive mode');
});
```

### Deterministic Test Results

- No reliance on real user input
- Fixed test data and mock responses
- Predictable file timestamps and ordering
- Environment-independent test logic

## Benefits of This Strategy

1. **No Real Dependencies**: Tests run fast and reliably without external systems
2. **Comprehensive Coverage**: All user scenarios and edge cases are tested
3. **Maintainable**: Clear separation of concerns makes tests easy to understand and modify
4. **CI-Friendly**: Tests run consistently in any environment
5. **Developer-Friendly**: Local testing is fast and doesn't require special setup

## Implementation Checklist

- [ ] Create target-resolver module with unit tests
- [ ] Add item-discovery utility tests
- [ ] Implement CLI integration tests with mocking
- [ ] Add end-to-end integration tests
- [ ] Set up CI environment variables
- [ ] Configure coverage reporting
- [ ] Document test patterns for future development

This testing strategy ensures the ralph command enhancement is thoroughly tested while maintaining fast execution and reliability across different environments.