import ora from 'ora';
import path from 'path';
import { Validator } from '../core/validation/validator.js';
import { isInteractive, resolveNoInteractive } from '../utils/interactive.js';
import { getActiveChangeIds, getSpecIds, getModuleInfo } from '../utils/item-discovery.js';
import { nearestMatches } from '../utils/match.js';
import { getChangesPath, getSpecsPath } from '../core/project-config.js';
import { SplitCommand } from './split.js';
import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';

type ItemType = 'change' | 'spec' | 'module';

interface ExecuteOptions {
  all?: boolean;
  changes?: boolean;
  specs?: boolean;
  modules?: boolean;
  module?: string;
  type?: string;
  strict?: boolean;
  json?: boolean;
  noInteractive?: boolean;
  interactive?: boolean; // Commander sets this to false when --no-interactive is used
  concurrency?: string;
}

interface BulkItemResult {
  id: string;
  type: ItemType;
  valid: boolean;
  issues: { level: 'ERROR' | 'WARNING' | 'INFO'; path: string; message: string }[];
  durationMs: number;
}

export class ValidateCommand {
  async execute(itemName: string | undefined, options: ExecuteOptions = {}): Promise<void> {
    const interactive = isInteractive(options);

    // Handle bulk flags first
    if (options.all || options.changes || options.specs || options.modules) {
      await this.runBulkValidation({
        changes: !!options.all || !!options.changes,
        specs: !!options.all || !!options.specs,
        modules: !!options.all || !!options.modules,
      }, { strict: !!options.strict, json: !!options.json, concurrency: options.concurrency, noInteractive: resolveNoInteractive(options) });
      return;
    }

    // Handle --module flag for validating a specific module
    if (options.module) {
      await this.validateModule(options.module, { strict: !!options.strict, json: !!options.json });
      return;
    }

    // No item and no flags
    if (!itemName) {
      if (interactive) {
        await this.runInteractiveSelector({ strict: !!options.strict, json: !!options.json, concurrency: options.concurrency });
        return;
      }
      this.printNonInteractiveHint();
      process.exitCode = 1;
      return;
    }

    // Direct item validation with type detection or override
    const typeOverride = this.normalizeType(options.type);
    await this.validateDirectItem(itemName, { 
      typeOverride, 
      strict: !!options.strict, 
      json: !!options.json,
      noInteractive: resolveNoInteractive(options)
    });
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'spec' || v === 'module') return v;
    return undefined;
  }

  private async validateModule(moduleId: string, opts: { strict: boolean; json: boolean }): Promise<void> {
    const modules = await getModuleInfo();
    const module = modules.find(m => m.id === moduleId || m.fullName === moduleId);

    if (!module) {
      console.error(`Module not found: ${moduleId}`);
      const suggestions = nearestMatches(moduleId, modules.map(m => m.fullName));
      if (suggestions.length) console.error(`Did you mean: ${suggestions.join(', ')}?`);
      process.exitCode = 1;
      return;
    }

    const validator = new Validator(opts.strict);
    const start = Date.now();
    const report = await validator.validateModule(module.path);
    const durationMs = Date.now() - start;

    if (opts.json) {
      const out = {
        items: [{ id: module.fullName, type: 'module' as const, valid: report.valid, issues: report.issues, durationMs }],
        summary: { totals: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 }, byType: { module: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 } } },
        version: '1.0',
      };
      console.log(JSON.stringify(out, null, 2));
    } else {
      if (report.valid) {
        console.log(`Module '${module.fullName}' is valid`);
      } else {
        console.error(`Module '${module.fullName}' has issues`);
        for (const issue of report.issues) {
          const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
          console.error(`${prefix} [${issue.level}] ${issue.path}: ${issue.message}`);
        }
      }
    }

    process.exitCode = report.valid ? 0 : 1;
  }

  private async runInteractiveSelector(opts: { strict: boolean; json: boolean; concurrency?: string }): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    const choice = await select({
      message: 'What would you like to validate?',
      choices: [
        { name: 'All (changes + specs)', value: 'all' },
        { name: 'All changes', value: 'changes' },
        { name: 'All specs', value: 'specs' },
        { name: 'Pick a specific change or spec', value: 'one' },
      ],
    });

    if (choice === 'all') return this.runBulkValidation({ changes: true, specs: true }, opts);
    if (choice === 'changes') return this.runBulkValidation({ changes: true, specs: false }, opts);
    if (choice === 'specs') return this.runBulkValidation({ changes: false, specs: true }, opts);

    // one
    const [changes, specs] = await Promise.all([getActiveChangeIds(), getSpecIds()]);
    const items: { name: string; value: { type: ItemType; id: string } }[] = [];
    items.push(...changes.map(id => ({ name: `change/${id}`, value: { type: 'change' as const, id } })));
    items.push(...specs.map(id => ({ name: `spec/${id}`, value: { type: 'spec' as const, id } })));
    if (items.length === 0) {
      console.error('No items found to validate.');
      process.exitCode = 1;
      return;
    }
    const picked = await select<{ type: ItemType; id: string }>({ message: 'Pick an item', choices: items });
    await this.validateByType(picked.type, picked.id, opts);
  }

  private printNonInteractiveHint(): void {
    console.error('Nothing to validate. Try one of:');
    console.error('  spool validate --all');
    console.error('  spool validate --changes');
    console.error('  spool validate --specs');
    console.error('  spool validate <item-name>');
    console.error('Or run in an interactive terminal.');
  }

  private async validateDirectItem(itemName: string, opts: { typeOverride?: ItemType; strict: boolean; json: boolean; noInteractive?: boolean }): Promise<void> {
    const [changes, specs] = await Promise.all([getActiveChangeIds(), getSpecIds()]);
    const isChange = changes.includes(itemName);
    const isSpec = specs.includes(itemName);

    const type = opts.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);

    if (!type) {
      console.error(`Unknown item '${itemName}'`);
      const suggestions = nearestMatches(itemName, [...changes, ...specs]);
      if (suggestions.length) console.error(`Did you mean: ${suggestions.join(', ')}?`);
      process.exitCode = 1;
      return;
    }

    if (!opts.typeOverride && isChange && isSpec) {
      console.error(`Ambiguous item '${itemName}' matches both a change and a spec.`);
      console.error('Pass --type change|spec, or use: spool change validate / spool spec validate');
      process.exitCode = 1;
      return;
    }

    await this.validateByType(type, itemName, opts);
  }

  private async validateByType(type: ItemType, id: string, opts: { strict: boolean; json: boolean; noInteractive?: boolean }): Promise<void> {
    const validator = new Validator(opts.strict);
    if (type === 'change') {
      const changeDir = path.join(getChangesPath(), id);
      const start = Date.now();
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      const durationMs = Date.now() - start;
      this.printReport('change', id, report, durationMs, opts.json);

      // Check for split warning if interactive
      if (!opts.json && !opts.noInteractive && !report.valid) {
        // Look for split warning metadata
        const splitIssue = report.issues.find(i => 
          i.metadata && 
          i.metadata.type === 'too_many_deltas' && 
          i.metadata.remediation === 'split'
        );

        if (splitIssue) {
          console.log('\n'); // Spacing
          const shouldSplit = await confirm({
            message: `Change '${id}' has ${splitIssue.metadata!.count} deltas (max ${splitIssue.metadata!.threshold}). Would you like to split it now?`,
            default: true
          });

          if (shouldSplit) {
            // Need to invoke SplitCommand. 
            // We can construct it but it needs 'program'. 
            // A bit hacky to create a dummy program or just instantiate the logic separately.
            // SplitCommand logic is in execute(changeId).
            // Let's create a new Command instance just to satisfy the constructor
            const dummyProgram = new Command();
            const splitCmd = new SplitCommand(dummyProgram);
            await splitCmd.execute(id);
            // After split, maybe re-validate? Or just exit.
            // Re-validating might be confusing if items moved.
            console.log('\nSplit complete. Please re-run validation if needed.');
            return;
          }
        }
      }

      // Non-zero exit if invalid (keeps enriched output test semantics)
      process.exitCode = report.valid ? 0 : 1;
      return;
    }
    const file = path.join(getSpecsPath(), id, 'spec.md');
    const start = Date.now();
    const report = await validator.validateSpec(file);
    const durationMs = Date.now() - start;
    this.printReport('spec', id, report, durationMs, opts.json);
    process.exitCode = report.valid ? 0 : 1;
  }

  private printReport(type: ItemType, id: string, report: { valid: boolean; issues: any[] }, durationMs: number, json: boolean): void {
    if (json) {
      const out = { items: [{ id, type, valid: report.valid, issues: report.issues, durationMs }], summary: { totals: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 }, byType: { [type]: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 } } }, version: '1.0' };
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    const typeLabel = type === 'change' ? 'Change' : type === 'spec' ? 'Specification' : 'Module';
    if (report.valid) {
      console.log(`${typeLabel} '${id}' is valid`);
    } else {
      console.error(`${typeLabel} '${id}' has issues`);
      for (const issue of report.issues) {
        const label = issue.level === 'ERROR' ? 'ERROR' : issue.level;
        const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
        console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
      }
      this.printNextSteps(type);
    }
  }

  private printNextSteps(type: ItemType): void {
    const bullets: string[] = [];
    if (type === 'change') {
      bullets.push('- Ensure change has deltas in specs/: use headers ## ADDED/MODIFIED/REMOVED/RENAMED Requirements');
      bullets.push('- Each requirement MUST include at least one #### Scenario: block');
      bullets.push('- Debug parsed deltas: spool change show <id> --json --deltas-only');
    } else if (type === 'spec') {
      bullets.push('- Ensure spec includes ## Purpose and ## Requirements sections');
      bullets.push('- Each requirement MUST include at least one #### Scenario: block');
      bullets.push('- Re-run with --json to see structured report');
    } else if (type === 'module') {
      bullets.push('- Ensure module.md includes ## Purpose, ## Scope, and ## Changes sections');
      bullets.push('- Check that all listed (non-planned) changes exist');
      bullets.push('- Verify scope includes all capabilities modified by changes');
      bullets.push('- Re-run with --json to see structured report');
    }
    console.error('Next steps:');
    bullets.forEach(b => console.error(`  ${b}`));
  }

  private async runBulkValidation(scope: { changes: boolean; specs: boolean; modules?: boolean }, opts: { strict: boolean; json: boolean; concurrency?: string; noInteractive?: boolean }): Promise<void> {
    const spinner = !opts.json && !opts.noInteractive ? ora('Validating...').start() : undefined;
    const [changeIds, specIds, moduleInfos] = await Promise.all([
      scope.changes ? getActiveChangeIds() : Promise.resolve<string[]>([]),
      scope.specs ? getSpecIds() : Promise.resolve<string[]>([]),
      scope.modules ? getModuleInfo() : Promise.resolve([]),
    ]);

    const DEFAULT_CONCURRENCY = 6;
    const maxSuggestions = 5; // used by nearestMatches
    const concurrency = normalizeConcurrency(opts.concurrency) ?? normalizeConcurrency(process.env.SPOOL_CONCURRENCY) ?? DEFAULT_CONCURRENCY;
    const validator = new Validator(opts.strict);
    const queue: Array<() => Promise<BulkItemResult>> = [];

    for (const id of changeIds) {
      queue.push(async () => {
        const start = Date.now();
        const changeDir = path.join(getChangesPath(), id);
        const report = await validator.validateChangeDeltaSpecs(changeDir);
        const durationMs = Date.now() - start;
        return { id, type: 'change' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }
    for (const id of specIds) {
      queue.push(async () => {
        const start = Date.now();
        const file = path.join(getSpecsPath(), id, 'spec.md');
        const report = await validator.validateSpec(file);
        const durationMs = Date.now() - start;
        return { id, type: 'spec' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }
    for (const moduleInfo of moduleInfos) {
      queue.push(async () => {
        const start = Date.now();
        const report = await validator.validateModule(moduleInfo.path);
        const durationMs = Date.now() - start;
        return { id: moduleInfo.fullName, type: 'module' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }

    if (queue.length === 0) {
      spinner?.stop();

      const summary = {
        totals: { items: 0, passed: 0, failed: 0 },
        byType: {
          ...(scope.changes ? { change: { items: 0, passed: 0, failed: 0 } } : {}),
          ...(scope.specs ? { spec: { items: 0, passed: 0, failed: 0 } } : {}),
          ...(scope.modules ? { module: { items: 0, passed: 0, failed: 0 } } : {}),
        },
      } as const;

      if (opts.json) {
        const out = { items: [] as BulkItemResult[], summary, version: '1.0' };
        console.log(JSON.stringify(out, null, 2));
      } else {
        console.log('No items found to validate.');
      }

      process.exitCode = 0;
      return;
    }

    const results: BulkItemResult[] = [];
    let index = 0;
    let running = 0;
    let passed = 0;
    let failed = 0;

    await new Promise<void>((resolve) => {
      const next = () => {
        while (running < concurrency && index < queue.length) {
          const currentIndex = index++;
          const task = queue[currentIndex];
          running++;
          if (spinner) spinner.text = `Validating (${currentIndex + 1}/${queue.length})...`;
          task()
            .then(res => {
              results.push(res);
              if (res.valid) passed++; else failed++;
            })
            .catch((error: any) => {
              const message = error?.message || 'Unknown error';
              const res: BulkItemResult = { id: getPlannedId(currentIndex, changeIds, specIds) ?? 'unknown', type: getPlannedType(currentIndex, changeIds, specIds) ?? 'change', valid: false, issues: [{ level: 'ERROR', path: 'file', message }], durationMs: 0 };
              results.push(res);
              failed++;
            })
            .finally(() => {
              running--;
              if (index >= queue.length && running === 0) resolve();
              else next();
            });
        }
      };
      next();
    });

    spinner?.stop();

    results.sort((a, b) => a.id.localeCompare(b.id));
    const summary = {
      totals: { items: results.length, passed, failed },
      byType: {
        ...(scope.changes ? { change: summarizeType(results, 'change') } : {}),
        ...(scope.specs ? { spec: summarizeType(results, 'spec') } : {}),
        ...(scope.modules ? { module: summarizeType(results, 'module') } : {}),
      },
    } as const;

    if (opts.json) {
      const out = { items: results, summary, version: '1.0' };
      console.log(JSON.stringify(out, null, 2));
    } else {
      for (const res of results) {
        if (res.valid) console.log(`✓ ${res.type}/${res.id}`);
        else console.error(`✗ ${res.type}/${res.id}`);
      }
      console.log(`Totals: ${summary.totals.passed} passed, ${summary.totals.failed} failed (${summary.totals.items} items)`);
    }

    process.exitCode = failed > 0 ? 1 : 0;
  }
}

function summarizeType(results: BulkItemResult[], type: ItemType) {
  const filtered = results.filter(r => r.type === type);
  const items = filtered.length;
  const passed = filtered.filter(r => r.valid).length;
  const failed = items - passed;
  return { items, passed, failed };
}

function normalizeConcurrency(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return n;
}

function getPlannedId(index: number, changeIds: string[], specIds: string[]): string | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return changeIds[index];
  const specIndex = index - totalChanges;
  return specIds[specIndex];
}

function getPlannedType(index: number, changeIds: string[], specIds: string[]): ItemType | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return 'change';
  const specIndex = index - totalChanges;
  if (specIndex >= 0 && specIndex < specIds.length) return 'spec';
  return undefined;
}
