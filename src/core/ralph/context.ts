import { readFile } from 'fs/promises';
import * as path from 'path';
import { FileSystemUtils } from '../../utils/file-system.js';
import { getChangesPath } from '../../core/project-config.js';
import { resolveChangeId, resolveModuleId, getModuleById } from '../../utils/item-discovery.js';

export async function buildRalphPrompt(
  userPrompt: string,
  options: {
    changeId?: string;
    moduleId?: string;
  }
): Promise<string> {
  const sections: string[] = [];

  if (options.changeId) {
    const changeContext = await loadChangeContext(options.changeId);
    if (changeContext) {
      sections.push(changeContext);
    }
  }

  if (options.moduleId) {
    const moduleContext = await loadModuleContext(options.moduleId);
    if (moduleContext) {
      sections.push(moduleContext);
    }
  }

  sections.push(userPrompt);

  return sections.join('\n\n---\n\n');
}

async function loadChangeContext(changeId: string): Promise<string | null> {
  const changesPath = await getChangesPath();
  const resolvedChangeId = await resolveChangeId(changeId);

  if (!resolvedChangeId) {
    return null;
  }

  const proposalPath = path.join(changesPath, resolvedChangeId, 'proposal.md');

  if (!(await FileSystemUtils.fileExists(proposalPath))) {
    return null;
  }

  try {
    const proposal = await readFile(proposalPath, 'utf-8');
    return `## Change Proposal (${resolvedChangeId})\n\n${proposal}`;
  } catch {
    return null;
  }
}

async function loadModuleContext(moduleId: string): Promise<string | null> {
  const resolvedModuleId = await resolveModuleId(moduleId);

  if (!resolvedModuleId) {
    return null;
  }

  const moduleInfo = await getModuleById(resolvedModuleId);

  if (!moduleInfo) {
    return null;
  }

  const modulePath = path.join(moduleInfo.path, 'module.md');

  if (!(await FileSystemUtils.fileExists(modulePath))) {
    return null;
  }

  try {
    const moduleContent = await readFile(modulePath, 'utf-8');
    return `## Module (${resolvedModuleId})\n\n${moduleContent}`;
  } catch {
    return null;
  }
}
