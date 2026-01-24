# Patch: Enhance Ralph Command with Interactive Selection and Module Inference

## 1. Update Ralph Runner (`src/core/ralph/runner.ts`)

```typescript
import { RalphOptions, RalphRunConfig, RalphState } from './types.js';
import { loadRalphState, saveRalphState, loadRalphContext } from './state.js';
import { OpenCodeHarness } from './harnesses/opencode.js';
import { buildRalphPrompt } from './context.js';
import { resolveRalphTarget } from './target-resolver.js';
import { isInteractive } from '../../utils/interactive.js';

export async function runRalphLoop(options: RalphOptions): Promise<void> {
  const {
    prompt: userPrompt,
    changeId: explicitChangeId,
    moduleId: explicitModuleId,
    harness = 'opencode',
    model,
    minIterations = 1,
    maxIterations = Infinity,
    completionPromise = 'COMPLETE',
    allowAll = false,
    noCommit = false,
    status,
    addContext,
    clearContext,
  } = options;

  // Handle status and context operations first
  if (status) {
    if (!explicitChangeId) {
      console.error('Error: --change is required for --status');
      process.exit(1);
    }
    await showStatus(explicitChangeId);
    return;
  }

  if (clearContext && explicitChangeId) {
    const { clearRalphContext } = await import('./state.js');
    await clearRalphContext(explicitChangeId);
    console.log(`Cleared Ralph context for ${explicitChangeId}`);
    return;
  }

  if (addContext && explicitChangeId) {
    const { appendToRalphContext } = await import('./state.js');
    await appendToRalphContext(explicitChangeId, addContext);
    console.log(`Added context to ${explicitChangeId}`);
    return;
  }

  // Check if we're in interactive mode
  const interactive = isInteractive(options);

  // Resolve the target (this handles the new interactive selection logic)
  let target;
  try {
    target = await resolveRalphTarget({
      changeId: explicitChangeId,
      moduleId: explicitModuleId,
      interactive,
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Running Ralph against change ${target.changeId} (module: ${target.moduleId})`);

  // Continue with the rest of the existing logic using the resolved target
  let state = await loadRalphState(target.changeId);
  if (!state) {
    const { initializeRalphState } = await import('./state.js');
    state = await initializeRalphState(target.changeId);
  }

  const contextContent = await loadRalphContext(target.changeId);

  const agentHarness = createHarness(harness);

  for (let i = state.iteration + 1; i <= maxIterations; i++) {
    console.log(`\n=== Ralph Loop Iteration ${i} ===\n`);

    const prompt = await buildRalphPrompt(userPrompt || '', { 
      changeId: target.changeId, 
      moduleId: target.moduleId 
    });
    const fullPrompt = contextContent ? `${contextContent}\n\n${prompt}` : prompt;

    const runConfig: RalphRunConfig = {
      prompt: fullPrompt,
      model,
      cwd: process.cwd(),
      interactive: !allowAll,
    };

    // ... rest of the existing loop logic remains the same
  }
}
```

## 2. Update Ralph Command (`src/commands/ralph.ts`)

```typescript
import { Command } from 'commander';
import { runRalphLoop } from '../core/ralph/runner.js';
import { RalphOptions } from '../core/ralph/types.js';

export function registerRalphCommand(program: Command): void {
  const ralphCmd = program
    .command('ralph [prompt]')
    .alias('loop')
    .description('Run iterative AI loop against a change proposal')
    .option('-c, --change <id>', 'Target a specific change proposal')
    .option('-m, --module <id>', 'Target a specific module (prompts for change selection)')
    .option('--harness <agent>', 'Agent harness to use', 'opencode')
    .option('--model <name>', 'Model identifier to pass to harness')
    .option('--min-iterations <n>', 'Minimum iterations before completion allowed', '1')
    .option('--max-iterations <n>', 'Maximum iterations before stopping')
    .option('--completion-promise <text>', 'Phrase that signals completion', 'COMPLETE')
    .option('--allow-all', 'Auto-approve all tool permissions (non-interactive)')
    .option('--yolo', 'Alias for --allow-all')
    .option('--dangerously-allow-all', 'Alias for --allow-all')
    .option('--no-commit', 'Disable auto-commit after each iteration')
    .option('--status', 'Show current Ralph loop status and history')
    .option('--add-context <text>', 'Add context for the next iteration')
    .option('--clear-context', 'Clear any pending context')
    .action(async (prompt: string | undefined, options: any) => {
      try {
        const ralphOptions: RalphOptions = {
          prompt,
          changeId: options.change,
          moduleId: options.module,
          harness: options.harness,
          model: options.model,
          minIterations: options.minIterations ? parseInt(options.minIterations, 10) : 1,
          maxIterations: options.maxIterations ? parseInt(options.maxIterations, 10) : undefined,
          completionPromise: options.completionPromise,
          allowAll: options.allowAll || options.yolo || options.dangerouslyAllowAll,
          // Commander stores `--no-commit` as `options.commit === false`.
          noCommit: options.commit === false,
          status: options.status,
          addContext: options.addContext,
          clearContext: options.clearContext,
          // Pass through interactive-related flags for the interactive detection
          noInteractive: !!(options.allowAll || options.yolo || options.dangerouslyAllowAll),
        };

        await runRalphLoop(ralphOptions);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
```

## 3. Add New Target Resolver (`src/core/ralph/target-resolver.ts`)

```typescript
import { getActiveChangeIds, getChangesForModule } from '../../utils/item-discovery.js';
import { select } from '@inquirer/prompts';
import { parseModularChangeName } from '../../core/schemas/index.js';

export interface RalphTarget {
  changeId: string;
  moduleId: string;
  inferred: boolean; // true if moduleId was inferred from changeId
}

export interface ResolveTargetOptions {
  changeId?: string;
  moduleId?: string;
  interactive: boolean;
  root?: string;
}

/**
 * Resolves the target change and module for Ralph command execution.
 * Handles interactive selection and module inference.
 */
export async function resolveRalphTarget(
  options: ResolveTargetOptions
): Promise<RalphTarget> {
  const { changeId, moduleId, interactive, root = process.cwd() } = options;

  // If change is explicitly provided, validate it and infer module
  if (changeId) {
    const activeChanges = await getActiveChangeIds(root);
    if (!activeChanges.includes(changeId)) {
      throw new Error(`Change ${changeId} not found`);
    }

    const inferredModuleId = inferModuleFromChange(changeId);
    return {
      changeId,
      moduleId: inferredModuleId,
      inferred: true,
    };
  }

  // If module is provided but no change, select from module changes
  if (moduleId) {
    const moduleChanges = await getChangesForModule(moduleId, root);
    
    if (moduleChanges.length === 0) {
      throw new Error(`No changes found for module ${moduleId}`);
    }

    if (moduleChanges.length === 1) {
      return {
        changeId: moduleChanges[0],
        moduleId,
        inferred: false,
      };
    }

    if (!interactive) {
      throw new Error(`Multiple changes found for module ${moduleId}. Use --change to specify or run in interactive mode.`);
    }

    const selectedChange = await select({
      message: `Select a change from module ${moduleId}`,
      choices: moduleChanges.map(change => ({
        name: change,
        value: change,
      })),
    });

    return {
      changeId: selectedChange,
      moduleId,
      inferred: false,
    };
  }

  // Neither change nor module provided - prompt for change selection
  const activeChanges = await getActiveChangeIds(root);
  
  if (activeChanges.length === 0) {
    throw new Error('No changes found');
  }

  if (activeChanges.length === 1) {
    const singleChange = activeChanges[0];
    const inferredModuleId = inferModuleFromChange(singleChange);
    return {
      changeId: singleChange,
      moduleId: inferredModuleId,
      inferred: true,
    };
  }

  if (!interactive) {
    throw new Error('Change selection requires interactive mode. Use --change to specify or run in interactive mode.');
  }

  const selectedChange = await select({
    message: 'Select a change to run Ralph against',
    choices: activeChanges.map(change => ({
      name: change,
      value: change,
    })),
  });

  const inferredModuleId = inferModuleFromChange(selectedChange);
  return {
    changeId: selectedChange,
    moduleId: inferredModuleId,
    inferred: true,
  };
}

/**
 * Extract module ID from a change ID.
 */
export function inferModuleFromChange(changeId: string): string {
  const parsed = parseModularChangeName(changeId);
  if (!parsed) {
    throw new Error(`Invalid change ID format: ${changeId}`);
  }
  return parsed.moduleId;
}
```

## 4. Update Ralph Types (`src/core/ralph/types.ts`)

```typescript
// Add new optional properties to RalphOptions
export interface RalphOptions {
  prompt?: string;
  changeId?: string;
  moduleId?: string;
  harness?: 'opencode' | 'claude-code' | 'codex' | 'github-copilot';
  model?: string;
  minIterations?: number;
  maxIterations?: number;
  completionPromise?: string;
  allowAll?: boolean;
  noCommit?: boolean;
  interactive?: boolean;
  noInteractive?: boolean; // Add this for interactive detection
  status?: boolean;
  addContext?: string;
  clearContext?: boolean;
}
```

## Test Files Created

1. `test/commands/ralph.interactive-selection.test.ts` - End-to-end CLI tests with mocking
2. `test/utils/item-discovery.test.ts` - Unit tests for item discovery utilities  
3. `test/core/ralph/target-resolver.test.ts` - Unit tests for the target resolution logic
4. `test/core/ralph/integration.test.ts` - Integration tests with the full command

## Key Features Tested

- **Interactive selection**: Mocked inquirer prompts for change selection
- **Module inference**: Automatic module ID extraction from change IDs
- **Error handling**: Proper error messages for edge cases
- **Non-interactive mode**: Graceful failure when no explicit targets provided
- **Single-change auto-selection**: No prompting when only one option exists
- **Module-scoped selection**: Filtering changes by module when `--module` provided

## Mock Strategy

- **@inquirer/prompts**: Mocked to avoid real interactive prompts
- **Filesystem operations**: Use temporary directories with realistic test data
- **Ralph runner**: Mocked to avoid actual AI execution
- **Item discovery**: Can be mocked or use real filesystem depending on test needs

## Benefits

1. **No real interactive prompts** - All user interactions are mocked
2. **No real AI execution** - Ralph runner is mocked in integration tests  
3. **Realistic test data** - Uses actual filesystem structure but in temp dirs
4. **Comprehensive coverage** - Tests all paths through the resolution logic
5. **Fast execution** - Tests run quickly without external dependencies