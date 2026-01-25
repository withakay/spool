/**
 * Last-worked-on module tracking
 *
 * Stores and retrieves the last module a user worked on,
 * enabling smart defaults in the spool-proposal workflow.
 *
 * State is stored at .spool/.state/session.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { getSpoolPath } from '../core/project-config.js';

const STATE_DIR = '.state';
const STATE_FILE = 'session.json';

interface SessionState {
  lastModuleId?: string;
  lastChangeName?: string;
  updatedAt?: string;
}

/**
 * Get the path to the session state file for a project
 */
function getStateFilePath(projectRoot: string = process.cwd()): string {
  const spoolPath = getSpoolPath(projectRoot);
  return path.join(spoolPath, STATE_DIR, STATE_FILE);
}

/**
 * Read the current session state, returning empty object if not found
 */
function readState(projectRoot: string = process.cwd()): SessionState {
  const statePath = getStateFilePath(projectRoot);
  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(content) as SessionState;
  } catch {
    return {};
  }
}

/**
 * Write session state to the state file
 */
function writeState(state: SessionState, projectRoot: string = process.cwd()): void {
  const statePath = getStateFilePath(projectRoot);
  const stateDir = path.dirname(statePath);

  // Ensure .spool/workflows/.state directory exists
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Get the last worked-on module ID
 *
 * @param projectRoot - The project root directory
 * @returns The last module ID (3-digit format), or null if none
 */
export function getLastModuleId(projectRoot: string = process.cwd()): string | null {
  const state = readState(projectRoot);
  return state.lastModuleId ?? null;
}

/**
 * Set the last worked-on module ID
 *
 * @param moduleId - The module ID (3-digit format, e.g., "001")
 * @param projectRoot - The project root directory
 */
export function setLastModuleId(moduleId: string, projectRoot: string = process.cwd()): void {
  const state = readState(projectRoot);
  state.lastModuleId = moduleId;
  writeState(state, projectRoot);
}

/**
 * Get the last worked-on change name
 *
 * @param projectRoot - The project root directory
 * @returns The last change name (e.g., "001-02_my-change"), or null if none
 */
export function getLastChangeName(projectRoot: string = process.cwd()): string | null {
  const state = readState(projectRoot);
  return state.lastChangeName ?? null;
}

/**
 * Set the last worked-on change name
 *
 * @param changeName - The change name (e.g., "001-02_my-change")
 * @param projectRoot - The project root directory
 */
export function setLastChangeName(changeName: string, projectRoot: string = process.cwd()): void {
  const state = readState(projectRoot);
  state.lastChangeName = changeName;

  // Also extract and set the module ID from the change name
  const match = changeName.match(/^(\d{3})-/);
  if (match) {
    state.lastModuleId = match[1];
  }

  writeState(state, projectRoot);
}

/**
 * Clear all state (useful for testing)
 */
export function clearState(projectRoot: string = process.cwd()): void {
  const statePath = getStateFilePath(projectRoot);
  try {
    fs.unlinkSync(statePath);
  } catch {
    // Ignore if file doesn't exist
  }
}
