import { promises as fs } from 'fs';
import path from 'path';
import {
  MODULE_NAME_PATTERN,
  parseModuleName,
  parseModularChangeName,
  isModularChange,
  getModuleIdFromChange,
} from '../core/schemas/index.js';
import {
  getModulesPath,
  getChangesPath,
  getSpecsPath,
  getArchivePath,
} from '../core/project-config.js';

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

