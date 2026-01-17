import { Command } from 'commander';
import { createRequire } from 'module';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import { AI_TOOLS } from '../core/config.js';
import { UpdateCommand } from '../core/update.js';
import { ListCommand } from '../core/list.js';
import { ArchiveCommand } from '../core/archive.js';
import { ViewCommand } from '../core/view.js';
import { registerSpecCommand } from '../commands/spec.js';
import { ChangeCommand } from '../commands/change.js';
import { ValidateCommand } from '../commands/validate.js';
import { ShowCommand } from '../commands/show.js';
import { CompletionCommand } from '../commands/completion.js';
import { registerConfigCommand } from '../commands/config.js';
import { registerArtifactWorkflowCommands } from '../commands/artifact-workflow.js';
import { registerModuleCommand } from '../commands/module.js';
import { maybeShowTelemetryNotice, trackCommand, shutdown } from '../telemetry/index.js';
import { StateCommand } from '../commands/state.js';
import { PlanCommand } from '../commands/plan.js';
import { TasksCommand } from '../commands/tasks.js';
import { AgentConfigCommand } from '../commands/agent-config.js';
import { WorkflowCommand } from '../commands/workflow.js';

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

/**
 * Get the full command path for nested commands.
 * For example: 'change show' -> 'change:show'
 */
function getCommandPath(command: Command): string {
  const names: string[] = [];
  let current: Command | null = command;

  while (current) {
    const name = current.name();
    // Skip the root 'openspec' command
    if (name && name !== 'openspec') {
      names.unshift(name);
    }
    current = current.parent;
  }

  return names.join(':') || 'openspec';
}

program
  .name('openspec')
  .description('AI-native system for spec-driven development')
  .version(version);

// Global options
program.option('--no-color', 'Disable color output');

// Apply global flags and telemetry before any command runs
// Note: preAction receives (thisCommand, actionCommand) where:
// - thisCommand: the command where hook was added (root program)
// - actionCommand: the command actually being executed (subcommand)
program.hook('preAction', async (thisCommand, actionCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }

  // Show first-run telemetry notice (if not seen)
  await maybeShowTelemetryNotice();

  // Track command execution (use actionCommand to get the actual subcommand)
  const commandPath = getCommandPath(actionCommand);
  await trackCommand(commandPath, version);
});

// Shutdown telemetry after command completes
program.hook('postAction', async () => {
  await shutdown();
});

const availableToolIds = AI_TOOLS.filter((tool) => tool.available).map((tool) => tool.value);
const toolsOptionDescription = `Configure AI tools non-interactively. Use "all", "none", or a comma-separated list of: ${availableToolIds.join(', ')}`;

program
  .command('init [path]')
  .description('Initialize OpenSpec in your project')
  .option('--tools <tools>', toolsOptionDescription)
  .action(async (targetPath = '.', options?: { tools?: string }) => {
    try {
      // Validate that the path is a valid directory
      const resolvedPath = path.resolve(targetPath);
      
      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isDirectory()) {
          throw new Error(`Path "${targetPath}" is not a directory`);
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // Directory doesn't exist, but we can create it
          console.log(`Directory "${targetPath}" doesn't exist, it will be created.`);
        } else if (error.message && error.message.includes('not a directory')) {
          throw error;
        } else {
          throw new Error(`Cannot access path "${targetPath}": ${error.message}`);
        }
      }
      
      const { InitCommand } = await import('../core/init.js');
      const initCommand = new InitCommand({
        tools: options?.tools,
      });
      await initCommand.execute(targetPath);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('update [path]')
  .description('Update OpenSpec instruction files')
  .action(async (targetPath = '.') => {
    try {
      const resolvedPath = path.resolve(targetPath);
      const updateCommand = new UpdateCommand();
      await updateCommand.execute(resolvedPath);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List items (changes by default). Use --specs to list specs.')
  .option('--specs', 'List specs instead of changes')
  .option('--changes', 'List changes explicitly (default)')
  .option('--sort <order>', 'Sort order: "recent" (default) or "name"', 'recent')
  .option('--json', 'Output as JSON (for programmatic use)')
  .action(async (options?: { specs?: boolean; changes?: boolean; sort?: string; json?: boolean }) => {
    try {
      const listCommand = new ListCommand();
      const mode: 'changes' | 'specs' = options?.specs ? 'specs' : 'changes';
      const sort = options?.sort === 'name' ? 'name' : 'recent';
      await listCommand.execute('.', mode, { sort, json: options?.json });
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('view')
  .description('Display an interactive dashboard of specs and changes')
  .action(async () => {
    try {
      const viewCommand = new ViewCommand();
      await viewCommand.execute('.');
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Change command with subcommands
const changeCmd = program
  .command('change')
  .description('Manage OpenSpec change proposals');

// Deprecation notice for noun-based commands
changeCmd.hook('preAction', () => {
  console.error('Warning: The "openspec change ..." commands are deprecated. Prefer verb-first commands (e.g., "openspec list", "openspec validate --changes").');
});

changeCmd
  .command('show [change-name]')
  .description('Show a change proposal in JSON or markdown format')
  .option('--json', 'Output as JSON')
  .option('--deltas-only', 'Show only deltas (JSON only)')
  .option('--requirements-only', 'Alias for --deltas-only (deprecated)')
  .option('--no-interactive', 'Disable interactive prompts')
  .action(async (changeName?: string, options?: { json?: boolean; requirementsOnly?: boolean; deltasOnly?: boolean; noInteractive?: boolean }) => {
    try {
      const changeCommand = new ChangeCommand();
      await changeCommand.show(changeName, options);
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  });

changeCmd
  .command('list')
  .description('List all active changes (DEPRECATED: use "openspec list" instead)')
  .option('--json', 'Output as JSON')
  .option('--long', 'Show id and title with counts')
  .action(async (options?: { json?: boolean; long?: boolean }) => {
    try {
      console.error('Warning: "openspec change list" is deprecated. Use "openspec list".');
      const changeCommand = new ChangeCommand();
      await changeCommand.list(options);
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  });

changeCmd
  .command('validate [change-name]')
  .description('Validate a change proposal')
  .option('--strict', 'Enable strict validation mode')
  .option('--json', 'Output validation report as JSON')
  .option('--no-interactive', 'Disable interactive prompts')
  .action(async (changeName?: string, options?: { strict?: boolean; json?: boolean; noInteractive?: boolean }) => {
    try {
      const changeCommand = new ChangeCommand();
      await changeCommand.validate(changeName, options);
      if (typeof process.exitCode === 'number' && process.exitCode !== 0) {
        process.exit(process.exitCode);
      }
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  });

program
  .command('archive [change-name]')
  .description('Archive a completed change and update main specs')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--skip-specs', 'Skip spec update operations (useful for infrastructure, tooling, or doc-only changes)')
  .option('--no-validate', 'Skip validation (not recommended, requires confirmation)')
  .action(async (changeName?: string, options?: { yes?: boolean; skipSpecs?: boolean; noValidate?: boolean; validate?: boolean }) => {
    try {
      const archiveCommand = new ArchiveCommand();
      await archiveCommand.execute(changeName, options);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

registerSpecCommand(program);
registerConfigCommand(program);
registerModuleCommand(program);

// Top-level validate command
program
  .command('validate [item-name]')
  .description('Validate changes, specs, and modules')
  .option('--all', 'Validate all changes, specs, and modules')
  .option('--changes', 'Validate all changes')
  .option('--specs', 'Validate all specs')
  .option('--modules', 'Validate all modules')
  .option('--module <id>', 'Validate a specific module by ID')
  .option('--type <type>', 'Specify item type when ambiguous: change|spec|module')
  .option('--strict', 'Enable strict validation mode')
  .option('--json', 'Output validation results as JSON')
  .option('--concurrency <n>', 'Max concurrent validations (defaults to env OPENSPEC_CONCURRENCY or 6)')
  .option('--no-interactive', 'Disable interactive prompts')
  .action(async (itemName?: string, options?: { all?: boolean; changes?: boolean; specs?: boolean; modules?: boolean; module?: string; type?: string; strict?: boolean; json?: boolean; noInteractive?: boolean; concurrency?: string }) => {
    try {
      const validateCommand = new ValidateCommand();
      await validateCommand.execute(itemName, options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Top-level show command
program
  .command('show [item-name]')
  .description('Show a change or spec')
  .option('--json', 'Output as JSON')
  .option('--type <type>', 'Specify item type when ambiguous: change|spec')
  .option('--no-interactive', 'Disable interactive prompts')
  // change-only flags
  .option('--deltas-only', 'Show only deltas (JSON only, change)')
  .option('--requirements-only', 'Alias for --deltas-only (deprecated, change)')
  // spec-only flags
  .option('--requirements', 'JSON only: Show only requirements (exclude scenarios)')
  .option('--no-scenarios', 'JSON only: Exclude scenario content')
  .option('-r, --requirement <id>', 'JSON only: Show specific requirement by ID (1-based)')
  // allow unknown options to pass-through to underlying command implementation
  .allowUnknownOption(true)
  .action(async (itemName?: string, options?: { json?: boolean; type?: string; noInteractive?: boolean; [k: string]: any }) => {
    try {
      const showCommand = new ShowCommand();
      await showCommand.execute(itemName, options ?? {});
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Completion command with subcommands
const completionCmd = program
  .command('completion')
  .description('Manage shell completions for OpenSpec CLI');

completionCmd
  .command('generate [shell]')
  .description('Generate completion script for a shell (outputs to stdout)')
  .action(async (shell?: string) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.generate({ shell });
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

completionCmd
  .command('install [shell]')
  .description('Install completion script for a shell')
  .option('--verbose', 'Show detailed installation output')
  .action(async (shell?: string, options?: { verbose?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.install({ shell, verbose: options?.verbose });
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

completionCmd
  .command('uninstall [shell]')
  .description('Uninstall completion script for a shell')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (shell?: string, options?: { yes?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.uninstall({ shell, yes: options?.yes });
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Hidden command for machine-readable completion data
program
  .command('__complete <type>', { hidden: true })
  .description('Output completion data in machine-readable format (internal use)')
  .action(async (type: string) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.complete({ type });
    } catch (error) {
      // Silently fail for graceful shell completion experience
      process.exitCode = 1;
    }
  });

// Register artifact workflow commands (experimental)
registerArtifactWorkflowCommands(program);

// State command for project state management
const stateCmd = program
  .command('state')
  .description('Manage project state (decisions, blockers, notes)');

stateCmd
  .command('show')
  .description('Display current project state')
  .action(() => runCommandAction(async () => {
    const stateCommand = new StateCommand();
    await stateCommand.show('.');
  }));
  });

stateCmd
  .command('decision <text>')
  .description('Record a decision')
  .action(async (text: string) => {
    try {
      const stateCommand = new StateCommand();
      await stateCommand.addDecision(text, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

stateCmd
  .command('blocker <text>')
  .description('Record a blocker')
  .action(async (text: string) => {
    try {
      const stateCommand = new StateCommand();
      await stateCommand.addBlocker(text, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

stateCmd
  .command('note <text>')
  .description('Add a session note')
  .action(async (text: string) => {
    try {
      const stateCommand = new StateCommand();
      await stateCommand.addNote(text, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

stateCmd
  .command('focus <text>')
  .description('Set current focus')
  .action(async (text: string) => {
    try {
      const stateCommand = new StateCommand();
      await stateCommand.setFocus(text, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

stateCmd
  .command('question <text>')
  .description('Add an open question')
  .action(async (text: string) => {
    try {
      const stateCommand = new StateCommand();
      await stateCommand.addQuestion(text, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Plan command for roadmap and milestone management
const planCmd = program
  .command('plan')
  .description('Manage project planning (milestones, phases, roadmap)');

planCmd
  .command('init')
  .description('Initialize planning structure')
  .action(async () => {
    try {
      const planCommand = new PlanCommand();
      await planCommand.init('.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

planCmd
  .command('status')
  .description('Show roadmap progress')
  .action(async () => {
    try {
      const planCommand = new PlanCommand();
      await planCommand.status('.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

planCmd
  .command('milestone <name>')
  .description('Add a new milestone')
  .option('-t, --target <target>', 'Milestone target/goal')
  .action(async (name: string, options?: { target?: string }) => {
    try {
      const planCommand = new PlanCommand();
      await planCommand.addMilestone(name, options?.target, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

planCmd
  .command('phase <milestone> <name>')
  .description('Add a phase to a milestone')
  .action(async (milestone: string, name: string) => {
    try {
      const planCommand = new PlanCommand();
      await planCommand.addPhase(milestone, name, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Tasks command for enhanced task management
const tasksCmd = program
  .command('tasks')
  .description('Manage tasks with waves, verification, and completion criteria');

tasksCmd
  .command('init <change-id>')
  .description('Initialize enhanced tasks.md for a change')
  .action(async (changeId: string) => {
    try {
      const tasksCommand = new TasksCommand();
      await tasksCommand.init(changeId, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

tasksCmd
  .command('status <change-id>')
  .description('Show task progress for a change')
  .action(async (changeId: string) => {
    try {
      const tasksCommand = new TasksCommand();
      await tasksCommand.status(changeId, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

tasksCmd
  .command('add <change-id> <task-name>')
  .description('Add a task to a change')
  .option('-w, --wave <wave>', 'Wave number', '1')
  .action(async (changeId: string, taskName: string, options?: { wave?: string }) => {
    try {
      const tasksCommand = new TasksCommand();
      await tasksCommand.add(changeId, taskName, parseInt(options?.wave || '1'), '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

tasksCmd
  .command('start <change-id> <task-id>')
  .description('Mark a task as in-progress')
  .action(async (changeId: string, taskId: string) => {
    try {
      const tasksCommand = new TasksCommand();
      await tasksCommand.start(changeId, taskId, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

tasksCmd
  .command('complete <change-id> <task-id>')
  .description('Mark a task as complete')
  .action(async (changeId: string, taskId: string) => {
    try {
      const tasksCommand = new TasksCommand();
      await tasksCommand.complete(changeId, taskId, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

tasksCmd
  .command('next <change-id>')
  .description('Show the next task to work on')
  .action(async (changeId: string) => {
    try {
      const tasksCommand = new TasksCommand();
      await tasksCommand.next(changeId, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

tasksCmd
  .command('show <change-id>')
  .description('Display the full tasks.md file')
  .action(async (changeId: string) => {
    try {
      const tasksCommand = new TasksCommand();
      await tasksCommand.show(changeId, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Agent config command for managing model and context settings
const agentConfigCmd = program
  .command('agent-config')
  .description('Manage agent configuration (models, context budgets, strategies)');

agentConfigCmd
  .command('init')
  .description('Initialize config.yaml with default settings')
  .action(async () => {
    try {
      const agentConfigCommand = new AgentConfigCommand();
      await agentConfigCommand.init('.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

agentConfigCmd
  .command('show')
  .description('Display current configuration')
  .action(async () => {
    try {
      const agentConfigCommand = new AgentConfigCommand();
      await agentConfigCommand.show('.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

agentConfigCmd
  .command('get <key>')
  .description('Get a configuration value (e.g., "tools.opencode.default_model")')
  .action(async (key: string) => {
    try {
      const agentConfigCommand = new AgentConfigCommand();
      await agentConfigCommand.get(key, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

agentConfigCmd
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action(async (key: string, value: string) => {
    try {
      const agentConfigCommand = new AgentConfigCommand();
      await agentConfigCommand.set(key, value, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

agentConfigCmd
  .command('model <tool> <agent-type>')
  .description('Show model configuration for a tool and agent type')
  .action(async (tool: string, agentType: string) => {
    try {
      const agentConfigCommand = new AgentConfigCommand();
      await agentConfigCommand.showModel(
        tool as 'opencode' | 'codex' | 'claude-code',
        agentType as 'research' | 'execution' | 'review' | 'planning',
        '.'
      );
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

agentConfigCmd
  .command('summary')
  .description('Show a summary of all agent configurations')
  .action(async () => {
    try {
      const agentConfigCommand = new AgentConfigCommand();
      await agentConfigCommand.summary('.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Workflow command for orchestrating multi-agent workflows
const workflowCmd = program
  .command('workflow')
  .description('Orchestrate multi-agent workflows');

workflowCmd
  .command('init')
  .description('Initialize workflows directory with examples')
  .action(async () => {
    try {
      const workflowCommand = new WorkflowCommand();
      await workflowCommand.init('.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

workflowCmd
  .command('list')
  .description('List available workflows')
  .action(async () => {
    try {
      const workflowCommand = new WorkflowCommand();
      await workflowCommand.list('.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

workflowCmd
  .command('show <name>')
  .description('Show workflow details')
  .action(async (name: string) => {
    try {
      const workflowCommand = new WorkflowCommand();
      await workflowCommand.show(name, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

workflowCmd
  .command('run <name>')
  .description('Generate execution instructions for a workflow')
  .option('-t, --tool <tool>', 'Target tool (opencode, claude-code, codex)', 'opencode')
  .option('-v, --var <vars...>', 'Variables in key=value format')
  .action(async (name: string, options: { tool?: string; var?: string[] }) => {
    try {
      const workflowCommand = new WorkflowCommand();
      const tool = (options.tool || 'opencode') as 'opencode' | 'claude-code' | 'codex';

      // Parse variables
      const variables: Record<string, string> = {};
      if (options.var) {
        for (const v of options.var) {
          const [key, ...rest] = v.split('=');
          variables[key] = rest.join('=');
        }
      }

      await workflowCommand.run(name, tool, '.', variables);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

workflowCmd
  .command('plan <name>')
  .description('Generate execution plan (JSON)')
  .option('-t, --tool <tool>', 'Target tool (opencode, claude-code, codex)', 'opencode')
  .option('-v, --var <vars...>', 'Variables in key=value format')
  .action(async (name: string, options: { tool?: string; var?: string[] }) => {
    try {
      const workflowCommand = new WorkflowCommand();
      const tool = (options.tool || 'opencode') as 'opencode' | 'claude-code' | 'codex';

      const variables: Record<string, string> = {};
      if (options.var) {
        for (const v of options.var) {
          const [key, ...rest] = v.split('=');
          variables[key] = rest.join('=');
        }
      }

      await workflowCommand.plan(name, tool, '.', variables);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

workflowCmd
  .command('status <name>')
  .description('Check workflow execution status')
  .action(async (name: string) => {
    try {
      const workflowCommand = new WorkflowCommand();
      await workflowCommand.status(name, '.');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
