import { z } from 'zod';

// Module naming: 3 digits + underscore + kebab-case name
// e.g., "001_project-setup"
export const MODULE_ID_PATTERN = /^\d{3}$/;
export const MODULE_NAME_PATTERN = /^(\d{3})_([a-z][a-z0-9-]*)$/;

// Change naming with module prefix: 3 digits + hyphen + 2 digits + underscore + kebab-case name
// e.g., "001-01_init-git-repo"
export const MODULAR_CHANGE_PATTERN = /^(\d{3})-(\d{2})_([a-z][a-z0-9-]*)$/;

// Legacy change naming (no module prefix): kebab-case only
// e.g., "add-auth"
export const LEGACY_CHANGE_PATTERN = /^[a-z][a-z0-9-]*$/;

// Special module ID for ungrouped changes
export const UNGROUPED_MODULE_ID = '000';

// Validation constants
export const MIN_MODULE_PURPOSE_LENGTH = 20;

// Module change entry schema (for the Changes section)
export const ModuleChangeEntrySchema = z.object({
  id: z.string().min(1, 'Change ID cannot be empty'),
  planned: z.boolean().default(false),
  completed: z.boolean().default(false),
});

// Module schema
export const ModuleSchema = z.object({
  // The module ID (e.g., "001")
  id: z.string().regex(MODULE_ID_PATTERN, 'Module ID must be 3 digits (e.g., "001")'),

  // The module name (e.g., "project-setup")
  name: z.string().min(1, 'Module name cannot be empty'),

  // Full directory name (e.g., "001_project-setup")
  fullName: z.string().regex(MODULE_NAME_PATTERN, 'Module folder must be NNN_kebab-name format'),

  // Purpose section (required, min 20 chars)
  purpose: z.string().min(MIN_MODULE_PURPOSE_LENGTH, `Purpose must be at least ${MIN_MODULE_PURPOSE_LENGTH} characters`),

  // Scope: list of capabilities this module may modify
  // Use ["*"] for unrestricted scope
  scope: z.array(z.string().min(1)).min(1, 'Scope must have at least one capability (use "*" for unrestricted)'),

  // Dependencies: list of module IDs that must be completed first
  dependsOn: z.array(z.string().regex(MODULE_ID_PATTERN, 'Dependency must be a valid module ID')).default([]),

  // Changes: list of changes in this module (hybrid: existing + planned)
  changes: z.array(ModuleChangeEntrySchema).default([]),

  // Metadata
  metadata: z.object({
    version: z.string().default('1.0.0'),
    format: z.literal('spool-module'),
    sourcePath: z.string().optional(),
  }).optional(),
});

export type ModuleChangeEntry = z.infer<typeof ModuleChangeEntrySchema>;
export type Module = z.infer<typeof ModuleSchema>;

// Helper functions for parsing module/change names
export function parseModuleName(folderName: string): { id: string; name: string } | null {
  const match = folderName.match(MODULE_NAME_PATTERN);
  if (!match) return null;
  return { id: match[1], name: match[2] };
}

export function parseModularChangeName(folderName: string): { moduleId: string; changeNum: string; name: string } | null {
  const match = folderName.match(MODULAR_CHANGE_PATTERN);
  if (!match) return null;
  return { moduleId: match[1], changeNum: match[2], name: match[3] };
}

export function isModularChange(folderName: string): boolean {
  return MODULAR_CHANGE_PATTERN.test(folderName);
}

export function isLegacyChange(folderName: string): boolean {
  return LEGACY_CHANGE_PATTERN.test(folderName) && !MODULAR_CHANGE_PATTERN.test(folderName);
}

export function getModuleIdFromChange(changeName: string): string | null {
  const parsed = parseModularChangeName(changeName);
  return parsed?.moduleId ?? null;
}

export function formatModuleFolderName(id: string, name: string): string {
  return `${id}_${name}`;
}

export function formatChangeFolderName(moduleId: string, changeNum: string, name: string): string {
  return `${moduleId}-${changeNum}_${name}`;
}

export function getNextChangeNumber(existingChanges: string[], moduleId: string): string {
  const moduleChanges = existingChanges
    .map(c => parseModularChangeName(c))
    .filter((p): p is NonNullable<typeof p> => p !== null && p.moduleId === moduleId)
    .map(p => parseInt(p.changeNum, 10));

  const maxNum = moduleChanges.length > 0 ? Math.max(...moduleChanges) : 0;
  return String(maxNum + 1).padStart(2, '0');
}

export function getNextModuleId(existingModules: string[]): string {
  const moduleIds = existingModules
    .map(m => parseModuleName(m))
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map(p => parseInt(p.id, 10));

  const maxId = moduleIds.length > 0 ? Math.max(...moduleIds) : 0;
  return String(maxId + 1).padStart(3, '0');
}
