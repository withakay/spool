import { getActiveChangeIds, getChangesForModule } from '../../utils/item-discovery.js';
import { parseModularChangeName } from '../../core/schemas/index.js';

export interface RalphTarget {
  changeId: string;
  moduleId: string;
  inferred: boolean; // true if moduleId was inferred from changeId
}

export interface ResolveTargetOptions {
  changeId?: string;
  moduleId?: string;
  interactive: boolean;
  root?: string;
}

/**
 * Resolves the target change and module for Ralph command execution.
 * Handles interactive selection and module inference.
 */
export async function resolveRalphTarget(
  options: ResolveTargetOptions
): Promise<RalphTarget> {
  const { changeId, moduleId, interactive, root = process.cwd() } = options;
  const { select } = await import('@inquirer/prompts');

  // If change is explicitly provided, validate it and infer module
  if (changeId) {
    const activeChanges = await getActiveChangeIds(root);
    if (!activeChanges.includes(changeId)) {
      throw new Error(`Change ${changeId} not found`);
    }

    const inferredModuleId = inferModuleFromChange(changeId);
    return {
      changeId,
      moduleId: inferredModuleId,
      inferred: true,
    };
  }

  // If module is provided but no change, select from module changes
  if (moduleId) {
    const moduleChanges = await getChangesForModule(moduleId, root);
    
    if (moduleChanges.length === 0) {
      throw new Error(`No changes found for module ${moduleId}`);
    }

    if (moduleChanges.length === 1) {
      return {
        changeId: moduleChanges[0],
        moduleId,
        inferred: false,
      };
    }

    if (!interactive) {
      throw new Error(`Multiple changes found for module ${moduleId}. Use --change to specify or run in interactive mode.`);
    }

    const selectedChange = await select({
      message: `Select a change from module ${moduleId}`,
      choices: moduleChanges.map(change => ({
        name: change,
        value: change,
      })),
    });

    return {
      changeId: selectedChange,
      moduleId,
      inferred: false,
    };
  }

  // Neither change nor module provided - prompt for change selection
  const activeChanges = await getActiveChangeIds(root);
  
  if (activeChanges.length === 0) {
    throw new Error('No changes found');
  }

  if (activeChanges.length === 1) {
    const singleChange = activeChanges[0];
    const inferredModuleId = inferModuleFromChange(singleChange);
    return {
      changeId: singleChange,
      moduleId: inferredModuleId,
      inferred: true,
    };
  }

  if (!interactive) {
    throw new Error('Change selection requires interactive mode. Use --change to specify or run in interactive mode.');
  }

  const selectedChange = await select({
    message: 'Select a change to run Ralph against',
    choices: activeChanges.map(change => ({
      name: change,
      value: change,
    })),
  });

  const inferredModuleId = inferModuleFromChange(selectedChange);
  return {
    changeId: selectedChange,
    moduleId: inferredModuleId,
    inferred: true,
  };
}

/**
 * Extract module ID from a change ID.
 */
export function inferModuleFromChange(changeId: string): string {
  const parsed = parseModularChangeName(changeId);
  if (!parsed) {
    throw new Error(`Invalid change ID format: ${changeId}`);
  }
  return parsed.moduleId;
}
