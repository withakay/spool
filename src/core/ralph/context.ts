import { readFile } from 'fs/promises';
import * as path from 'path';
import { FileSystemUtils } from '../../utils/file-system.js';
import { getChangesPath } from '../../core/project-config.js';
import { resolveChangeId, resolveModuleId, getModuleById } from '../../utils/item-discovery.js';

export interface RalphPromptPreambleOptions {
  iteration: number;
  maxIterations?: number;
  minIterations?: number;
  completionPromise: string;
  contextContent?: string | null;
  task: string;
}

export function buildPromptPreamble(options: RalphPromptPreambleOptions): string {
  const {
    iteration,
    maxIterations,
    minIterations = 1,
    completionPromise,
    contextContent,
    task,
  } = options;

  const hasFiniteMaxIterations =
    typeof maxIterations === 'number' && Number.isFinite(maxIterations) && maxIterations > 0;

  const normalizedContext = (contextContent ?? '').trim();
  const contextSection = normalizedContext
    ? `
## Additional Context (added by user mid-loop)

${normalizedContext}

---
`
    : '';

  return `
# Ralph Wiggum Loop - Iteration ${iteration}

You are in an iterative development loop. Work on the task below until you can genuinely complete it.
${contextSection}## Your Task

${task}

## Instructions

1. Read the current state of files to understand what's been done
2. **Update your todo list** - Use the TodoWrite tool to track progress and plan remaining work
3. Make progress on the task
4. Run tests/verification if applicable
5. When the task is GENUINELY COMPLETE, output:
   <promise>${completionPromise}</promise>

## Critical Rules

- ONLY output <promise>${completionPromise}</promise> when the task is truly done
- Do NOT lie or output false promises to exit the loop
- If stuck, try a different approach
- Check your work before claiming completion
- The loop will continue until you succeed
- **IMPORTANT**: Update your todo list at the start of each iteration to show progress

## AUTONOMY REQUIREMENTS (CRITICAL)

- **DO NOT ASK QUESTIONS** - This is an autonomous loop with no human interaction
- **DO NOT USE THE QUESTION TOOL** - Work independently without prompting for input
- Make reasonable assumptions when information is missing
- Use your best judgment to resolve ambiguities
- If multiple approaches exist, choose the most reasonable one and proceed
- The orchestrator cannot respond to questions - you must be self-sufficient
- Trust your training and make decisions autonomously

## Current Iteration: ${iteration}${hasFiniteMaxIterations ? ` / ${maxIterations}` : ' (unlimited)'} (min: ${minIterations})

Now, work on the task autonomously. Good luck!
`.trim();
}

export async function buildRalphPrompt(
  userPrompt: string,
  options: {
    changeId?: string;
    moduleId?: string;
    iteration?: number;
    maxIterations?: number;
    minIterations?: number;
    completionPromise?: string;
    contextContent?: string | null;
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

  const task = sections.join('\n\n---\n\n');

  if (typeof options.iteration === 'number') {
    return buildPromptPreamble({
      iteration: options.iteration,
      maxIterations: options.maxIterations,
      minIterations: options.minIterations,
      completionPromise: options.completionPromise ?? 'COMPLETE',
      contextContent: options.contextContent,
      task,
    });
  }

  return task;
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
