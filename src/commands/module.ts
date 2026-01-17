import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import { select } from '@inquirer/prompts';
import { Validator } from '../core/validation/validator.js';
import { ModuleParser, generateModuleContent } from '../core/parsers/module-parser.js';
import {
  getModuleIds,
  getModuleInfo,
  getModuleById,
  getChangesForModule,
  getActiveChangeIds,
  getArchivedChangeIds,
} from '../utils/item-discovery.js';
import {
  formatModuleFolderName,
  getNextModuleId,
  parseModuleName,
  parseModularChangeName,
  UNGROUPED_MODULE_ID,
} from '../core/schemas/index.js';
import { isInteractive } from '../utils/interactive.js';
import { getModulesPath } from '../core/project-config.js';

interface ModuleListOptions {
  json?: boolean;
}

interface ModuleShowOptions {
  json?: boolean;
  noInteractive?: boolean;
  interactive?: boolean;
}

interface ModuleNewOptions {
  scope?: string;
  dependsOn?: string;
}

interface ModuleValidateOptions {
  strict?: boolean;
  json?: boolean;
  withChanges?: boolean;
}

export class ModuleCommand {
  /**
   * Create a new module.
   */
  async new(name: string | undefined, options: ModuleNewOptions = {}): Promise<void> {
    const root = process.cwd();
    const modulesPath = getModulesPath(root);

    // Ensure modules directory exists
    await fs.mkdir(modulesPath, { recursive: true });

    // Get existing modules to determine next ID
    const existingModules = await getModuleIds(root);

    // Check if module with same name already exists
    if (name) {
      const existingWithName = existingModules.find(m => {
        const parsed = parseModuleName(m);
        return parsed?.name === name;
      });

      if (existingWithName) {
        console.log(`Module "${name}" already exists as ${existingWithName}`);
        return;
      }
    }

    // If no name provided, prompt for one
    if (!name) {
      const { input } = await import('@inquirer/prompts');
      name = await input({
        message: 'Enter module name (kebab-case):',
        validate: (value) => {
          if (!value.trim()) return 'Module name is required';
          if (!/^[a-z][a-z0-9-]*$/.test(value)) return 'Must be kebab-case (e.g., project-setup)';
          return true;
        },
      });
    }

    // Get next module ID
    const nextId = getNextModuleId(existingModules);
    const folderName = formatModuleFolderName(nextId, name);
    const moduleDir = path.join(modulesPath, folderName);

    // Create module directory
    await fs.mkdir(moduleDir, { recursive: true });

    // Parse scope option
    const scope = options.scope
      ? options.scope.split(',').map(s => s.trim()).filter(Boolean)
      : ['*'];

    // Parse dependsOn option
    const dependsOn = options.dependsOn
      ? options.dependsOn.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    // Generate module.md content
    const title = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const content = generateModuleContent({
      title,
      purpose: `<!-- Describe the purpose of this module/epic -->`,
      scope,
      dependsOn,
      changes: [],
    });

    // Write module.md
    const moduleFile = path.join(moduleDir, 'module.md');
    await fs.writeFile(moduleFile, content, 'utf-8');

    console.log(`Created module: ${folderName}`);
    console.log(`  Path: ${moduleDir}`);
    console.log(`  Edit: projector/modules/${folderName}/module.md`);
  }

  /**
   * List all modules.
   */
  async list(options: ModuleListOptions = {}): Promise<void> {
    const root = process.cwd();
    const modules = await getModuleInfo(root);

    if (options.json) {
      const modulesWithCounts = await Promise.all(
        modules.map(async (m) => {
          const changes = await getChangesForModule(m.id, root);
          return {
            id: m.id,
            name: m.name,
            fullName: m.fullName,
            changeCount: changes.length,
          };
        })
      );
      console.log(JSON.stringify({ modules: modulesWithCounts }, null, 2));
      return;
    }

    if (modules.length === 0) {
      console.log('No modules found.');
      console.log('Create one with: projector module new <name>');
      return;
    }

    console.log('Modules:\n');
    for (const m of modules) {
      const changes = await getChangesForModule(m.id, root);
      const changeInfo = changes.length > 0 ? ` (${changes.length} change${changes.length !== 1 ? 's' : ''})` : '';
      console.log(`  ${m.fullName}${changeInfo}`);
    }
    console.log();
  }

  /**
   * Show module details.
   */
  async show(moduleId: string | undefined, options: ModuleShowOptions = {}): Promise<void> {
    const root = process.cwd();
    const interactive = isInteractive(options);

    // If no module ID provided, prompt or list
    if (!moduleId) {
      const modules = await getModuleInfo(root);
      if (modules.length === 0) {
        console.error('No modules found.');
        process.exitCode = 1;
        return;
      }

      if (!interactive) {
        console.error('Usage: projector module show <module-id>');
        console.error('Available modules:');
        for (const m of modules) {
          console.error(`  ${m.id} - ${m.fullName}`);
        }
        process.exitCode = 1;
        return;
      }

      // Interactive selection
      const choice = await select({
        message: 'Select a module:',
        choices: modules.map(m => ({
          name: m.fullName,
          value: m.id,
        })),
      });
      moduleId = choice;
    }

    // Find the module
    const module = await getModuleById(moduleId, root);
    if (!module) {
      console.error(`Module not found: ${moduleId}`);
      process.exitCode = 1;
      return;
    }

    // Read and parse module.md
    const moduleFile = path.join(module.path, 'module.md');
    let content: string;
    try {
      content = await fs.readFile(moduleFile, 'utf-8');
    } catch {
      console.error(`Could not read module file: ${moduleFile}`);
      process.exitCode = 1;
      return;
    }

    const parser = new ModuleParser(content, module.fullName);
    const parsed = parser.parseModule();

    // Get changes for this module
    const changes = await getChangesForModule(module.id, root);

    if (options.json) {
      console.log(JSON.stringify({
        ...parsed,
        actualChanges: changes,
      }, null, 2));
      return;
    }

    // Pretty print
    console.log(`\n${module.fullName}`);
    console.log('='.repeat(module.fullName.length));
    console.log(`\nPurpose: ${parsed.purpose}`);

    if (parsed.dependsOn.length > 0) {
      console.log(`\nDepends On: ${parsed.dependsOn.join(', ')}`);
    }

    console.log(`\nScope: ${parsed.scope.join(', ')}`);

    console.log(`\nChanges (${changes.length}):`);
    if (changes.length === 0) {
      console.log('  (no changes yet)');
    } else {
      for (const changeId of changes) {
        const isListed = parsed.changes.some(c => c.id === changeId);
        const marker = isListed ? '✓' : '⚠';
        console.log(`  ${marker} ${changeId}`);
      }
    }

    // Show planned changes
    const plannedChanges = parsed.changes.filter(c => c.planned);
    if (plannedChanges.length > 0) {
      console.log(`\nPlanned Changes:`);
      for (const c of plannedChanges) {
        console.log(`  ○ ${c.id}`);
      }
    }

    console.log();
  }

  /**
   * Validate a module.
   */
  async validate(moduleId: string | undefined, options: ModuleValidateOptions = {}): Promise<void> {
    const root = process.cwd();
    const spinner = !options.json ? ora('Validating module...').start() : undefined;

    // If no module ID provided, list and exit
    if (!moduleId) {
      spinner?.stop();
      console.error('Usage: projector module validate <module-id>');
      const modules = await getModuleInfo(root);
      if (modules.length > 0) {
        console.error('Available modules:');
        for (const m of modules) {
          console.error(`  ${m.id} - ${m.fullName}`);
        }
      }
      process.exitCode = 1;
      return;
    }

    // Find the module
    const module = await getModuleById(moduleId, root);
    if (!module) {
      spinner?.stop();
      console.error(`Module not found: ${moduleId}`);
      process.exitCode = 1;
      return;
    }

    const validator = new Validator(options.strict ?? false);

    if (options.withChanges) {
      const { moduleReport, changeReports } = await validator.validateModuleWithChanges(module.path, root);
      spinner?.stop();

      if (options.json) {
        console.log(JSON.stringify({
          module: {
            id: module.id,
            fullName: module.fullName,
            valid: moduleReport.valid,
            issues: moduleReport.issues,
          },
          changes: changeReports.map(cr => ({
            id: cr.changeId,
            valid: cr.report.valid,
            issues: cr.report.issues,
          })),
        }, null, 2));
      } else {
        this.printModuleReport(module.fullName, moduleReport);
        for (const cr of changeReports) {
          console.log(`\n  Change: ${cr.changeId}`);
          if (cr.report.valid) {
            console.log('    ✓ Valid');
          } else {
            for (const issue of cr.report.issues) {
              const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
              console.log(`    ${prefix} [${issue.level}] ${issue.path}: ${issue.message}`);
            }
          }
        }
      }

      const allValid = moduleReport.valid && changeReports.every(cr => cr.report.valid);
      process.exitCode = allValid ? 0 : 1;
    } else {
      const report = await validator.validateModule(module.path, root);
      spinner?.stop();

      if (options.json) {
        console.log(JSON.stringify({
          id: module.id,
          fullName: module.fullName,
          valid: report.valid,
          issues: report.issues,
          summary: report.summary,
        }, null, 2));
      } else {
        this.printModuleReport(module.fullName, report);
      }

      process.exitCode = report.valid ? 0 : 1;
    }
  }

  private printModuleReport(moduleName: string, report: { valid: boolean; issues: any[] }): void {
    if (report.valid) {
      console.log(`Module '${moduleName}' is valid`);
    } else {
      console.error(`Module '${moduleName}' has issues:`);
      for (const issue of report.issues) {
        const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
        console.error(`  ${prefix} [${issue.level}] ${issue.path}: ${issue.message}`);
      }
    }
  }
}

export function registerModuleCommand(program: any): void {
  const moduleCmd = program
    .command('module')
    .description('Manage Projector modules (groups of related changes)');

  moduleCmd
    .command('new [name]')
    .description('Create a new module')
    .option('--scope <capabilities>', 'Comma-separated list of capabilities (default: "*" for unrestricted)')
    .option('--depends-on <modules>', 'Comma-separated list of module IDs this depends on')
    .action(async (name?: string, options?: ModuleNewOptions) => {
      try {
        const moduleCommand = new ModuleCommand();
        await moduleCommand.new(name, options);
      } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });

  moduleCmd
    .command('list')
    .description('List all modules')
    .option('--json', 'Output as JSON')
    .action(async (options?: ModuleListOptions) => {
      try {
        const moduleCommand = new ModuleCommand();
        await moduleCommand.list(options);
      } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });

  moduleCmd
    .command('show [module-id]')
    .description('Show module details')
    .option('--json', 'Output as JSON')
    .option('--no-interactive', 'Disable interactive prompts')
    .action(async (moduleId?: string, options?: ModuleShowOptions) => {
      try {
        const moduleCommand = new ModuleCommand();
        await moduleCommand.show(moduleId, options);
      } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });

  moduleCmd
    .command('validate [module-id]')
    .description('Validate a module')
    .option('--strict', 'Enable strict validation mode')
    .option('--json', 'Output as JSON')
    .option('--with-changes', 'Also validate all changes in the module')
    .action(async (moduleId?: string, options?: ModuleValidateOptions) => {
      try {
        const moduleCommand = new ModuleCommand();
        await moduleCommand.validate(moduleId, options);
      } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });
}
