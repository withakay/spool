import { Command } from 'commander';
import { runRalphLoop } from '../core/ralph/runner.js';
import { RalphOptions } from '../core/ralph/types.js';

export function registerRalphCommand(program: Command): void {
  const ralphCmd = program
    .command('ralph [prompt]')
    .alias('loop')
    .description('Run iterative AI loop against a change proposal')
    .option('-c, --change <id>', 'Target a specific change proposal')
    .option('-m, --module <id>', 'Target a specific module')
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
          noCommit: options.noCommit,
          status: options.status,
          addContext: options.addContext,
          clearContext: options.clearContext,
        };

        await runRalphLoop(ralphOptions);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
