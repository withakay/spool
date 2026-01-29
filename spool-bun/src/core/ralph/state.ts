import { promises as fs } from 'fs';
import * as path from 'path';
import { FileSystemUtils } from '../../utils/file-system.js';
import { RalphState } from './types.js';

const RALPH_STATE_DIR = '.spool/.state/ralph';
const RALPH_STATE_FILE = 'state.json';
const RALPH_CONTEXT_FILE = 'context.md';

export async function getRalphStateDir(changeId: string): Promise<string> {
  return path.join(RALPH_STATE_DIR, changeId);
}

export async function getRalphStatePath(changeId: string): Promise<string> {
  const stateDir = await getRalphStateDir(changeId);
  return path.join(stateDir, RALPH_STATE_FILE);
}

export async function getRalphContextPath(changeId: string): Promise<string> {
  const stateDir = await getRalphStateDir(changeId);
  return path.join(stateDir, RALPH_CONTEXT_FILE);
}

export async function loadRalphState(changeId: string): Promise<RalphState | null> {
  const statePath = await getRalphStatePath(changeId);

  try {
    await fs.access(statePath);
  } catch {
    return null;
  }

  try {
    const content = await fs.readFile(statePath, 'utf-8');
    return JSON.parse(content) as RalphState;
  } catch (error) {
    console.warn(`Failed to load Ralph state for ${changeId}:`, error);
    return null;
  }
}

export async function saveRalphState(state: RalphState): Promise<void> {
  const statePath = await getRalphStatePath(state.changeId);
  const stateDir = await getRalphStateDir(state.changeId);

  await FileSystemUtils.createDirectory(stateDir);
  await FileSystemUtils.writeFile(statePath, JSON.stringify(state, null, 2));
}

export async function initializeRalphState(
  changeId: string,
  contextContent?: string
): Promise<RalphState> {
  const state: RalphState = {
    changeId,
    iteration: 0,
    history: [],
    contextFile: await getRalphContextPath(changeId),
  };

  if (contextContent) {
    const contextPath = await getRalphContextPath(changeId);
    const stateDir = await getRalphStateDir(changeId);
    await FileSystemUtils.createDirectory(stateDir);
    await FileSystemUtils.writeFile(contextPath, contextContent);
  }

  await saveRalphState(state);
  return state;
}

export async function loadRalphContext(changeId: string): Promise<string> {
  const contextPath = await getRalphContextPath(changeId);

  try {
    await fs.access(contextPath);
  } catch {
    return '';
  }

  try {
    return await fs.readFile(contextPath, 'utf-8');
  } catch (error) {
    console.warn(`Failed to load Ralph context for ${changeId}:`, error);
    return '';
  }
}

export async function appendToRalphContext(changeId: string, text: string): Promise<void> {
  const contextPath = await getRalphContextPath(changeId);
  const stateDir = await getRalphStateDir(changeId);
  await FileSystemUtils.createDirectory(stateDir);

  let existingContent = await loadRalphContext(changeId);
  if (existingContent && !existingContent.endsWith('\n')) {
    existingContent += '\n';
  }

  const newContent = existingContent + text;
  await FileSystemUtils.writeFile(contextPath, newContent);
}

export async function clearRalphContext(changeId: string): Promise<void> {
  const contextPath = await getRalphContextPath(changeId);

  try {
    await fs.access(contextPath);
  } catch {
    return;
  }

  await fs.writeFile(contextPath, '', 'utf-8');
}
