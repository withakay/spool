import { promises as fs } from 'fs';
import path from 'path';
import {
  MODULE_NAME_PATTERN,
  parseModuleName,
  parseModularChangeName,
  isModularChange,
  getModuleIdFromChange,
} from '../core/schemas/index.js';
import { parseModuleId, parseChangeId } from './id-parser.js';
import {
  getModulesPath,
  getChangesPath,
  getSpecsPath,
  getArchivePath,
} from '../core/project-config.js';
import { ModuleParser } from '../core/parsers/module-parser.js';

export interface ModuleInfo {
  id: string;
  name: string;
  fullName: string;
  path: string;
}

export interface ChangeInfo {
  id: string;
  moduleId: string | null;
  path: string;
}

export async function getModuleIds(root: string = process.cwd()): Promise<string[]> {
  const modulesPath = getModulesPath(root);
  try {
    const entries = await fs.readdir(modulesPath, { withFileTypes: true });
    const result: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      if (!MODULE_NAME_PATTERN.test(entry.name)) continue;
      const moduleFile = path.join(modulesPath, entry.name, 'module.md');
      try {
        await fs.access(moduleFile);
        result.push(entry.name);
      } catch {
        // skip directories without module.md
      }
    }
    return result.sort();
  } catch {
    return [];
  }
}

export async function getModuleInfo(root: string = process.cwd()): Promise<ModuleInfo[]> {
  const moduleNames = await getModuleIds(root);
  const modulesPath = getModulesPath(root);

  return moduleNames.map(fullName => {
    const parsed = parseModuleName(fullName);
    return {
      id: parsed?.id ?? '',
      name: parsed?.name ?? '',
      fullName,
      path: path.join(modulesPath, fullName),
    };
  }).filter(m => m.id !== '');
}

export async function getModuleById(moduleId: string, root: string = process.cwd()): Promise<ModuleInfo | null> {
  const modules = await getModuleInfo(root);
  return modules.find(m => m.id === moduleId) ?? null;
}

export async function getChangesForModule(moduleId: string, root: string = process.cwd()): Promise<string[]> {
  const allChanges = await getActiveChangeIds(root);
  return allChanges.filter(changeId => {
    const parsed = parseModularChangeName(changeId);
    return parsed?.moduleId === moduleId;
  });
}

export async function getActiveChangeIds(root: string = process.cwd()): Promise<string[]> {
  const changesPath = getChangesPath(root);
  try {
    const entries = await fs.readdir(changesPath, { withFileTypes: true });
    const result: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'archive') continue;
      const proposalPath = path.join(changesPath, entry.name, 'proposal.md');
      try {
        await fs.access(proposalPath);
        result.push(entry.name);
      } catch {
        // skip directories without proposal.md
      }
    }
    return result.sort();
  } catch {
    return [];
  }
}

async function getChangeDirectoryIds(changesPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(changesPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'archive')
      .map(entry => entry.name)
      .sort();
  } catch {
    return [];
  }
}

export async function getAllChangeIds(root: string = process.cwd()): Promise<string[]> {
  const changesPath = getChangesPath(root);
  const archivePath = getArchivePath(root);
  const [active, archived] = await Promise.all([
    getChangeDirectoryIds(changesPath),
    getChangeDirectoryIds(archivePath),
  ]);
  return Array.from(new Set([...active, ...archived])).sort();
}

export async function getSpecIds(root: string = process.cwd()): Promise<string[]> {
  const specsPath = getSpecsPath(root);
  const result: string[] = [];
  try {
    const entries = await fs.readdir(specsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const specFile = path.join(specsPath, entry.name, 'spec.md');
      try {
        await fs.access(specFile);
        result.push(entry.name);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  return result.sort();
}

export async function getArchivedChangeIds(root: string = process.cwd()): Promise<string[]> {
  const archivePath = getArchivePath(root);
  try {
    const entries = await fs.readdir(archivePath, { withFileTypes: true });
    const result: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const proposalPath = path.join(archivePath, entry.name, 'proposal.md');
      try {
        await fs.access(proposalPath);
        result.push(entry.name);
      } catch {
        // skip directories without proposal.md
      }
    }
    return result.sort();
  } catch {
    return [];
  }
}

export async function getModuleChangeIndex(root: string = process.cwd()): Promise<Map<string, string[]>> {
  const modules = await getModuleInfo(root);
  const changeMap = new Map<string, string[]>();

  await Promise.all(modules.map(async (moduleInfo) => {
    try {
      const moduleFile = path.join(moduleInfo.path, 'module.md');
      const content = await fs.readFile(moduleFile, 'utf-8');
      const parser = new ModuleParser(content, moduleInfo.fullName);
      const parsed = parser.parseModule();
      for (const change of parsed.changes) {
        const existing = changeMap.get(change.id) ?? [];
        if (!existing.includes(moduleInfo.id)) {
          existing.push(moduleInfo.id);
          changeMap.set(change.id, existing);
        }
      }
    } catch {
      // ignore parse errors; module validation will surface
    }
  }));

  return changeMap;
}

/**
 * Resolve a flexible module ID to its canonical folder name.
 * Accepts: "1", "01", "001", "001_my-module"
 * Returns: "001_my-module" (the actual folder name)
 */
export async function resolveModuleId(flexibleId: string, root: string = process.cwd()): Promise<string | null> {
  const parsed = parseModuleId(flexibleId);
  if (!parsed.success) {
    return null;
  }
  
  const moduleInfo = await getModuleById(parsed.moduleId, root);
  return moduleInfo?.fullName ?? null;
}

/**
 * Resolve a flexible change ID to its canonical folder name.
 * Accepts: "1-2_bar", "001-02_bar", "1-00003_bar"
 * Returns: "001-02_bar" (the actual folder name, if it exists)
 */
export async function resolveChangeId(flexibleId: string, root: string = process.cwd()): Promise<string | null> {
  const parsed = parseChangeId(flexibleId);
  if (!parsed.success) {
    return null;
  }
  
  // Look for exact match in active changes
  const activeChanges = await getActiveChangeIds(root);
  
  // First try exact canonical match
  if (activeChanges.includes(parsed.canonical)) {
    return parsed.canonical;
  }
  
  // Then look for a match by module and change number (name might differ in folder)
  for (const changeId of activeChanges) {
    const changeParsed = parseModularChangeName(changeId);
    if (changeParsed && 
        changeParsed.moduleId === parsed.moduleId && 
        changeParsed.changeNum === parsed.changeNum) {
      return changeId;
    }
  }
  
  // Also check archived changes
  const archivedChanges = await getArchivedChangeIds(root);
  for (const changeId of archivedChanges) {
    // Archived changes may have date prefix, so extract the change part
    const match = changeId.match(/(\d{3}-\d{2}_[a-z][a-z0-9-]*)$/);
    if (match) {
      const changeParsed = parseModularChangeName(match[1]);
      if (changeParsed && 
          changeParsed.moduleId === parsed.moduleId && 
          changeParsed.changeNum === parsed.changeNum) {
        return changeId;
      }
    }
  }
  
  return null;
}

/**
 * Resolve a flexible change ID, throwing an error if not found.
 * Provides helpful error messages with suggestions.
 */
export async function resolveChangeIdOrThrow(flexibleId: string, root: string = process.cwd()): Promise<string> {
  const parsed = parseChangeId(flexibleId);
  if (!parsed.success) {
    throw new Error(parsed.hint ? `${parsed.error}. ${parsed.hint}` : parsed.error);
  }
  
  const resolved = await resolveChangeId(flexibleId, root);
  if (!resolved) {
    const activeChanges = await getActiveChangeIds(root);
    const suggestions = activeChanges
      .filter(c => c.startsWith(parsed.moduleId))
      .slice(0, 3);
    
    let errorMsg = `Change "${parsed.canonical}" not found`;
    if (suggestions.length > 0) {
      errorMsg += `. Did you mean: ${suggestions.join(', ')}?`;
    }
    throw new Error(errorMsg);
  }
  
  return resolved;
}

/**
 * Resolve a flexible module ID, throwing an error if not found.
 * Provides helpful error messages with suggestions.
 */
export async function resolveModuleIdOrThrow(flexibleId: string, root: string = process.cwd()): Promise<ModuleInfo> {
  const parsed = parseModuleId(flexibleId);
  if (!parsed.success) {
    throw new Error(parsed.hint ? `${parsed.error}. ${parsed.hint}` : parsed.error);
  }
  
  const moduleInfo = await getModuleById(parsed.moduleId, root);
  if (!moduleInfo) {
    const modules = await getModuleInfo(root);
    const suggestions = modules.slice(0, 3).map(m => m.fullName);
    
    let errorMsg = `Module "${parsed.moduleId}" not found`;
    if (suggestions.length > 0) {
      errorMsg += `. Available modules: ${suggestions.join(', ')}`;
    }
    throw new Error(errorMsg);
  }
  
  return moduleInfo;
}

