import { RalphOptions, RalphRunConfig, RalphState } from './types.js';
import { loadRalphState, saveRalphState, loadRalphContext } from './state.js';
import { OpenCodeHarness } from './harnesses/opencode.js';
import { buildRalphPrompt } from './context.js';

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
  } = options;

  if (!changeId && !moduleId && !status && !addContext && !clearContext) {
    console.error('Error: Either --change, --module, --status, --add-context, or --clear-context must be specified');
    process.exit(1);
  }

  if (status) {
    await showStatus(changeId);
    return;
  }

  if (clearContext && changeId) {
    const { clearRalphContext } = await import('./state.js');
    await clearRalphContext(changeId);
    console.log(`Cleared Ralph context for ${changeId}`);
    return;
  }

  if (addContext && changeId) {
    const { appendToRalphContext } = await import('./state.js');
    await appendToRalphContext(changeId, addContext);
    console.log(`Added context to ${changeId}`);
    return;
  }

  if (!changeId) {
    console.error('Error: --change is required for running the loop');
    process.exit(1);
  }

  let state = await loadRalphState(changeId);
  if (!state) {
    const { initializeRalphState } = await import('./state.js');
    state = await initializeRalphState(changeId);
  }

  const contextContent = await loadRalphContext(changeId);
  const userPrompt = options.prompt || '';

  const agentHarness = createHarness(harness);

  for (let i = state.iteration + 1; i <= maxIterations; i++) {
    console.log(`\n=== Ralph Loop Iteration ${i} ===\n`);

    const prompt = await buildRalphPrompt(userPrompt, { changeId, moduleId });
    const fullPrompt = contextContent ? `${contextContent}\n\n${prompt}` : prompt;

    const runConfig: RalphRunConfig = {
      prompt: fullPrompt,
      model,
      cwd: process.cwd(),
      interactive: !allowAll,
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

async function showStatus(changeId?: string): Promise<void> {
  if (!changeId) {
    console.error('Error: --change is required for --status');
    process.exit(1);
  }

  const state = await loadRalphState(changeId);
  
  if (!state) {
    console.log(`No Ralph state found for ${changeId}`);
    return;
  }

  console.log(`\n=== Ralph Status for ${changeId} ===\n`);
  console.log(`Iteration: ${state.iteration}`);
  console.log(`History entries: ${state.history.length}`);
  
  if (state.history.length > 0) {
    console.log('\nRecent iterations:');
    const startIndex = Math.max(0, state.history.length - 5);
    state.history.slice(startIndex).forEach((entry, idx) => {
      const iterationNum = startIndex + idx + 1;
      console.log(`  ${iterationNum}. ${new Date(entry.timestamp).toLocaleString()} - ${entry.duration}ms - Promise: ${entry.completionPromiseFound} - Changes: ${entry.fileChangesCount}`);
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
