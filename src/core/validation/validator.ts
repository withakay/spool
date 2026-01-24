import { z, ZodError } from 'zod';
import { readFileSync, promises as fs } from 'fs';
import path from 'path';
import {
  SpecSchema,
  ChangeSchema,
  ModuleSchema,
  Spec,
  Change,
  Module,
  parseModularChangeName,
  LEGACY_CHANGE_PATTERN,
  MIN_MODULE_PURPOSE_LENGTH,
} from '../schemas/index.js';
import { MarkdownParser } from '../parsers/markdown-parser.js';
import { ChangeParser } from '../parsers/change-parser.js';
import { ModuleParser } from '../parsers/module-parser.js';
import { ValidationReport, ValidationIssue, ValidationLevel } from './types.js';
import {
  MIN_PURPOSE_LENGTH,
  MAX_REQUIREMENT_TEXT_LENGTH,
  VALIDATION_MESSAGES
} from './constants.js';
import { parseDeltaSpec, normalizeRequirementName } from '../parsers/requirement-blocks.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import {
  getModuleIds,
  getActiveChangeIds,
  getChangesForModule,
  getModuleChangeIndex,
} from '../../utils/item-discovery.js';
import { getChangesPath, getModulesPath } from '../project-config.js';

export class Validator {
  private strictMode: boolean;

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode;
  }

  async validateSpec(filePath: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const specName = this.extractNameFromPath(filePath);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const parser = new MarkdownParser(content);
      
      const spec = parser.parseSpec(specName);
      
      const result = SpecSchema.safeParse(spec);
      
      if (!result.success) {
        issues.push(...this.convertZodErrors(result.error));
      }
      
      issues.push(...this.applySpecRules(spec, content));
      
    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : 'Unknown error';
      const enriched = this.enrichTopLevelError(specName, baseMessage);
      issues.push({
        level: 'ERROR',
        path: 'file',
        message: enriched,
      });
    }
    
    return this.createReport(issues);
  }

  /**
   * Validate spec content from a string (used for pre-write validation of rebuilt specs)
   */
  async validateSpecContent(specName: string, content: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    try {
      const parser = new MarkdownParser(content);
      const spec = parser.parseSpec(specName);
      const result = SpecSchema.safeParse(spec);
      if (!result.success) {
        issues.push(...this.convertZodErrors(result.error));
      }
      issues.push(...this.applySpecRules(spec, content));
    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : 'Unknown error';
      const enriched = this.enrichTopLevelError(specName, baseMessage);
      issues.push({ level: 'ERROR', path: 'file', message: enriched });
    }
    return this.createReport(issues);
  }

  async validateChange(filePath: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const changeName = this.extractNameFromPath(filePath);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const changeDir = path.dirname(filePath);
      const parser = new ChangeParser(content, changeDir);
      
      const change = await parser.parseChangeWithDeltas(changeName);
      
      const result = ChangeSchema.safeParse(change);
      
      if (!result.success) {
        issues.push(...this.convertZodErrors(result.error));
      }
      
      issues.push(...this.applyChangeRules(change, content));
      
    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : 'Unknown error';
      const enriched = this.enrichTopLevelError(changeName, baseMessage);
      issues.push({
        level: 'ERROR',
        path: 'file',
        message: enriched,
      });
    }
    
    return this.createReport(issues);
  }

  /**
   * Validate delta-formatted spec files under a change directory.
   * Enforces:
   * - At least one delta across all files
   * - ADDED/MODIFIED: each requirement has SHALL/MUST and at least one scenario
   * - REMOVED: names only; no scenario/description required
   * - RENAMED: pairs well-formed
   * - No duplicates within sections; no cross-section conflicts per spec
   */
  async validateChangeDeltaSpecs(changeDir: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const changeId = path.basename(changeDir);
    issues.push(...await this.applyModuleGroupingRules(changeId));
    const specsDir = path.join(changeDir, 'specs');
    let totalDeltas = 0;
    const missingHeaderSpecs: string[] = [];
    const emptySectionSpecs: Array<{ path: string; sections: string[] }> = [];

    try {
      const entries = await fs.readdir(specsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const specName = entry.name;
        const specFile = path.join(specsDir, specName, 'spec.md');
        let content: string | undefined;
        try {
          content = await fs.readFile(specFile, 'utf-8');
        } catch {
          continue;
        }

        const plan = parseDeltaSpec(content);
        const entryPath = `${specName}/spec.md`;
        const sectionNames: string[] = [];
        if (plan.sectionPresence.added) sectionNames.push('## ADDED Requirements');
        if (plan.sectionPresence.modified) sectionNames.push('## MODIFIED Requirements');
        if (plan.sectionPresence.removed) sectionNames.push('## REMOVED Requirements');
        if (plan.sectionPresence.renamed) sectionNames.push('## RENAMED Requirements');
        const hasSections = sectionNames.length > 0;
        const hasEntries = plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length > 0;
        if (!hasEntries) {
          if (hasSections) emptySectionSpecs.push({ path: entryPath, sections: sectionNames });
          else missingHeaderSpecs.push(entryPath);
        }

        const addedNames = new Set<string>();
        const modifiedNames = new Set<string>();
        const removedNames = new Set<string>();
        const renamedFrom = new Set<string>();
        const renamedTo = new Set<string>();

        // Validate ADDED
        for (const block of plan.added) {
          const key = normalizeRequirementName(block.name);
          totalDeltas++;
          if (addedNames.has(key)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate requirement in ADDED: "${block.name}"` });
          } else {
            addedNames.add(key);
          }
          const requirementText = this.extractRequirementText(block.raw);
          if (!requirementText) {
            issues.push({ level: 'ERROR', path: entryPath, message: `ADDED "${block.name}" is missing requirement text` });
          } else if (!this.containsShallOrMust(requirementText)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `ADDED "${block.name}" must contain SHALL or MUST` });
          }
          const scenarioCount = this.countScenarios(block.raw);
          if (scenarioCount < 1) {
            issues.push({ level: 'ERROR', path: entryPath, message: `ADDED "${block.name}" must include at least one scenario` });
          }
        }

        // Validate MODIFIED
        for (const block of plan.modified) {
          const key = normalizeRequirementName(block.name);
          totalDeltas++;
          if (modifiedNames.has(key)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate requirement in MODIFIED: "${block.name}"` });
          } else {
            modifiedNames.add(key);
          }
          const requirementText = this.extractRequirementText(block.raw);
          if (!requirementText) {
            issues.push({ level: 'ERROR', path: entryPath, message: `MODIFIED "${block.name}" is missing requirement text` });
          } else if (!this.containsShallOrMust(requirementText)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `MODIFIED "${block.name}" must contain SHALL or MUST` });
          }
          const scenarioCount = this.countScenarios(block.raw);
          if (scenarioCount < 1) {
            issues.push({ level: 'ERROR', path: entryPath, message: `MODIFIED "${block.name}" must include at least one scenario` });
          }
        }

        // Validate REMOVED (names only)
        for (const name of plan.removed) {
          const key = normalizeRequirementName(name);
          totalDeltas++;
          if (removedNames.has(key)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate requirement in REMOVED: "${name}"` });
          } else {
            removedNames.add(key);
          }
        }

        // Validate RENAMED pairs
        for (const { from, to } of plan.renamed) {
          const fromKey = normalizeRequirementName(from);
          const toKey = normalizeRequirementName(to);
          totalDeltas++;
          if (renamedFrom.has(fromKey)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate FROM in RENAMED: "${from}"` });
          } else {
            renamedFrom.add(fromKey);
          }
          if (renamedTo.has(toKey)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate TO in RENAMED: "${to}"` });
          } else {
            renamedTo.add(toKey);
          }
        }

        // Cross-section conflicts (within the same spec file)
        for (const n of modifiedNames) {
          if (removedNames.has(n)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `Requirement present in both MODIFIED and REMOVED: "${n}"` });
          }
          if (addedNames.has(n)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `Requirement present in both MODIFIED and ADDED: "${n}"` });
          }
        }
        for (const n of addedNames) {
          if (removedNames.has(n)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `Requirement present in both ADDED and REMOVED: "${n}"` });
          }
        }
        for (const { from, to } of plan.renamed) {
          const fromKey = normalizeRequirementName(from);
          const toKey = normalizeRequirementName(to);
          if (modifiedNames.has(fromKey)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `MODIFIED references old name from RENAMED. Use new header for "${to}"` });
          }
          if (addedNames.has(toKey)) {
            issues.push({ level: 'ERROR', path: entryPath, message: `RENAMED TO collides with ADDED for "${to}"` });
          }
        }
      }
    } catch {
      // If no specs dir, treat as no deltas
    }

    for (const { path: specPath, sections } of emptySectionSpecs) {
      issues.push({
        level: 'ERROR',
        path: specPath,
        message: `Delta sections ${this.formatSectionList(sections)} were found, but no requirement entries parsed. Ensure each section includes at least one "### Requirement:" block (REMOVED may use bullet list syntax).`,
      });
    }
    for (const path of missingHeaderSpecs) {
      issues.push({
        level: 'ERROR',
        path,
        message: 'No delta sections found. Add headers such as "## ADDED Requirements" or move non-delta notes outside specs/.',
      });
    }

    if (totalDeltas === 0) {
      issues.push({ level: 'ERROR', path: 'file', message: this.enrichTopLevelError('change', VALIDATION_MESSAGES.CHANGE_NO_DELTAS) });
    }

    if (totalDeltas > 10) { // Using hardcoded value or should import MAX_DELTAS_PER_CHANGE? Imported in next step if needed
       // Check if ignored in config
       // We don't have access to config here directly usually, unless passed in or read.
       // The spec says: "The validator should check if the change ID is present in the `ignore_warnings` list in `.spool.yaml` (or passed via config)."
       // Validator doesn't seem to take config currently.
       // Let's defer config check to the caller or add it?
       // For now, let's just emit the warning with metadata.
       
       issues.push({
         level: 'WARNING',
         path: 'file',
         message: VALIDATION_MESSAGES.CHANGE_TOO_MANY_DELTAS,
         metadata: {
           type: 'too_many_deltas',
           count: totalDeltas,
           threshold: 10,
           remediation: 'split'
         }
       });
    }

    return this.createReport(issues);
  }

  /**
   * Validate a module directory.
   * Checks:
   * - module.md parses correctly
   * - Schema validation
   * - Dependencies exist and are not circular
   * - Listed changes exist (unless marked planned)
   * - Change prefixes match module ID
   * - Scope violations (changes modifying specs outside scope)
   */
  async validateModule(moduleDir: string, root: string = process.cwd()): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const moduleFolderName = path.basename(moduleDir);
    const moduleFile = path.join(moduleDir, 'module.md');

    try {
      const content = await fs.readFile(moduleFile, 'utf-8');
      const parser = new ModuleParser(content, moduleFolderName);
      const module = parser.parseModule();

      // Schema validation
      const result = ModuleSchema.safeParse(module);
      if (!result.success) {
        issues.push(...this.convertZodErrors(result.error));
      }

      // Apply module-specific rules
      issues.push(...await this.applyModuleRules(module, root));

    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : 'Unknown error';
      issues.push({
        level: 'ERROR',
        path: 'module.md',
        message: baseMessage,
      });
    }

    return this.createReport(issues);
  }

  /**
   * Validate a module and all its changes.
   */
  async validateModuleWithChanges(moduleDir: string, root: string = process.cwd()): Promise<{
    moduleReport: ValidationReport;
    changeReports: Array<{ changeId: string; report: ValidationReport }>;
  }> {
    const moduleReport = await this.validateModule(moduleDir, root);
    const changeReports: Array<{ changeId: string; report: ValidationReport }> = [];

    const moduleFolderName = path.basename(moduleDir);
    const parsed = parseModularChangeName(moduleFolderName);
    if (!parsed) {
      // Use the module folder name as-is and extract module ID
      const match = moduleFolderName.match(/^(\d{3})_/);
      if (match) {
        const moduleId = match[1];
        const changes = await getChangesForModule(moduleId, root);
        const changesDir = getChangesPath(root);

        for (const changeId of changes) {
          const changeDir = path.join(changesDir, changeId);
          const report = await this.validateChangeDeltaSpecs(changeDir);
          changeReports.push({ changeId, report });
        }
      }
    }

    return { moduleReport, changeReports };
  }

  private async applyModuleGroupingRules(changeId: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Only enforce grouping rules when the project defines modules.
    const moduleIds = await getModuleIds();
    if (moduleIds.length === 0) return issues;

    const parsed = parseModularChangeName(changeId);

    const changeIndex = await getModuleChangeIndex();
    const modules = changeIndex.get(changeId) ?? [];

    if (!parsed) {
      // Legacy ids (e.g. "c1") are allowed in non-strict mode, but we still
      // expect them to be listed under exactly one module when modules exist.
      // In strict mode, treat legacy ids as errors.
      if (LEGACY_CHANGE_PATTERN.test(changeId)) {
        issues.push({
          level: this.strictMode ? 'ERROR' : 'WARNING',
          path: 'module',
          message: `${VALIDATION_MESSAGES.CHANGE_LEGACY_ID}: ${changeId}`,
        });
      }

      if (modules.length === 0) {
        issues.push({
          level: 'ERROR',
          path: 'module',
          message: `${VALIDATION_MESSAGES.CHANGE_NOT_IN_MODULE}: ${changeId}`,
        });
        return issues;
      }

      if (modules.length > 1) {
        issues.push({
          level: 'ERROR',
          path: 'module',
          message: `${VALIDATION_MESSAGES.CHANGE_MULTIPLE_MODULES}: ${modules.join(', ')}`,
        });
        return issues;
      }

      return issues;
    }

    if (modules.length === 0) {
      issues.push({
        level: 'ERROR',
        path: 'module',
        message: `${VALIDATION_MESSAGES.CHANGE_NOT_IN_MODULE}: ${changeId}`,
      });
      return issues;
    }

    if (modules.length > 1) {
      issues.push({
        level: 'ERROR',
        path: 'module',
        message: `${VALIDATION_MESSAGES.CHANGE_MULTIPLE_MODULES}: ${modules.join(', ')}`,
      });
      return issues;
    }

    if (modules[0] !== parsed.moduleId) {
      issues.push({
        level: 'ERROR',
        path: 'module',
        message: `${VALIDATION_MESSAGES.CHANGE_MODULE_MISMATCH}: expected ${parsed.moduleId}, listed under ${modules[0]}`,
      });
    }

    return issues;
  }

  private async applyModuleRules(module: Module, root: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check purpose length
    if (module.purpose.length < MIN_MODULE_PURPOSE_LENGTH) {
      issues.push({
        level: 'WARNING',
        path: 'purpose',
        message: VALIDATION_MESSAGES.MODULE_PURPOSE_TOO_SHORT,
      });
    }

    // Check dependencies exist
    const existingModules = await getModuleIds(root);
    const existingModuleIds = new Set(existingModules.map(m => m.match(/^(\d{3})_/)?.[1]).filter(Boolean));

    for (const dep of module.dependsOn) {
      if (!existingModuleIds.has(dep)) {
        issues.push({
          level: 'ERROR',
          path: `dependsOn.${dep}`,
          message: `${VALIDATION_MESSAGES.MODULE_DEPENDENCY_NOT_FOUND}: ${dep}`,
        });
      }
    }

    // Check for circular dependencies
    const circularDeps = await this.detectCircularDependencies(module.id, module.dependsOn, root, new Set());
    if (circularDeps) {
      issues.push({
        level: 'ERROR',
        path: 'dependsOn',
        message: `${VALIDATION_MESSAGES.MODULE_DEPENDENCY_CIRCULAR}: ${circularDeps.join(' -> ')}`,
      });
    }

    // Check listed changes
    const activeChanges = await getActiveChangeIds(root);
    const activeChangeSet = new Set(activeChanges);

    for (const changeEntry of module.changes) {
      // Skip planned changes
      if (changeEntry.planned) continue;

      // Check change exists
      if (!activeChangeSet.has(changeEntry.id)) {
        issues.push({
          level: 'ERROR',
          path: `changes.${changeEntry.id}`,
          message: `${VALIDATION_MESSAGES.MODULE_CHANGE_NOT_FOUND}: ${changeEntry.id}`,
        });
        continue;
      }

      // Check change prefix matches module
      const parsed = parseModularChangeName(changeEntry.id);
      if (!parsed || parsed.moduleId !== module.id) {
        issues.push({
          level: 'ERROR',
          path: `changes.${changeEntry.id}`,
          message: `${VALIDATION_MESSAGES.MODULE_CHANGE_PREFIX_MISMATCH}: expected ${module.id}-XX_name`,
        });
      }
    }

    // Check for orphan changes (changes with this module's prefix not listed in module)
    const listedChangeIds = new Set(module.changes.map(c => c.id));
    for (const changeId of activeChanges) {
      const parsed = parseModularChangeName(changeId);
      if (parsed?.moduleId === module.id && !listedChangeIds.has(changeId)) {
        issues.push({
          level: 'WARNING',
          path: `changes`,
          message: `${VALIDATION_MESSAGES.MODULE_ORPHAN_CHANGE}: ${changeId}`,
        });
      }
    }

    // Check scope violations
    if (!module.scope.includes('*')) {
      const scopeViolations = await this.checkScopeViolations(module, root);
      issues.push(...scopeViolations);
    }

    return issues;
  }

  private async detectCircularDependencies(
    moduleId: string,
    dependencies: string[],
    root: string,
    visited: Set<string>
  ): Promise<string[] | null> {
    if (visited.has(moduleId)) {
      return [moduleId];
    }

    visited.add(moduleId);

    for (const dep of dependencies) {
      // Load the dependent module to get its dependencies
      const modulesPath = getModulesPath(root);
      const moduleNames = await getModuleIds(root);
      const depModule = moduleNames.find(m => m.startsWith(`${dep}_`));

      if (depModule) {
        try {
          const moduleFile = path.join(modulesPath, depModule, 'module.md');
          const content = await fs.readFile(moduleFile, 'utf-8');
          const parser = new ModuleParser(content, depModule);
          const parsed = parser.parseModule();

          const circular = await this.detectCircularDependencies(dep, parsed.dependsOn, root, new Set(visited));
          if (circular) {
            return [moduleId, ...circular];
          }
        } catch {
          // If we can't parse the module, skip circular dependency check for it
        }
      }
    }

    return null;
  }

  private async checkScopeViolations(module: Module, root: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const scopeSet = new Set(module.scope);
    const changesDir = getChangesPath(root);

    // Get changes for this module
    const changes = await getChangesForModule(module.id, root);

    for (const changeId of changes) {
      const specsDir = path.join(changesDir, changeId, 'specs');

      try {
        const entries = await fs.readdir(specsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const specName = entry.name;

          if (!scopeSet.has(specName)) {
            issues.push({
              level: 'ERROR',
              path: `changes.${changeId}`,
              message: `${VALIDATION_MESSAGES.MODULE_SCOPE_VIOLATION}: change "${changeId}" modifies capability "${specName}" which is not in module scope. ${VALIDATION_MESSAGES.GUIDE_MODULE_SCOPE}`,
            });
          }
        }
      } catch {
        // specs directory might not exist
      }
    }

    return issues;
  }

  private convertZodErrors(error: ZodError): ValidationIssue[] {
    return error.issues.map(err => {
      let message = err.message;
      if (message === VALIDATION_MESSAGES.CHANGE_NO_DELTAS) {
        message = `${message}. ${VALIDATION_MESSAGES.GUIDE_NO_DELTAS}`;
      }
      return {
        level: 'ERROR' as ValidationLevel,
        path: err.path.join('.'),
        message,
      };
    });
  }

  private applySpecRules(spec: Spec, content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    if (spec.overview.length < MIN_PURPOSE_LENGTH) {
      issues.push({
        level: 'WARNING',
        path: 'overview',
        message: VALIDATION_MESSAGES.PURPOSE_TOO_BRIEF,
      });
    }
    
    spec.requirements.forEach((req, index) => {
      if (req.text.length > MAX_REQUIREMENT_TEXT_LENGTH) {
        issues.push({
          level: 'INFO',
          path: `requirements[${index}]`,
          message: VALIDATION_MESSAGES.REQUIREMENT_TOO_LONG,
        });
      }
      
      if (req.scenarios.length === 0) {
        issues.push({
          level: 'WARNING',
          path: `requirements[${index}].scenarios`,
          message: `${VALIDATION_MESSAGES.REQUIREMENT_NO_SCENARIOS}. ${VALIDATION_MESSAGES.GUIDE_SCENARIO_FORMAT}`,
        });
      }
    });
    
    return issues;
  }

  private applyChangeRules(change: Change, content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const MIN_DELTA_DESCRIPTION_LENGTH = 10;
    
    change.deltas.forEach((delta, index) => {
      if (!delta.description || delta.description.length < MIN_DELTA_DESCRIPTION_LENGTH) {
        issues.push({
          level: 'WARNING',
          path: `deltas[${index}].description`,
          message: VALIDATION_MESSAGES.DELTA_DESCRIPTION_TOO_BRIEF,
        });
      }
      
      if ((delta.operation === 'ADDED' || delta.operation === 'MODIFIED') && 
          (!delta.requirements || delta.requirements.length === 0)) {
        issues.push({
          level: 'WARNING',
          path: `deltas[${index}].requirements`,
          message: `${delta.operation} ${VALIDATION_MESSAGES.DELTA_MISSING_REQUIREMENTS}`,
        });
      }
    });
    
    return issues;
  }

  private enrichTopLevelError(itemId: string, baseMessage: string): string {
    const msg = baseMessage.trim();
    if (msg === VALIDATION_MESSAGES.CHANGE_NO_DELTAS) {
      return `${msg}. ${VALIDATION_MESSAGES.GUIDE_NO_DELTAS}`;
    }
    if (msg.includes('Spec must have a Purpose section') || msg.includes('Spec must have a Requirements section')) {
      return `${msg}. ${VALIDATION_MESSAGES.GUIDE_MISSING_SPEC_SECTIONS}`;
    }
    if (msg.includes('Change must have a Why section') || msg.includes('Change must have a What Changes section')) {
      return `${msg}. ${VALIDATION_MESSAGES.GUIDE_MISSING_CHANGE_SECTIONS}`;
    }
    return msg;
  }

  private extractNameFromPath(filePath: string): string {
    const normalizedPath = FileSystemUtils.toPosixPath(filePath);
    const parts = normalizedPath.split('/');
    
    // Look for the directory name after 'specs' or 'changes'
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] === 'specs' || parts[i] === 'changes') {
        if (i < parts.length - 1) {
          return parts[i + 1];
        }
      }
    }
    
    // Fallback to filename without extension if not in expected structure
    const fileName = parts[parts.length - 1] ?? '';
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  }

  private createReport(issues: ValidationIssue[]): ValidationReport {
    const errors = issues.filter(i => i.level === 'ERROR').length;
    const warnings = issues.filter(i => i.level === 'WARNING').length;
    const info = issues.filter(i => i.level === 'INFO').length;
    
    const valid = this.strictMode 
      ? errors === 0 && warnings === 0
      : errors === 0;
    
    return {
      valid,
      issues,
      summary: {
        errors,
        warnings,
        info,
      },
    };
  }

  isValid(report: ValidationReport): boolean {
    return report.valid;
  }

  private extractRequirementText(blockRaw: string): string | undefined {
    const lines = blockRaw.split('\n');
    // Skip header line (index 0)
    let i = 1;

    // Find the first substantial text line, skipping metadata and blank lines
    for (; i < lines.length; i++) {
      const line = lines[i];

      // Stop at scenario headers
      if (/^####\s+/.test(line)) break;

      const trimmed = line.trim();

      // Skip blank lines
      if (trimmed.length === 0) continue;

      // Skip metadata lines (lines starting with ** like **ID**, **Priority**, etc.)
      if (/^\*\*[^*]+\*\*:/.test(trimmed)) continue;

      // Found first non-metadata, non-blank line - this is the requirement text
      return trimmed;
    }

    // No requirement text found
    return undefined;
  }

  private containsShallOrMust(text: string): boolean {
    return /\b(SHALL|MUST)\b/.test(text);
  }

  private countScenarios(blockRaw: string): number {
    const matches = blockRaw.match(/^####\s+/gm);
    return matches ? matches.length : 0;
  }

  private formatSectionList(sections: string[]): string {
    if (sections.length === 0) return '';
    if (sections.length === 1) return sections[0];
    const head = sections.slice(0, -1);
    const last = sections[sections.length - 1];
    return `${head.join(', ')} and ${last}`;
  }
}
