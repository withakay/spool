import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import { OPENSPEC_DIR_NAME } from './config.js';
import { getGlobalConfig } from './global-config.js';

/**
 * Name of the repo-level configuration file.
 */
export const PROJECT_CONFIG_FILE_NAME = 'openspec.json';

/**
 * Zod schema for project-level OpenSpec configuration.
 * Uses passthrough() to preserve unknown fields for forward compatibility.
 */
export const ProjectConfigSchema = z
  .object({
    /**
     * The path (relative to project root) where openspec stores its files.
     * Defaults to 'openspec'.
     */
    projectPath: z.string().optional(),
  })
  .passthrough();

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/**
 * Default project configuration values.
 */
export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  projectPath: undefined, // Will fall back to OPENSPEC_DIR_NAME
};

/**
 * Cache for project configs to avoid repeated filesystem reads.
 * Key is the absolute path to the project root.
 */
const projectConfigCache = new Map<string, ProjectConfig | null>();

/**
 * Clears the project config cache. Useful for testing.
 */
export function clearProjectConfigCache(): void {
  projectConfigCache.clear();
}

/**
 * Loads the project configuration from a repo-level openspec.json file.
 * Returns null if the file doesn't exist.
 *
 * @param projectRoot - The root directory of the project
 * @returns The parsed project config, or null if not found
 */
export function loadProjectConfig(projectRoot: string): ProjectConfig | null {
  const absoluteRoot = path.resolve(projectRoot);

  // Check cache first
  if (projectConfigCache.has(absoluteRoot)) {
    return projectConfigCache.get(absoluteRoot) ?? null;
  }

  const configPath = path.join(absoluteRoot, PROJECT_CONFIG_FILE_NAME);

  try {
    if (!fs.existsSync(configPath)) {
      projectConfigCache.set(absoluteRoot, null);
      return null;
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Validate with schema
    const result = ProjectConfigSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`Warning: Invalid ${PROJECT_CONFIG_FILE_NAME} in ${projectRoot}: ${result.error.message}`);
      projectConfigCache.set(absoluteRoot, null);
      return null;
    }

    projectConfigCache.set(absoluteRoot, result.data);
    return result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Warning: Invalid JSON in ${configPath}, ignoring project config`);
    }
    projectConfigCache.set(absoluteRoot, null);
    return null;
  }
}

/**
 * Saves the project configuration to a repo-level openspec.json file.
 *
 * @param projectRoot - The root directory of the project
 * @param config - The configuration to save
 */
export function saveProjectConfig(projectRoot: string, config: ProjectConfig): void {
  const absoluteRoot = path.resolve(projectRoot);
  const configPath = path.join(absoluteRoot, PROJECT_CONFIG_FILE_NAME);

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

  // Update cache
  projectConfigCache.set(absoluteRoot, config);
}

/**
 * Gets the resolved OpenSpec directory name for a project.
 *
 * Priority order:
 * 1. Repo-level openspec.json projectPath
 * 2. Global config (~/.config/openspec/config.json) projectPath
 * 3. Default: 'openspec'
 *
 * @param projectRoot - The root directory of the project (defaults to cwd)
 * @returns The OpenSpec directory name (relative path)
 */
export function getOpenSpecDirName(projectRoot: string = process.cwd()): string {
  // 1. Check repo-level config
  const projectConfig = loadProjectConfig(projectRoot);
  if (projectConfig?.projectPath) {
    return projectConfig.projectPath;
  }

  // 2. Check global config
  const globalConfig = getGlobalConfig();
  if (globalConfig.projectPath) {
    return globalConfig.projectPath;
  }

  // 3. Fall back to default
  return OPENSPEC_DIR_NAME;
}

/**
 * Gets the absolute path to the OpenSpec directory for a project.
 *
 * @param projectRoot - The root directory of the project (defaults to cwd)
 * @returns The absolute path to the OpenSpec directory
 */
export function getOpenSpecPath(projectRoot: string = process.cwd()): string {
  const absoluteRoot = path.resolve(projectRoot);
  const dirName = getOpenSpecDirName(absoluteRoot);
  return path.join(absoluteRoot, dirName);
}

/**
 * Gets the absolute path to the changes directory.
 *
 * @param projectRoot - The root directory of the project (defaults to cwd)
 * @returns The absolute path to the changes directory
 */
export function getChangesPath(projectRoot: string = process.cwd()): string {
  return path.join(getOpenSpecPath(projectRoot), 'changes');
}

/**
 * Gets the absolute path to the specs directory.
 *
 * @param projectRoot - The root directory of the project (defaults to cwd)
 * @returns The absolute path to the specs directory
 */
export function getSpecsPath(projectRoot: string = process.cwd()): string {
  return path.join(getOpenSpecPath(projectRoot), 'specs');
}

/**
 * Gets the absolute path to the modules directory.
 *
 * @param projectRoot - The root directory of the project (defaults to cwd)
 * @returns The absolute path to the modules directory
 */
export function getModulesPath(projectRoot: string = process.cwd()): string {
  return path.join(getOpenSpecPath(projectRoot), 'modules');
}

/**
 * Gets the absolute path to the archive directory.
 *
 * @param projectRoot - The root directory of the project (defaults to cwd)
 * @returns The absolute path to the archive directory
 */
export function getArchivePath(projectRoot: string = process.cwd()): string {
  return path.join(getChangesPath(projectRoot), 'archive');
}
