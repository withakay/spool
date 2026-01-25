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
import { ConfigCommand, registerConfigCommand } from '../commands/config.js';
import { registerSkillsCommands } from '../commands/skills.js';
import { registerArtifactWorkflowCommands } from '../commands/artifact-workflow.js';
import { ModuleCommand, registerModuleCommand } from '../commands/module.js';
import { registerResearchCommand } from '../commands/research.js';
import { SplitCommand } from '../commands/split.js';
import { registerRalphCommand } from '../commands/ralph.js';

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
    // Skip the root 'spool' command
    if (name && name !== 'spool') {
      names.unshift(name);
    }
    current = current.parent;
  }

  return names.join(':') || 'spool';
}

program
  .name('spool')
  .description('AI-native system for spec-driven development')
  .version(version);

// Global options
program.option('--no-color', 'Disable color output');

// Apply global flags before any command runs
// Note: preAction receives (thisCommand, actionCommand) where:
// - thisCommand: command where hook was added (root program)
// - actionCommand: command actually being executed (subcommand)
program.hook('preAction', async (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }
});

const availableToolIds = AI_TOOLS.filter((tool) => tool.available).map((tool) => tool.value);
const toolsOptionDescription = `Configure AI tools non-interactively. Use "all", "none", or a comma-separated list of: ${availableToolIds.join(', ')}`;

program
  .command('init [path]')
  .description('Initialize Spool in your project')
  .option('--tools <tools>', toolsOptionDescription)
  .option('-f, --force', 'Overwrite existing tool files without prompting')
  .action(async (
    targetPath = '.',
    options?: { tools?: string; force?: boolean }
  ) => {
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
        force: options?.force,
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
  .description('Update Spool instruction files')
  .option('--json', 'Output update summary as JSON')
  .action(async (targetPath = '.', options?: { json?: boolean }) => {
    try {
      const resolvedPath = path.resolve(targetPath);
      const updateCommand = new UpdateCommand();
      await updateCommand.execute(resolvedPath, { json: options?.json });
    } catch (error) {
      if (options?.json) {
        console.log(JSON.stringify({ error: (error as Error).message }, null, 2));
      } else {
        console.log(); // Empty line for spacing
        ora().fail(`Error: ${(error as Error).message}`);
      }
      process.exit(1);
    }
  });

const listCmd = program
  .command('list')
  .description('List items (changes by default). Use --specs or --modules to list other items.')
  .option('--specs', 'List specs instead of changes')
  .option('--changes', 'List changes explicitly (default)')
  .option('--modules', 'List modules instead of changes')
  .option('--sort <order>', 'Sort order: "recent" (default) or "name"', 'recent')
  .option('--json', 'Output as JSON (for programmatic use)')
  .action(async (options?: { specs?: boolean; changes?: boolean; modules?: boolean; sort?: string; json?: boolean }) => {
    try {
      const listCommand = new ListCommand();
      const mode: 'changes' | 'specs' | 'modules' =
        options?.modules ? 'modules' : options?.specs ? 'specs' : 'changes';
      const sort = options?.sort === 'name' ? 'name' : 'recent';
      await listCommand.execute('.', mode, { sort, json: options?.json });
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// NOTE: legacy list subcommands (config/module/skills) were removed from the
// supported CLI surface. Use `spool config ...`, `spool create module ...`,
// `spool show module ...`, `spool validate module ...`.

program
  .command('dashboard')
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

program
  .command('view', { hidden: true })
  .description('Display an interactive dashboard of specs and changes (deprecated)')
  .action(async () => {
    try {
      console.error('Warning: "spool view" is deprecated. Use "spool dashboard" instead.');
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
  .command('change', { hidden: true })
  .description('Manage Spool change proposals (deprecated)');

// Deprecation notice for noun-based commands
changeCmd.hook('preAction', () => {
  console.error('Warning: The "spool change ..." commands are deprecated. Prefer verb-first commands (e.g., "spool list", "spool validate --changes").');
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
  .description('List all active changes (DEPRECATED: use "spool list" instead)')
  .option('--json', 'Output as JSON')
  .option('--long', 'Show id and title with counts')
  .action(async (options?: { json?: boolean; long?: boolean }) => {
    try {
      console.error('Warning: "spool change list" is deprecated. Use "spool list".');
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
registerSkillsCommands(program);

// create
const createCmd = program
  .command('create')
  .description('Create items');

createCmd
  .command('change <name>')
  .description('Create a new change')
  .option('--description <text>', 'Description to add to README.md')
  .option('--schema <name>', 'Workflow schema to use')
  .option('--module <id>', 'Module ID to associate the change with (default: 000)')
  .action(async (name: string, options?: { description?: string; schema?: string; module?: string }) => {
    try {
      const { createChangeCommand } = await import('../commands/artifact-workflow.js');
      await createChangeCommand(name, options ?? {});
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

createCmd
  .command('module [name]')
  .description('Create a new module')
  .option('--scope <capabilities>', 'Comma-separated list of capabilities (default: "*" for unrestricted)')
  .option('--depends-on <modules>', 'Comma-separated list of module IDs this depends on')
  .action(async (name?: string, options?: { scope?: string; dependsOn?: string }) => {
    try {
      const moduleCommand = new ModuleCommand();
      await moduleCommand.new(name, options ?? {});
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// get
const getCmd = program
  .command('get', { hidden: true })
  .description('Get a value (deprecated)');

getCmd
  .command('config <key>')
  .description('Get a configuration value')
  .option('--scope <scope>', 'Config scope (only "global" supported currently)')
  .action((key: string, options: { scope?: string }) => {
    try {
      console.error('Warning: "spool get config" is deprecated. Use "spool config get" instead.');
      const cmd = new ConfigCommand();
      cmd.get(key, options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// set
const setCmd = program
  .command('set', { hidden: true })
  .description('Set a value (deprecated)');

setCmd
  .command('config <key> <value>')
  .description('Set a configuration value')
  .option('--string', 'Force value to be stored as string')
  .option('--allow-unknown', 'Allow setting unknown keys')
  .option('--scope <scope>', 'Config scope (only "global" supported currently)')
  .action((key: string, value: string, options: { string?: boolean; allowUnknown?: boolean; scope?: string }) => {
    try {
      console.error('Warning: "spool set config" is deprecated. Use "spool config set" instead.');
      const cmd = new ConfigCommand();
      cmd.set(key, value, options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// unset
const unsetCmd = program
  .command('unset', { hidden: true })
  .description('Unset a value (deprecated)');

unsetCmd
  .command('config <key>')
  .description('Unset a configuration value (revert to default)')
  .option('--scope <scope>', 'Config scope (only "global" supported currently)')
  .action((key: string, options: { scope?: string }) => {
    try {
      console.error('Warning: "spool unset config" is deprecated. Use "spool config unset" instead.');
      const cmd = new ConfigCommand();
      cmd.unset(key, options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// reset
const resetCmd = program
  .command('reset', { hidden: true })
  .description('Reset items (deprecated)');

resetCmd
  .command('config')
  .description('Reset configuration to defaults')
  .option('--all', 'Reset all configuration (required)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--scope <scope>', 'Config scope (only "global" supported currently)')
  .action(async (options: { all?: boolean; yes?: boolean; scope?: string }) => {
    try {
      console.error('Warning: "spool reset config" is deprecated. Use "spool config reset" instead.');
      const cmd = new ConfigCommand();
      await cmd.reset(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// edit
const editCmd = program
  .command('edit', { hidden: true })
  .description('Edit items (deprecated)');

editCmd
  .command('config')
  .description('Open configuration in $EDITOR')
  .option('--scope <scope>', 'Config scope (only "global" supported currently)')
  .action(async (options: { scope?: string }) => {
    try {
      console.error('Warning: "spool edit config" is deprecated. Use "spool config edit" instead.');
      const cmd = new ConfigCommand();
      await cmd.edit(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// path
const pathCmd = program
  .command('path', { hidden: true })
  .description('Show paths (deprecated)');

pathCmd
  .command('config')
  .description('Show config file location')
  .option('--scope <scope>', 'Config scope (only "global" supported currently)')
  .action((options: { scope?: string }) => {
    try {
      console.error('Warning: "spool path config" is deprecated. Use "spool config paths" instead.');
      const cmd = new ConfigCommand();
      cmd.paths(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// generate
const generateCmd = program
  .command('generate', { hidden: true })
  .description('Generate outputs (deprecated)');

generateCmd
  .command('completion [shell]')
  .description('Generate completion script for a shell (outputs to stdout)')
  .action(async (shell?: string) => {
    try {
      console.error('Warning: "spool generate completion" is deprecated. Use "spool completions generate" instead.');
      const completionCommand = new CompletionCommand();
      await completionCommand.generate({ shell });
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// install
const installCmd = program
  .command('install', { hidden: true })
  .description('Install items (deprecated)');

installCmd
  .command('completion [shell]')
  .description('Install completion script for a shell')
  .option('--verbose', 'Show detailed installation output')
  .action(async (shell?: string, options?: { verbose?: boolean }) => {
    try {
      console.error('Warning: "spool install completion" is deprecated. Use "spool completions install" instead.');
      const completionCommand = new CompletionCommand();
      await completionCommand.install({ shell, verbose: options?.verbose });
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// uninstall
const uninstallCmd = program
  .command('uninstall', { hidden: true })
  .description('Uninstall items (deprecated)');

uninstallCmd
  .command('completion [shell]')
  .description('Uninstall completion script for a shell')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (shell?: string, options?: { yes?: boolean }) => {
    try {
      console.error('Warning: "spool uninstall completion" is deprecated. Use "spool completions uninstall" instead.');
      const completionCommand = new CompletionCommand();
      await completionCommand.uninstall({ shell, yes: options?.yes });
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// NOTE: legacy skills installation commands were removed from the supported
// CLI surface. Skills are installed/refreshed by `spool init` and `spool update`.

// Top-level validate command
const validateCmd = program
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
  .option('--concurrency <n>', 'Max concurrent validations (defaults to env SPOOL_CONCURRENCY or 6)')
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

// validate module
validateCmd
  .command('module [module-id]')
  .description('Validate a module')
  .option('--strict', 'Enable strict validation mode')
  .option('--json', 'Output as JSON')
  .option('--with-changes', 'Also validate all changes in the module')
  .action(async (moduleId?: string, options?: { strict?: boolean; json?: boolean; withChanges?: boolean }) => {
    try {
      const moduleCommand = new ModuleCommand();
      await moduleCommand.validate(moduleId, options);
      if (typeof process.exitCode === 'number' && process.exitCode !== 0) {
        process.exit(process.exitCode);
      }
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Top-level show command
const showCmd = program
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

// show module
showCmd
  .command('module [module-id]')
  .description('Show module details')
  .option('--json', 'Output as JSON')
  .option('--no-interactive', 'Disable interactive prompts')
  .action(async (moduleId?: string, options?: { json?: boolean; noInteractive?: boolean }) => {
    try {
      const moduleCommand = new ModuleCommand();
      await moduleCommand.show(moduleId, {
        json: options?.json,
        noInteractive: options?.noInteractive,
      });
      if (typeof process.exitCode === 'number' && process.exitCode !== 0) {
        process.exit(process.exitCode);
      }
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Completion command with subcommands
const completionCmd = program
  .command('completion', { hidden: true })
  .description('Manage shell completions for Spool CLI (deprecated)');

// Deprecation notice for noun-based commands
completionCmd.hook('preAction', () => {
  console.error('Warning: The "spool completion ..." commands are deprecated. Use "spool completions ..." instead.');
});

// Completions (preferred)
const completionsCmd = program
  .command('completions')
  .description('Manage shell completions for Spool CLI');

completionsCmd
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

completionsCmd
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

completionsCmd
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

// Register research command
registerResearchCommand(program);

// Register Ralph command
registerRalphCommand(program);

// Split command
new SplitCommand(program);

program.parse();
