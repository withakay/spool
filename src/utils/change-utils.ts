import path from 'path';
import { promises as fs } from 'fs';
import { FileSystemUtils } from './file-system.js';
import { writeChangeMetadata, validateSchemaName } from './change-metadata.js';
import { getChangesPath, getModulesPath, getSpoolPath } from '../core/project-config.js';
import {
  LEGACY_CHANGE_PATTERN,
  MODULAR_CHANGE_PATTERN,
  MODULE_ID_PATTERN,
  UNGROUPED_MODULE_ID,
  formatChangeFolderName,
  formatModuleFolderName,
  parseModularChangeName,
} from '../core/schemas/index.js';
import { getAllChangeIds, getModuleById } from './item-discovery.js';
import { ModuleParser, generateModuleContent } from '../core/parsers/module-parser.js';

const DEFAULT_SCHEMA = 'spec-driven';
const ALLOCATION_STATE_FILE = path.join('workflows', '.state', 'change-allocations.json');

interface AllocationState {
  modules: Record<string, { lastChangeNum: number; updatedAt: string }>;
}

/**
 * Options for creating a change.
 */
export interface CreateChangeOptions {
  /** The workflow schema to use (default: 'spec-driven') */
  schema?: string;
}

/**
 * Options for creating a modular change.
 */
export interface CreateModularChangeOptions extends CreateChangeOptions {
  /** Module ID (3 digits) */
  moduleId: string;
}

/**
 * Result of validating a change name.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ModuleChangeInfo {
  id: string;
  name: string;
  moduleId: string;
  changeNum: string;
}

interface AllocationSnapshot {
  state: AllocationState;
  statePath: string;
}

function titleCaseFromKebab(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function createUngroupedModule(projectRoot: string): Promise<ModuleChangeInfo> {
  const moduleId = UNGROUPED_MODULE_ID;
  const name = 'ungrouped';
  const modulesPath = getModulesPath(projectRoot);
  await FileSystemUtils.createDirectory(modulesPath);

  const folderName = formatModuleFolderName(moduleId, name);
  const moduleDir = path.join(modulesPath, folderName);
  await FileSystemUtils.createDirectory(moduleDir);

  const moduleFile = path.join(moduleDir, 'module.md');
  const content = generateModuleContent({
    title: titleCaseFromKebab(name),
    purpose: 'Ungrouped changes and ad-hoc work that do not fit a module.',
    scope: ['*'],
    dependsOn: [],
    changes: [],
  });
  await fs.writeFile(moduleFile, content, 'utf-8');

  return {
    id: moduleId,
    name,
    moduleId,
    changeNum: '00',
  };
}

async function acquireAllocationLock(projectRoot: string): Promise<{ handle: fs.FileHandle; lockPath: string }> {
  const spoolPath = getSpoolPath(projectRoot);
  const lockPath = path.join(spoolPath, 'workflows', '.state', 'change-allocations.lock');
  await FileSystemUtils.createDirectory(path.dirname(lockPath));

  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const handle = await fs.open(lockPath, 'wx');
      return { handle, lockPath };
    } catch (error: any) {
      if (error?.code !== 'EEXIST') {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  throw new Error('Unable to acquire change allocation lock. Try again.');
}

async function releaseAllocationLock(lock: { handle: fs.FileHandle; lockPath: string }): Promise<void> {
  try {
    await lock.handle.close();
  } finally {
    try {
      await fs.unlink(lock.lockPath);
    } catch {
      // ignore
    }
  }
}

async function loadAllocationState(projectRoot: string): Promise<AllocationSnapshot> {
  const spoolPath = getSpoolPath(projectRoot);
  const statePath = path.join(spoolPath, ALLOCATION_STATE_FILE);
  let state: AllocationState = { modules: {} };

  try {
    const content = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(content) as AllocationState;
    if (parsed && typeof parsed === 'object' && parsed.modules) {
      state = parsed;
    }
  } catch {
    // ignore missing or invalid state
  }

  return { state, statePath };
}

async function writeAllocationState(snapshot: AllocationSnapshot): Promise<void> {
  const payload = JSON.stringify(snapshot.state, null, 2) + '\n';
  await FileSystemUtils.createDirectory(path.dirname(snapshot.statePath));
  await fs.writeFile(snapshot.statePath, payload, 'utf-8');
}

async function getModuleRecordedChangeNumbers(moduleId: string, projectRoot: string): Promise<number[]> {
  const moduleInfo = await getModuleById(moduleId, projectRoot);
  if (!moduleInfo) {
    return [];
  }

  try {
    const moduleFile = path.join(moduleInfo.path, 'module.md');
    const content = await fs.readFile(moduleFile, 'utf-8');
    const parser = new ModuleParser(content, moduleInfo.fullName);
    const parsed = parser.parseModule();
    return parsed.changes
      .map(change => parseModularChangeName(change.id))
      .filter((parsedChange): parsedChange is NonNullable<typeof parsedChange> =>
        Boolean(parsedChange && parsedChange.moduleId === moduleId)
      )
      .map(parsedChange => parseInt(parsedChange.changeNum, 10))
      .filter(num => !Number.isNaN(num));
  } catch {
    return [];
  }
}

function getMaxChangeNumberFromIds(changeIds: string[], moduleId: string): number {
  const changeNumbers = changeIds
    .map(changeId => parseModularChangeName(changeId))
    .filter((parsed): parsed is NonNullable<typeof parsed> => Boolean(parsed && parsed.moduleId === moduleId))
    .map(parsed => parseInt(parsed.changeNum, 10))
    .filter(num => !Number.isNaN(num));

  return changeNumbers.length ? Math.max(...changeNumbers) : 0;
}

function getMaxChangeNumberFromState(state: AllocationState, moduleId: string): number {
  const entry = state.modules[moduleId];
  return entry ? entry.lastChangeNum : 0;
}

function updateAllocationState(state: AllocationState, moduleId: string, changeNum: number): AllocationState {
  const updatedAt = new Date().toISOString();
  return {
    modules: {
      ...state.modules,
      [moduleId]: { lastChangeNum: changeNum, updatedAt },
    },
  };
}

async function ensureModuleExists(projectRoot: string, moduleId: string): Promise<{ id: string; name: string; fullName: string; path: string }> {
  const existing = await getModuleById(moduleId, projectRoot);
  if (existing) {
    return existing;
  }

  if (moduleId === UNGROUPED_MODULE_ID) {
    const created = await createUngroupedModule(projectRoot);
    return {
      id: created.moduleId,
      name: created.name,
      fullName: formatModuleFolderName(created.moduleId, created.name),
      path: path.join(getModulesPath(projectRoot), formatModuleFolderName(created.moduleId, created.name)),
    };
  }

  throw new Error(`Module '${moduleId}' not found. Create it with: spool create module <name>`);
}

async function addChangeToModule(moduleInfo: { id: string; name: string; fullName: string; path: string }, changeId: string): Promise<void> {
  const moduleFile = path.join(moduleInfo.path, 'module.md');
  const content = await fs.readFile(moduleFile, 'utf-8');
  const parser = new ModuleParser(content, moduleInfo.fullName);
  const parsed = parser.parseModule();

  const existing = parsed.changes.find(change => change.id === changeId);
  if (existing) {
    existing.planned = false;
    existing.completed = false;
  } else {
    parsed.changes.push({ id: changeId, planned: false, completed: false });
  }

  const updated = generateModuleContent({
    title: titleCaseFromKebab(moduleInfo.name),
    purpose: parsed.purpose,
    scope: parsed.scope,
    dependsOn: parsed.dependsOn,
    changes: parsed.changes,
  });

  await fs.writeFile(moduleFile, updated, 'utf-8');
}

/**
 * Validates that a change name follows kebab-case conventions.
 *
 * Valid names:
 * - Start with a lowercase letter
 * - Contain only lowercase letters, numbers, and hyphens
 * - Do not start or end with a hyphen
 * - Do not contain consecutive hyphens
 *
 * @param name - The change name to validate
 * @returns Validation result with `valid: true` or `valid: false` with an error message
 *
 * @example
 * validateChangeName('add-auth') // { valid: true }
 * validateChangeName('Add-Auth') // { valid: false, error: '...' }
 */
export function validateChangeName(name: string): ValidationResult {
  // Pattern: starts with lowercase letter, followed by lowercase letters/numbers,
  // optionally followed by hyphen + lowercase letters/numbers (repeatable)
  const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  if (!name) {
    return { valid: false, error: 'Change name cannot be empty' };
  }

  if (!kebabCasePattern.test(name)) {
    // Provide specific error messages for common mistakes
    if (/[A-Z]/.test(name)) {
      return { valid: false, error: 'Change name must be lowercase (use kebab-case)' };
    }
    if (/\s/.test(name)) {
      return { valid: false, error: 'Change name cannot contain spaces (use hyphens instead)' };
    }
    if (/_/.test(name)) {
      return { valid: false, error: 'Change name cannot contain underscores (use hyphens instead)' };
    }
    if (name.startsWith('-')) {
      return { valid: false, error: 'Change name cannot start with a hyphen' };
    }
    if (name.endsWith('-')) {
      return { valid: false, error: 'Change name cannot end with a hyphen' };
    }
    if (/--/.test(name)) {
      return { valid: false, error: 'Change name cannot contain consecutive hyphens' };
    }
    if (/[^a-z0-9-]/.test(name)) {
      return { valid: false, error: 'Change name can only contain lowercase letters, numbers, and hyphens' };
    }
    if (/^[0-9]/.test(name)) {
      return { valid: false, error: 'Change name must start with a letter' };
    }

    return { valid: false, error: 'Change name must follow kebab-case convention (e.g., add-auth, refactor-db)' };
  }

  return { valid: true };
}

export function validateChangeIdentifier(changeId: string): ValidationResult {
  if (!changeId) {
    return { valid: false, error: 'Change ID cannot be empty' };
  }

  if (MODULAR_CHANGE_PATTERN.test(changeId)) {
    return { valid: true };
  }

  if (LEGACY_CHANGE_PATTERN.test(changeId)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Change ID must be kebab-case or NNN-CC_kebab-name format',
  };
}

export function validateModuleId(moduleId: string): ValidationResult {
  if (!moduleId) {
    return { valid: false, error: 'Module ID cannot be empty' };
  }

  if (!MODULE_ID_PATTERN.test(moduleId)) {
    return { valid: false, error: 'Module ID must be 3 digits (e.g., 001)' };
  }

  return { valid: true };
}

/**
 * Creates a new change directory with metadata file.
 *
 * @param projectRoot - The root directory of the project (where `spool/` lives)
 * @param name - The change name (must be valid kebab-case)
 * @param options - Optional settings for the change
 * @throws Error if the change name is invalid
 * @throws Error if the schema name is invalid
 * @throws Error if the change directory already exists
 *
 * @example
 * // Creates spool/changes/add-auth/ with default schema
 * await createChange('/path/to/project', 'add-auth')
 *
 * @example
 * // Creates spool/changes/add-auth/ with TDD schema
 * await createChange('/path/to/project', 'add-auth', { schema: 'tdd' })
 */
export async function createChange(
  projectRoot: string,
  name: string,
  options: CreateChangeOptions = {}
): Promise<void> {
  // Validate the name first
  const validation = validateChangeName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Determine schema (validate if provided)
  const schemaName = options.schema ?? DEFAULT_SCHEMA;
  validateSchemaName(schemaName);

  // Build the change directory path
  const changeDir = path.join(getChangesPath(projectRoot), name);

  // Check if change already exists
  if (await FileSystemUtils.directoryExists(changeDir)) {
    throw new Error(`Change '${name}' already exists at ${changeDir}`);
  }

  // Create the directory (including parent directories if needed)
  await FileSystemUtils.createDirectory(changeDir);

  // Write metadata file with schema and creation date
  const today = new Date().toISOString().split('T')[0];
  writeChangeMetadata(changeDir, {
    schema: schemaName,
    created: today,
  });
}

export async function allocateModularChangeId(
  projectRoot: string,
  moduleId: string,
  name: string
): Promise<ModuleChangeInfo> {
  const validation = validateChangeName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const moduleValidation = validateModuleId(moduleId);
  if (!moduleValidation.valid) {
    throw new Error(moduleValidation.error);
  }

  const lock = await acquireAllocationLock(projectRoot);
  try {
    const [existing, moduleRecords] = await Promise.all([
      getAllChangeIds(projectRoot),
      getModuleRecordedChangeNumbers(moduleId, projectRoot),
    ]);
    const snapshot = await loadAllocationState(projectRoot);
    const maxFromIds = getMaxChangeNumberFromIds(existing, moduleId);
    const maxFromRecords = moduleRecords.length ? Math.max(...moduleRecords) : 0;
    const maxFromState = getMaxChangeNumberFromState(snapshot.state, moduleId);

    const nextChangeNum = Math.max(maxFromIds, maxFromRecords, maxFromState) + 1;
    const changeNum = String(nextChangeNum).padStart(2, '0');
    const changeId = formatChangeFolderName(moduleId, changeNum, name);

    if (existing.includes(changeId)) {
      throw new Error(`Change '${changeId}' already exists`);
    }

    snapshot.state = updateAllocationState(snapshot.state, moduleId, nextChangeNum);
    await writeAllocationState(snapshot);

    return {
      id: changeId,
      name,
      moduleId,
      changeNum,
    };
  } finally {
    await releaseAllocationLock(lock);
  }
}

export async function createModularChange(
  projectRoot: string,
  name: string,
  options: CreateModularChangeOptions
): Promise<ModuleChangeInfo> {
  const moduleInfo = await ensureModuleExists(projectRoot, options.moduleId);
  const changeInfo = await allocateModularChangeId(projectRoot, moduleInfo.id, name);

  const schemaName = options.schema ?? DEFAULT_SCHEMA;
  validateSchemaName(schemaName);

  const changeDir = path.join(getChangesPath(projectRoot), changeInfo.id);
  if (await FileSystemUtils.directoryExists(changeDir)) {
    throw new Error(`Change '${changeInfo.id}' already exists at ${changeDir}`);
  }

  await FileSystemUtils.createDirectory(changeDir);

  const today = new Date().toISOString().split('T')[0];
  writeChangeMetadata(changeDir, {
    schema: schemaName,
    created: today,
  });

  await addChangeToModule(moduleInfo, changeInfo.id);

  return changeInfo;
}
