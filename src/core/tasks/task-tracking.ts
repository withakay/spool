export type TaskStatus = 'pending' | 'in_progress' | 'complete';

export type TasksTrackingFormat = 'enhanced' | 'checkbox';

export interface TaskProgress {
  total: number;
  complete: number;
  in_progress: number;
  pending: number;
  remaining: number;
}

export interface TaskDiagnostic {
  level: 'error' | 'warning';
  message: string;
  taskId?: string;
}

export type TaskBlockerKind = 'missing_dep' | 'dep_incomplete' | 'wave_gate' | 'cycle';

export interface TaskBlocker {
  kind: TaskBlockerKind;
  message: string;
  dependencyId?: string;
  blockedByWave?: number;
}

export interface EnhancedTask {
  id: string;
  name: string;
  wave: number | null;
  status: TaskStatus;
  dependencies: string[];
  files: string[];
  action: string;
  verify?: string;
  doneWhen?: string;
  type?: string;

  // Location info for diff-friendly edits
  headerLineIndex: number;
  statusLineIndex: number | null;
}

export interface CheckboxTask {
  description: string;
  done: boolean;
}

export interface TasksTrackingModel {
  format: TasksTrackingFormat;
  tasks: EnhancedTask[] | CheckboxTask[];
  progress: TaskProgress;
  diagnostics: TaskDiagnostic[];
  readiness?: {
    readyTaskIds: string[];
    blocked: Record<string, TaskBlocker[]>;
  };
}

function normalizeNewlines(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

export function detectTasksTrackingFormat(content: string): TasksTrackingFormat {
  const normalized = normalizeNewlines(content);
  // Enhanced tasks are identified by Task headers + Status fields.
  // Note: waves are optional in practice (users may omit or mis-format wave headings).
  if (
    /^###\s+(?:Task\s+)?[^:]+\s*:\s*.+$/m.test(normalized) &&
    /^-\s+\*\*Status\*\*:/m.test(normalized)
  ) {
    return 'enhanced';
  }

  // Checkbox-only tracking: plain markdown checkboxes.
  if (/^\s*[-*]\s+\[[ xX]\]\s+/m.test(normalized)) {
    return 'checkbox';
  }

  // Default to checkbox for backward compatibility (it is strictly less semantic).
  return 'checkbox';
}

function parseStatusLine(line: string): TaskStatus {
  // Strict parse to avoid template placeholder lines like:
  // - **Status**: [ ] pending / [ ] in-progress / [x] complete
  // Canonical lines should end with a single status token.
  const m = line.match(/\*\*Status\*\*:\s*\[([ xX])\]\s*(pending|in[-\s_]?progress|complete)\s*$/i);
  if (!m) return 'pending';

  const checked = m[1].toLowerCase() === 'x';
  const statusText = m[2].trim().toLowerCase();

  if (checked || statusText === 'complete') return 'complete';
  if (/in[-\s_]?progress/.test(statusText)) return 'in_progress';
  return 'pending';
}

function canonicalizeDependencyToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return '';
  return trimmed.replace(/^Task\s+/i, '').trim();
}

function parseDependenciesLine(line: string): string[] {
  const m = line.match(/\*\*Dependencies\*\*:\s*(.+?)\s*$/);
  if (!m) return [];
  const raw = m[1].trim();
  if (!raw || raw.toLowerCase() === 'none') return [];
  // Ignore non-id dependencies that are essentially wave-gate prose.
  if (/^all\s+wave\s+\d+\s+tasks$/i.test(raw) || /^all\s+previous\s+waves$/i.test(raw)) {
    return [];
  }
  return raw
    .split(',')
    .map((t) => canonicalizeDependencyToken(t))
    .filter(Boolean);
}

function parseVerifyLine(line: string): string | undefined {
  const m = line.match(/\*\*Verify\*\*:\s*`([^`]+)`\s*$/);
  return m ? m[1] : undefined;
}

function parseFilesLine(line: string): string[] {
  const m = line.match(/\*\*Files\*\*:\s*`([^`]+)`\s*$/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
}

function parseDoneWhenLine(line: string): string | undefined {
  const m = line.match(/\*\*Done When\*\*:\s*(.+?)\s*$/);
  return m ? m[1].trim() : undefined;
}

function parseTypeLine(line: string): string | undefined {
  const m = line.match(/\*\*Type\*\*:\s*(.+?)\s*$/);
  return m ? m[1].trim() : undefined;
}

function computeEnhancedProgress(tasks: EnhancedTask[]): TaskProgress {
  const progress: TaskProgress = {
    total: tasks.length,
    complete: 0,
    in_progress: 0,
    pending: 0,
    remaining: 0,
  };

  for (const t of tasks) {
    if (t.status === 'complete') progress.complete++;
    else if (t.status === 'in_progress') progress.in_progress++;
    else progress.pending++;
  }
  progress.remaining = progress.total - progress.complete;
  return progress;
}

function computeCheckboxProgress(tasks: CheckboxTask[]): TaskProgress {
  const total = tasks.length;
  const complete = tasks.filter((t) => t.done).length;
  const pending = total - complete;
  return { total, complete, pending, in_progress: 0, remaining: pending };
}

function findCycleNodes(adj: Map<string, string[]>): Set<string> {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const inCycle = new Set<string>();

  const dfs = (node: string, stack: string[]): void => {
    if (visiting.has(node)) {
      const idx = stack.indexOf(node);
      if (idx >= 0) {
        for (const n of stack.slice(idx)) inCycle.add(n);
      }
      return;
    }
    if (visited.has(node)) return;

    visiting.add(node);
    stack.push(node);
    for (const next of adj.get(node) ?? []) {
      dfs(next, stack);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };

  for (const node of adj.keys()) {
    dfs(node, []);
  }

  return inCycle;
}

function computeEnhancedReadiness(
  tasks: EnhancedTask[],
  diagnostics: TaskDiagnostic[]
): {
  readyTaskIds: string[];
  blocked: Record<string, TaskBlocker[]>;
} {
  const byId = new Map<string, EnhancedTask>();
  for (const t of tasks) {
    if (byId.has(t.id)) {
      diagnostics.push({ level: 'error', taskId: t.id, message: `Duplicate task id: ${t.id}` });
    }
    byId.set(t.id, t);
  }

  // Validate missing deps + build adjacency
  const adj = new Map<string, string[]>();
  for (const t of tasks) {
    const deps: string[] = [];
    for (const dep of t.dependencies) {
      const depTask = byId.get(dep);
      if (!depTask) {
        diagnostics.push({
          level: 'error',
          taskId: t.id,
          message: `Missing dependency '${dep}' referenced by task '${t.id}'`,
        });
        continue;
      }
      deps.push(dep);
    }
    adj.set(t.id, deps);
  }

  const cycleNodes = findCycleNodes(adj);
  if (cycleNodes.size > 0) {
    diagnostics.push({
      level: 'error',
      message: `Dependency cycle detected involving: ${Array.from(cycleNodes).sort().join(', ')}`,
    });
  }

  // Wave gating
  const waveNums = Array.from(
    new Set(tasks.map((t) => t.wave).filter((w): w is number => typeof w === 'number'))
  ).sort((a, b) => a - b);
  let firstIncompleteWave: number | null = null;
  for (const w of waveNums) {
    const inWave = tasks.filter((t) => t.wave === w);
    if (inWave.some((t) => t.status !== 'complete')) {
      firstIncompleteWave = w;
      break;
    }
  }

  const readyTaskIds: string[] = [];
  const blocked: Record<string, TaskBlocker[]> = {};

  for (const t of tasks) {
    if (t.status !== 'pending') continue;

    const blockers: TaskBlocker[] = [];

    if (cycleNodes.has(t.id)) {
      blockers.push({ kind: 'cycle', message: 'Task is part of a dependency cycle' });
    }

    if (
      typeof t.wave === 'number' &&
      firstIncompleteWave !== null &&
      t.wave > firstIncompleteWave
    ) {
      blockers.push({
        kind: 'wave_gate',
        blockedByWave: firstIncompleteWave,
        message: `Blocked until Wave ${firstIncompleteWave} is complete`,
      });
    }

    // Checkpoints (wave=null) are blocked until all numeric waves are complete.
    if (t.wave === null && firstIncompleteWave !== null) {
      blockers.push({
        kind: 'wave_gate',
        blockedByWave: firstIncompleteWave,
        message: `Blocked until Wave ${firstIncompleteWave} is complete`,
      });
    }

    for (const dep of t.dependencies) {
      const depTask = byId.get(dep);
      if (!depTask) {
        blockers.push({
          kind: 'missing_dep',
          dependencyId: dep,
          message: `Missing dependency: ${dep}`,
        });
        continue;
      }
      if (depTask.status !== 'complete') {
        blockers.push({
          kind: 'dep_incomplete',
          dependencyId: dep,
          message: `Dependency not complete: ${dep}`,
        });
      }
    }

    if (blockers.length === 0) readyTaskIds.push(t.id);
    else blocked[t.id] = blockers;
  }

  // Stable, deterministic ordering: wave then header line.
  readyTaskIds.sort((a, b) => {
    const ta = byId.get(a);
    const tb = byId.get(b);
    const wa = ta?.wave ?? Number.MAX_SAFE_INTEGER;
    const wb = tb?.wave ?? Number.MAX_SAFE_INTEGER;
    if (wa !== wb) return wa - wb;
    return (ta?.headerLineIndex ?? 0) - (tb?.headerLineIndex ?? 0);
  });

  return { readyTaskIds, blocked };
}

export function parseTasksTrackingFile(content: string): TasksTrackingModel {
  const normalized = normalizeNewlines(content);
  const format = detectTasksTrackingFormat(normalized);
  const diagnostics: TaskDiagnostic[] = [];

  if (format === 'checkbox') {
    const tasks: CheckboxTask[] = [];
    for (const line of normalized.split('\n')) {
      const m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/);
      if (!m) continue;
      tasks.push({ done: m[1].toLowerCase() === 'x', description: m[2].trim() });
    }
    return {
      format,
      tasks,
      progress: computeCheckboxProgress(tasks),
      diagnostics,
    };
  }

  const tasks: EnhancedTask[] = [];
  const lines = normalized.split('\n');
  let currentWave: number | null = null;
  let checkpointCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+Wave\b/i.test(line) && !/^##\s+Wave\s+\d+/i.test(line)) {
      diagnostics.push({
        level: 'error',
        message: `Invalid wave header (expected "## Wave <number>"): ${line.trim()}`,
      });
    }
    const waveMatch = line.match(/^##\s+Wave\s+(\d+)/i);
    if (waveMatch) {
      currentWave = Number.parseInt(waveMatch[1], 10);
      continue;
    }

    const taskHeaderMatch = line.match(/^###\s+(?:Task\s+)?([^:]+?)\s*:\s*(.+?)\s*$/);
    const checkpointHeaderMatch = line.match(/^###\s+Checkpoint\s*:\s*(.+?)\s*$/i);

    if (!taskHeaderMatch && !checkpointHeaderMatch) continue;

    const id = taskHeaderMatch
      ? taskHeaderMatch[1].trim()
      : (() => {
          checkpointCount++;
          return `checkpoint-${checkpointCount}`;
        })();
    const name = taskHeaderMatch ? taskHeaderMatch[2].trim() : checkpointHeaderMatch![1].trim();

    // Scan within this block for fields until next ###/## header
    let status: TaskStatus = 'pending';
    let statusLineIndex: number | null = null;
    const dependencies: string[] = [];
    const files: string[] = [];
    let action = '';
    let verify: string | undefined;
    let doneWhen: string | undefined;
    let type: string | undefined;

    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      if (/^###\s+/.test(l) || /^##\s+/.test(l)) break;

      if (/\*\*Files\*\*:/i.test(l)) {
        files.push(...parseFilesLine(l));
      } else if (/\*\*Dependencies\*\*:/i.test(l)) {
        dependencies.push(...parseDependenciesLine(l));
      } else if (/^\s*-\s+\*\*Action\*\*:\s*$/i.test(l)) {
        const actionLines: string[] = [];
        for (let k = j + 1; k < lines.length; k++) {
          const al = lines[k];
          if (/^###\s+/.test(al) || /^##\s+/.test(al)) {
            j = k - 1;
            break;
          }
          if (/^\s*-\s+\*\*\w[\w\s]*\*\*:/i.test(al)) {
            j = k - 1;
            break;
          }
          actionLines.push(al);
          j = k;
        }
        action = actionLines
          .join('\n')
          .replace(/^\s{2}/gm, '')
          .trim();
      } else if (/\*\*Status\*\*:/i.test(l)) {
        if (/\/.+\[\s*[xX ]\]\s*/.test(l) || (l.match(/\[[ xX]\]/g)?.length ?? 0) > 1) {
          diagnostics.push({
            level: 'warning',
            taskId: id,
            message:
              'Status line looks like a template placeholder; use a single status like "- **Status**: [ ] pending"',
          });
          status = 'pending';
        } else {
          status = parseStatusLine(l);
        }
        statusLineIndex = j;
      } else if (/\*\*Verify\*\*:/i.test(l)) {
        verify = parseVerifyLine(l);
      } else if (/\*\*Done When\*\*:/i.test(l)) {
        doneWhen = parseDoneWhenLine(l);
      } else if (/\*\*Type\*\*:/i.test(l)) {
        type = parseTypeLine(l);
      }
    }

    const wave = checkpointHeaderMatch ? null : currentWave;
    if (taskHeaderMatch && wave === null) {
      diagnostics.push({
        level: 'warning',
        taskId: id,
        message: `Task '${id}' appears outside any Wave section; wave gating may not behave as expected`,
      });
    }

    // Basic wave sanity: if id looks like "<wave>.<n>", it should match current wave.
    if (typeof wave === 'number') {
      const idWave = id.match(/^(\d+)\./);
      if (idWave && Number.parseInt(idWave[1], 10) !== wave) {
        diagnostics.push({
          level: 'warning',
          taskId: id,
          message: `Task id '${id}' does not match Wave ${wave}`,
        });
      }
    }

    tasks.push({
      id,
      name,
      wave,
      status,
      dependencies,
      files,
      action,
      verify,
      doneWhen,
      type,
      headerLineIndex: i,
      statusLineIndex,
    });
  }

  const model: TasksTrackingModel = {
    format,
    tasks,
    progress: computeEnhancedProgress(tasks),
    diagnostics,
  };
  model.readiness = computeEnhancedReadiness(tasks, diagnostics);
  return model;
}

function statusLineFor(status: TaskStatus): string {
  if (status === 'complete') return '- **Status**: [x] complete';
  if (status === 'in_progress') return '- **Status**: [ ] in-progress';
  return '- **Status**: [ ] pending';
}

export function updateEnhancedTaskStatusInMarkdown(
  content: string,
  taskId: string,
  newStatus: TaskStatus
): string {
  const normalized = normalizeNewlines(content);
  const lines = normalized.split('\n');
  let headerIndex = -1;

  const checkpointIdMatch = taskId.match(/^checkpoint-(\d+)$/i);
  if (checkpointIdMatch) {
    const ordinal = Number.parseInt(checkpointIdMatch[1], 10);
    if (!Number.isFinite(ordinal) || ordinal < 1) {
      throw new Error(`Invalid checkpoint id: ${taskId}`);
    }

    let seen = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^###\s+Checkpoint\s*:/i.test(lines[i])) {
        seen++;
        if (seen === ordinal) {
          headerIndex = i;
          break;
        }
      }
    }
  } else {
    const headerRe = new RegExp(`^###\\s+(?:Task\\s+)?${escapeRegExp(taskId)}\\s*:`);
    for (let i = 0; i < lines.length; i++) {
      if (headerRe.test(lines[i])) {
        headerIndex = i;
        break;
      }
    }
  }
  if (headerIndex < 0) {
    throw new Error(`Task "${taskId}" not found`);
  }

  let statusIndex: number | null = null;
  let insertAt = headerIndex + 1;
  for (let j = headerIndex + 1; j < lines.length; j++) {
    const l = lines[j];
    if (/^###\s+/.test(l) || /^##\s+/.test(l)) {
      insertAt = j;
      break;
    }
    insertAt = j + 1;
    if (/^\s*-\s+\*\*Status\*\*:/i.test(l)) {
      statusIndex = j;
      break;
    }
  }

  const newLine = statusLineFor(newStatus);
  if (statusIndex !== null) {
    lines[statusIndex] = newLine;
  } else {
    // Insert status at end of the block.
    lines.splice(insertAt, 0, newLine);
  }

  return lines.join('\n');
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
