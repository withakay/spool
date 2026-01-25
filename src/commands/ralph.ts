import { Command } from 'commander';
import { isInteractive } from '../utils/interactive.js';
import {
  getActiveChangeIds,
  getChangesForModule,
  resolveChangeId,
  resolveModuleIdOrThrow,
} from '../utils/item-discovery.js';
import { parseModularChangeName } from '../core/schemas/index.js';
import { runRalphLoop } from '../core/ralph/runner.js';
import { RalphOptions } from '../core/ralph/types.js';

export function registerRalphCommand(program: Command): void {
  const runRalph = async (prompt: string | undefined, options: any) => {
    try {
      // Resolve interactive mode
      const interactiveMode = isInteractive(options);

      // In non-interactive mode we require an explicit target or an auxiliary flag.
      // This avoids attempting discovery/prompts in CI and matches CLI contract.
      const hasTargetOrAux =
        !!options.change ||
        !!options.module ||
        !!options.status ||
        !!options.addContext ||
        !!options.clearContext;
      if (!interactiveMode && !hasTargetOrAux) {
        console.error(
          'Either --change, --module, --status, --add-context, or --clear-context must be specified'
        );
        process.exitCode = 1;
        return;
      }

      // Resolve change and module IDs based on provided options
      const { changeId, moduleId } = await resolveTargeting(options, interactiveMode);

      const ralphOptions: RalphOptions = {
        prompt,
        changeId,
        moduleId,
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
        interactive: interactiveMode,
      };

      await runRalphLoop(ralphOptions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    }
  };

  const registerRalphFlags = (cmd: Command): Command => {
    return cmd
      .description('Run iterative AI loop against a change proposal')
      .option('-c, --change <id>', 'Target a specific change proposal')
      .option('-m, --module <id>', 'Target a specific module')
      .option('--no-interactive', 'Disable interactive prompts')
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
      .option('--clear-context', 'Clear any pending context');
  };

  // Visible command
  registerRalphFlags(program.command('ralph [prompt]')).action(runRalph);

  // Deprecated wrappers
  registerRalphFlags(program.command('x-ralph [prompt]', { hidden: true })).action(async (prompt: string | undefined, options: any) => {
    console.error('Warning: "spool x-ralph" is deprecated. Use "spool ralph" instead.');
    await runRalph(prompt, options);
  });

  registerRalphFlags(program.command('loop [prompt]', { hidden: true })).action(async (prompt: string | undefined, options: any) => {
    console.error('Warning: "spool loop" is deprecated. Use "spool ralph" instead.');
    await runRalph(prompt, options);
  });
}

/**
 * Resolve change and module targeting based on command options and interactive mode
 */
async function resolveTargeting(
  options: any,
  interactiveMode: boolean
): Promise<{ changeId?: string; moduleId?: string }> {
  let { change: changeId, module: moduleId } = options;

  if (moduleId) {
    const moduleInfo = await resolveModuleIdOrThrow(moduleId);
    moduleId = moduleInfo.id;
  }

  // If change is provided but module is not, infer module from change
  if (changeId) {
    const resolvedChangeId = await resolveChangeId(changeId);
    if (resolvedChangeId) changeId = resolvedChangeId;

    if (!moduleId) {
      const parsed = parseModularChangeName(changeId);
      if (parsed) moduleId = parsed.moduleId;
    }
  }

  // If change is still missing, we need to resolve it interactively or error
  if (!changeId) {
    let candidates: string[] = [];
    
    if (moduleId) {
      // Get changes for the specified module
      candidates = await getChangesForModule(moduleId);
    } else {
      // Get all active changes
      candidates = await getActiveChangeIds();
    }

    if (candidates.length === 0) {
      throw new Error(moduleId ? `No changes found for module ${moduleId}` : 'No changes found');
    }

    if (candidates.length === 1) {
      changeId = candidates[0];
    } else if (interactiveMode) {
      // Interactive selection
      const { select } = await import('@inquirer/prompts');
      changeId = await select({
        message: moduleId
          ? `Select a change from module ${moduleId}`
          : 'Select a change to run Ralph against',
        choices: candidates.map(id => ({ name: id, value: id })),
      });
    } else {
      // Non-interactive: list candidates and error
      const errorMsg = moduleId
        ? `Multiple changes found for module ${moduleId}: ${candidates.join(', ')}. Use --change <id> to specify.`
        : `Multiple active changes found: ${candidates.join(', ')}. Use --change <id> to specify or add --module <id> to narrow down.`;
      throw new Error(errorMsg);
    }

    // If we selected (or auto-selected) a change and don't yet have a module ID,
    // infer it from the chosen change.
    if (changeId && !moduleId) {
      const parsed = parseModularChangeName(changeId);
      if (parsed) moduleId = parsed.moduleId;
    }
  }

  return { changeId, moduleId };
}
