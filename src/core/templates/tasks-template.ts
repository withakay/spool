export interface TasksContext {
  changeId?: string;
  currentDate?: string;
}

export const enhancedTasksTemplate = (context: TasksContext = {}) => `# Tasks for: ${context.changeId || '[change-id]'}

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential (or parallel if tool supports)
- **Created**: ${context.currentDate || new Date().toISOString().split('T')[0]}

---

## Wave 1

### Task 1.1: [Task Name]
- **Files**: \`path/to/file.ts\`
- **Dependencies**: None
- **Action**:
  [Describe what needs to be done]
- **Verify**: \`[command to verify, e.g., npm test]\`
- **Done When**: [Success criteria]
- **Status**: [ ] pending

---

## Checkpoints

### Checkpoint: Review Implementation
- **Type**: checkpoint (requires human approval)
- **Dependencies**: All Wave 1 tasks
- **Action**: Review the implementation before proceeding
- **Done When**: User confirms implementation is correct
- **Status**: [ ] pending
`;

export const taskItemTemplate = (taskNumber: string, taskName: string) => `
### Task ${taskNumber}: ${taskName}
- **Files**: \`[target files]\`
- **Dependencies**: [None or Task X.X]
- **Action**:
  [Describe what needs to be done]
- **Verify**: \`[verification command]\`
- **Done When**: [Success criteria]
- **Status**: [ ] pending
`;

export interface ParsedTask {
  id: string;
  name: string;
  wave: number;
  files: string[];
  dependencies: string[];
  action: string;
  verify: string;
  doneWhen: string;
  status: 'pending' | 'in-progress' | 'complete';
  type?: 'auto' | 'checkpoint' | 'decision' | 'research';
}

export interface ParsedTasksFile {
  changeId: string;
  mode: string;
  created: string;
  waves: Map<number, ParsedTask[]>;
  checkpoints: ParsedTask[];
}

/**
 * Parse an enhanced tasks.md file into structured data
 */
export function parseTasksFile(content: string): ParsedTasksFile {
  const result: ParsedTasksFile = {
    changeId: '',
    mode: 'Sequential',
    created: '',
    waves: new Map(),
    checkpoints: [],
  };

  // Parse header
  const changeIdMatch = content.match(/# Tasks for: (.+)/);
  if (changeIdMatch) {
    result.changeId = changeIdMatch[1].trim();
  }

  const modeMatch = content.match(/\*\*Mode\*\*: (.+)/);
  if (modeMatch) {
    result.mode = modeMatch[1].trim();
  }

  const createdMatch = content.match(/\*\*Created\*\*: (.+)/);
  if (createdMatch) {
    result.created = createdMatch[1].trim();
  }

  // Split into sections
  const sections = content.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.split('\n');
    const header = lines[0].trim();

    // Parse Wave sections
    const waveMatch = header.match(/Wave (\d+)/);
    if (waveMatch) {
      const waveNum = parseInt(waveMatch[1]);
      const tasks = parseTasksFromSection(section, waveNum);
      result.waves.set(waveNum, tasks);
      continue;
    }

    // Parse Checkpoints section
    if (header.includes('Checkpoint')) {
      const tasks = parseTasksFromSection(section, -1);
      result.checkpoints = tasks.map(t => ({ ...t, type: 'checkpoint' as const }));
    }
  }

  return result;
}

function parseTasksFromSection(section: string, wave: number): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const taskBlocks = section.split(/^### /m).slice(1);

  for (const block of taskBlocks) {
    const task = parseTaskBlock(block, wave);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

function parseTaskBlock(block: string, wave: number): ParsedTask | null {
  const lines = block.split('\n');
  const headerLine = lines[0];

  // Parse task header: "Task 1.1: Name" or "Checkpoint: Name"
  const taskMatch = headerLine.match(/(?:Task )?(\d+\.\d+|Checkpoint): (.+)/);
  if (!taskMatch) return null;

  const id = taskMatch[1];
  const name = taskMatch[2].trim();

  const task: ParsedTask = {
    id,
    name,
    wave,
    files: [],
    dependencies: [],
    action: '',
    verify: '',
    doneWhen: '',
    status: 'pending',
  };

  // Parse fields
  const content = lines.slice(1).join('\n');

  const filesMatch = content.match(/\*\*Files\*\*: `([^`]+)`/);
  if (filesMatch) {
    task.files = filesMatch[1].split(',').map(f => f.trim());
  }

  const depsMatch = content.match(/\*\*Dependencies\*\*: (.+)/);
  if (depsMatch) {
    const deps = depsMatch[1].trim();
    if (deps.toLowerCase() !== 'none') {
      task.dependencies = deps.split(',').map(d => d.trim());
    }
  }

  const actionMatch = content.match(/\*\*Action\*\*:\s*\n?([\s\S]*?)(?=\n- \*\*|$)/);
  if (actionMatch) {
    task.action = actionMatch[1].trim();
  }

  const verifyMatch = content.match(/\*\*Verify\*\*: `([^`]+)`/);
  if (verifyMatch) {
    task.verify = verifyMatch[1];
  }

  const doneMatch = content.match(/\*\*Done When\*\*: (.+)/);
  if (doneMatch) {
    task.doneWhen = doneMatch[1].trim();
  }

  const statusMatch = content.match(/\*\*Status\*\*: \[([x ])\]/i);
  if (statusMatch) {
    task.status = statusMatch[1].toLowerCase() === 'x' ? 'complete' : 'pending';
  }

  const typeMatch = content.match(/\*\*Type\*\*: (\w+)/);
  if (typeMatch) {
    task.type = typeMatch[1] as any;
  }

  return task;
}

/**
 * Serialize parsed tasks back to markdown
 */
export function serializeTasksFile(parsed: ParsedTasksFile): string {
  const lines: string[] = [];

  lines.push(`# Tasks for: ${parsed.changeId}`);
  lines.push('');
  lines.push('## Execution Notes');
  lines.push('- **Tool**: Any (OpenCode, Codex, Claude Code)');
  lines.push(`- **Mode**: ${parsed.mode}`);
  lines.push(`- **Created**: ${parsed.created}`);
  lines.push('');
  lines.push('---');

  // Waves
  const sortedWaves = Array.from(parsed.waves.keys()).sort((a, b) => a - b);
  for (const waveNum of sortedWaves) {
    const tasks = parsed.waves.get(waveNum) || [];
    lines.push('');
    lines.push(`## Wave ${waveNum}`);
    lines.push('');

    for (const task of tasks) {
      lines.push(serializeTask(task));
    }

    lines.push('---');
  }

  // Checkpoints
  if (parsed.checkpoints.length > 0) {
    lines.push('');
    lines.push('## Checkpoints');
    lines.push('');

    for (const task of parsed.checkpoints) {
      lines.push(serializeTask(task));
    }
  }

  return lines.join('\n');
}

function serializeTask(task: ParsedTask): string {
  const lines: string[] = [];
  const statusMark = task.status === 'complete' ? 'x' : ' ';

  lines.push(`### Task ${task.id}: ${task.name}`);
  if (task.type) {
    lines.push(`- **Type**: ${task.type}`);
  }
  lines.push(`- **Files**: \`${task.files.join(', ')}\``);
  lines.push(`- **Dependencies**: ${task.dependencies.length ? task.dependencies.join(', ') : 'None'}`);
  lines.push(`- **Action**:`);
  lines.push(`  ${task.action}`);
  lines.push(`- **Verify**: \`${task.verify}\``);
  lines.push(`- **Done When**: ${task.doneWhen}`);
  lines.push(`- **Status**: [${statusMark}] ${task.status}`);
  lines.push('');

  return lines.join('\n');
}
