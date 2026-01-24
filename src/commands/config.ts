import { Command } from 'commander';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import {
  getGlobalConfigPath,
  getGlobalConfig,
  saveGlobalConfig,
  GlobalConfig,
} from '../core/global-config.js';
import {
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  coerceValue,
  formatValueYaml,
  validateConfigKeyPath,
  validateConfig,
  DEFAULT_CONFIG,
} from '../core/config-schema.js';

interface ConfigScopeOptions {
  scope?: string;
}

function validateScopeOrExit(options: ConfigScopeOptions | undefined): void {
  const scope = options?.scope;
  if (scope && scope !== 'global') {
    console.error('Error: Project-local config is not yet implemented');
    process.exit(1);
  }
}

export class ConfigCommand {
  paths(options?: ConfigScopeOptions): void {
    // For now this is just the global config path.
    // Keep a plural name so we can extend later without breaking CLI.
    this.path(options);
  }

  path(options?: ConfigScopeOptions): void {
    validateScopeOrExit(options);
    console.log(getGlobalConfigPath());
  }

  list(options: ConfigScopeOptions & { json?: boolean } = {}): void {
    validateScopeOrExit(options);
    const config = getGlobalConfig();

    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log(formatValueYaml(config));
    }
  }

  get(key: string, options?: ConfigScopeOptions): void {
    validateScopeOrExit(options);
    const config = getGlobalConfig();
    const value = getNestedValue(config as Record<string, unknown>, key);

    if (value === undefined) {
      process.exitCode = 1;
      return;
    }

    if (typeof value === 'object' && value !== null) {
      console.log(JSON.stringify(value));
    } else {
      console.log(String(value));
    }
  }

  set(
    key: string,
    value: string,
    options: ConfigScopeOptions & { string?: boolean; allowUnknown?: boolean } = {}
  ): void {
    validateScopeOrExit(options);

    const allowUnknown = Boolean(options.allowUnknown);
    const keyValidation = validateConfigKeyPath(key);
    if (!keyValidation.valid && !allowUnknown) {
      const reason = keyValidation.reason ? ` ${keyValidation.reason}.` : '';
      console.error(`Error: Invalid configuration key "${key}".${reason}`);
      console.error('Use "spool config list" to see available keys.');
      console.error('Pass --allow-unknown to bypass this check.');
      process.exitCode = 1;
      return;
    }

    const config = getGlobalConfig() as Record<string, unknown>;
    const coercedValue = coerceValue(value, options.string || false);

    // Create a copy to validate before saving
    const newConfig = JSON.parse(JSON.stringify(config));
    setNestedValue(newConfig, key, coercedValue);

    // Validate the new config
    const validation = validateConfig(newConfig);
    if (!validation.success) {
      console.error(`Error: Invalid configuration - ${validation.error}`);
      process.exitCode = 1;
      return;
    }

    // Apply changes and save
    setNestedValue(config, key, coercedValue);
    saveGlobalConfig(config as GlobalConfig);

    const displayValue = typeof coercedValue === 'string' ? `"${coercedValue}"` : String(coercedValue);
    console.log(`Set ${key} = ${displayValue}`);
  }

  unset(key: string, options?: ConfigScopeOptions): void {
    validateScopeOrExit(options);
    const config = getGlobalConfig() as Record<string, unknown>;
    const existed = deleteNestedValue(config, key);

    if (existed) {
      saveGlobalConfig(config as GlobalConfig);
      console.log(`Unset ${key} (reverted to default)`);
    } else {
      console.log(`Key "${key}" was not set`);
    }
  }

  async reset(options: ConfigScopeOptions & { all?: boolean; yes?: boolean } = {}): Promise<void> {
    validateScopeOrExit(options);

    if (!options.all) {
      console.error('Error: --all flag is required for reset');
      console.error('Usage: spool config reset --all [-y]');
      process.exitCode = 1;
      return;
    }

    if (!options.yes) {
      const { confirm } = await import('@inquirer/prompts');
      const confirmed = await confirm({
        message: 'Reset all configuration to defaults?',
        default: false,
      });

      if (!confirmed) {
        console.log('Reset cancelled.');
        return;
      }
    }

    saveGlobalConfig({ ...DEFAULT_CONFIG });
    console.log('Configuration reset to defaults');
  }

  async edit(options?: ConfigScopeOptions): Promise<void> {
    validateScopeOrExit(options);
    const editor = process.env.EDITOR || process.env.VISUAL;

    if (!editor) {
      console.error('Error: No editor configured');
      console.error('Set the EDITOR or VISUAL environment variable to your preferred editor');
      console.error('Example: export EDITOR=vim');
      process.exitCode = 1;
      return;
    }

    const configPath = getGlobalConfigPath();

    // Ensure config file exists with defaults
    if (!fs.existsSync(configPath)) {
      saveGlobalConfig({ ...DEFAULT_CONFIG });
    }

    // Spawn editor and wait for it to close
    // Avoid shell parsing to correctly handle paths with spaces in both
    // the editor path and config path
    const child = spawn(editor, [configPath], {
      stdio: 'inherit',
      shell: false,
    });

    await new Promise<void>((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });
      child.on('error', reject);
    });

    try {
      const rawConfig = fs.readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(rawConfig);
      const validation = validateConfig(parsedConfig);

      if (!validation.success) {
        console.error(`Error: Invalid configuration - ${validation.error}`);
        process.exitCode = 1;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error(`Error: Config file not found at ${configPath}`);
      } else if (error instanceof SyntaxError) {
        console.error(`Error: Invalid JSON in ${configPath}`);
        console.error(error.message);
      } else {
        console.error(
          `Error: Unable to validate configuration - ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
      process.exitCode = 1;
    }
  }
}

/**
 * Register the config command and all its subcommands.
 *
 * @param program - The Commander program instance
 */
export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('View and modify global Spool configuration')
    .option('--scope <scope>', 'Config scope (only "global" supported currently)')

  configCmd.hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.scope && opts.scope !== 'global') {
      console.error('Error: Project-local config is not yet implemented');
      process.exit(1);
    }
  });

  // config paths
  configCmd
    .command('paths')
    .description('Show config file location(s)')
    .action(() => {
      const cmd = new ConfigCommand();
      cmd.paths(configCmd.opts() as ConfigScopeOptions);
    });

  // config path
  configCmd
    .command('path', { hidden: true })
    .description('Show config file location (deprecated: use "spool config paths")')
    .action(() => {
      console.error('Warning: "spool config path" is deprecated. Use "spool config paths" instead.');
      const cmd = new ConfigCommand();
      cmd.path(configCmd.opts() as ConfigScopeOptions);
    });

  // config list
  configCmd
    .command('list')
    .description('Show all current settings')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      const cmd = new ConfigCommand();
      cmd.list({ ...(configCmd.opts() as ConfigScopeOptions), ...options });
    });

  // config get
  configCmd
    .command('get <key>')
    .description('Get a specific value (raw, scriptable)')
    .action((key: string) => {
      const cmd = new ConfigCommand();
      cmd.get(key, configCmd.opts() as ConfigScopeOptions);
    });

  // config set
  configCmd
    .command('set <key> <value>')
    .description('Set a value (auto-coerce types)')
    .option('--string', 'Force value to be stored as string')
    .option('--allow-unknown', 'Allow setting unknown keys')
    .action((key: string, value: string, options: { string?: boolean; allowUnknown?: boolean }) => {
      const cmd = new ConfigCommand();
      cmd.set(key, value, { ...(configCmd.opts() as ConfigScopeOptions), ...options });
    });

  // config unset
  configCmd
    .command('unset <key>')
    .description('Remove a key (revert to default)')
    .action((key: string) => {
      const cmd = new ConfigCommand();
      cmd.unset(key, configCmd.opts() as ConfigScopeOptions);
    });

  // config reset
  configCmd
    .command('reset')
    .description('Reset configuration to defaults')
    .option('--all', 'Reset all configuration (required)')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options: { all?: boolean; yes?: boolean }) => {
      const cmd = new ConfigCommand();
      await cmd.reset({ ...(configCmd.opts() as ConfigScopeOptions), ...options });
    });

  // config edit
  configCmd
    .command('edit')
    .description('Open config in $EDITOR')
    .action(async () => {
      const cmd = new ConfigCommand();
      await cmd.edit(configCmd.opts() as ConfigScopeOptions);
    });
}
