/**
 * Agent CLI Commands
 *
 * Commands that generate machine-readable output for AI agent consumption.
 * These commands are not intended for direct human use.
 */

import type { Command } from 'commander';
import { instructionsCommand, type InstructionsOptions } from './artifact-workflow.js';

/**
 * Register agent commands with the CLI
 */
export function registerAgentCommands(program: Command): void {
  const agent = program
    .command('agent')
    .description('Commands that generate machine-readable output for AI agents');

  // agent instruction [artifact] - Generate enriched artifact instructions
  agent
    .command('instruction [artifact]')
    .description('Generate enriched instructions for creating an artifact')
    .option('--change <name>', 'Change name (e.g., "001-01_my-change")')
    .option('--schema <name>', 'Schema to use (defaults to change metadata or "spec-driven")')
    .option('--json', 'Output as JSON instead of formatted text')
    .action(async (artifact: string | undefined, options: InstructionsOptions) => {
      await instructionsCommand(artifact, options);
    });
}
