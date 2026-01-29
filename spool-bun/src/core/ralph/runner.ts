import { RalphOptions, RalphRunConfig, RalphState } from './types.js';
import { loadRalphState, saveRalphState, loadRalphContext } from './state.js';
import { OpenCodeHarness } from './harnesses/opencode.js';
import { buildRalphPrompt } from './context.js';
import {
  resolveChangeId,
  resolveModuleId,
  getModuleById,
  getChangesForModule,
} from '../../utils/item-discovery.js';
import { parseModularChangeName } from '../../core/schemas/index.js';

export async function runRalphLoop(options: RalphOptions): Promise<void> {
  const {
    changeId,
    moduleId,
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
    interactive,
  } = options;

  const resolvedChangeId = changeId ? ((await resolveChangeId(changeId)) ?? changeId) : undefined;

  if (status) {
    await showStatus(resolvedChangeId, moduleId);
    return;
  }

  if (clearContext) {
    if (!resolvedChangeId) {
      throw new Error('--change is required for --clear-context');
    }
    const { clearRalphContext } = await import('./state.js');
    await clearRalphContext(resolvedChangeId);
    console.log(`Cleared Ralph context for ${resolvedChangeId}`);
    return;
  }

  if (addContext) {
    if (!resolvedChangeId) {
      throw new Error('--change is required for --add-context');
    }
    const { appendToRalphContext } = await import('./state.js');
    await appendToRalphContext(resolvedChangeId, addContext);
    console.log(`Added context to ${resolvedChangeId}`);
    return;
  }

  // changeId should now be resolved by the command layer, but double-check
  if (!changeId) {
    throw new Error('Change ID is required for running the loop');
  }

  const loopChangeId = resolvedChangeId ?? changeId;

  let state = await loadRalphState(loopChangeId);
  if (!state) {
    const { initializeRalphState } = await import('./state.js');
    state = await initializeRalphState(loopChangeId);
  }

  const userPrompt = options.prompt || '';

  // Resolve module ID if not provided
  let resolvedModuleId = moduleId;
  if (!resolvedModuleId) {
    // Try to infer module from change ID
    const parsed = parseModularChangeName(loopChangeId);
    if (parsed) {
      resolvedModuleId = parsed.moduleId;
    }
  }

  // Validate module ID exists if specified
  if (resolvedModuleId) {
    const moduleInfo = await getModuleById(resolvedModuleId);
    if (!moduleInfo) {
      console.warn(
        `Warning: Module ${resolvedModuleId} not found, proceeding without module context`
      );
      resolvedModuleId = undefined;
    }
  }

  const agentHarness = createHarness(harness);

  for (let i = state.iteration + 1; i <= maxIterations; i++) {
    console.log(`\n=== Ralph Loop Iteration ${i} ===\n`);

    const contextContent = await loadRalphContext(loopChangeId);

    const prompt = await buildRalphPrompt(userPrompt, {
      changeId: loopChangeId,
      moduleId: resolvedModuleId,
      iteration: i,
      maxIterations: Number.isFinite(maxIterations) ? maxIterations : undefined,
      minIterations,
      completionPromise,
      contextContent,
    });

    const runConfig: RalphRunConfig = {
      prompt,
      model,
      cwd: process.cwd(),
      interactive: interactive !== false && !allowAll,
    };

    const startTime = Date.now();
    let completionPromiseFound = false;

    const onStdout = (data: string) => {
      if (data.includes(`<promise>${completionPromise}</promise>`)) {
        completionPromiseFound = true;
      }
    };

    try {
      agentHarness.on('stdout', onStdout);
      await agentHarness.run(runConfig);
    } catch (error) {
      console.error(`Error in iteration ${i}:`, error);
      throw error;
    } finally {
      agentHarness.off('stdout', onStdout);
    }

    const duration = Date.now() - startTime;

    if (agentHarness instanceof OpenCodeHarness) {
      const fileChangesCount = await countChangedFiles();

      state.history.push({
        timestamp: Date.now(),
        duration,
        completionPromiseFound,
        fileChangesCount,
      });
    } else {
      state.history.push({
        timestamp: Date.now(),
        duration,
        completionPromiseFound,
        fileChangesCount: 0,
      });
    }

    state.iteration = i;
    await saveRalphState(state);

    if (!noCommit) {
      await commitChanges(i);
    }

    if (completionPromiseFound && i >= minIterations) {
      console.log(`\n=== Completion promise "${completionPromise}" detected. Loop complete. ===\n`);
      break;
    }
  }

  agentHarness.stop();
}

function createHarness(harnessName: string) {
  switch (harnessName) {
    case 'opencode':
      return new OpenCodeHarness();
    default:
      throw new Error(`Unknown harness: ${harnessName}`);
  }
}

async function showStatus(changeId?: string, moduleId?: string): Promise<void> {
  // For status, we need a change ID. Try to resolve if missing.
  let resolvedChangeId = changeId;
  if (!resolvedChangeId && moduleId) {
    // Try to find a change for this module
    const changes = await getChangesForModule(moduleId);
    if (changes.length > 0) {
      resolvedChangeId = changes[0]; // Use the first change found
      console.log(
        `No --change specified, showing status for ${resolvedChangeId} (from module ${moduleId})`
      );
    }
  }

  if (!resolvedChangeId) {
    throw new Error('--change is required for --status, or provide --module to auto-select');
  }

  const state = await loadRalphState(resolvedChangeId);

  if (!state) {
    console.log(`No Ralph state found for ${resolvedChangeId}`);
    return;
  }

  console.log(`\n=== Ralph Status for ${resolvedChangeId} ===\n`);
  console.log(`Iteration: ${state.iteration}`);
  console.log(`History entries: ${state.history.length}`);

  if (state.history.length > 0) {
    console.log('\nRecent iterations:');
    const startIndex = Math.max(0, state.history.length - 5);
    state.history.slice(startIndex).forEach((entry, idx) => {
      const iterationNum = startIndex + idx + 1;
      console.log(
        `  ${iterationNum}. ${new Date(entry.timestamp).toLocaleString()} - ${entry.duration}ms - Promise: ${entry.completionPromiseFound} - Changes: ${entry.fileChangesCount}`
      );
    });
  }
}

async function countChangedFiles(): Promise<number> {
  const { execSync } = await import('child_process');
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}

async function commitChanges(iteration: number): Promise<void> {
  const { execSync } = await import('child_process');
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

    const changes = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (!changes.trim()) {
      return;
    }
    execSync('git add -A', { encoding: 'utf-8' });
    execSync(`git commit -m "Ralph loop iteration ${iteration}"`, { encoding: 'utf-8' });
    console.log(`Committed changes after iteration ${iteration}`);
  } catch (error) {
    console.warn('Failed to commit changes:', error);
  }
}
