import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { getSpoolDirName } from '../core/project-config.js';
import {
  parseTasksTrackingFile,
  type TaskBlocker,
  type TaskDiagnostic,
  type TasksTrackingModel,
  updateEnhancedTaskStatusInMarkdown,
} from '../core/tasks/task-tracking.js';
import { enhancedTasksTemplate, taskItemTemplate } from '../core/templates/tasks-template.js';
import { FileSystemUtils } from '../utils/file-system.js';

export class TasksCommand {
  private async getChangePath(changeId: string, projectPath: string): Promise<string> {
    const spoolDir = getSpoolDirName(projectPath);
    return path.join(projectPath, spoolDir, 'changes', changeId);
  }

  private async getTasksPath(changeId: string, projectPath: string): Promise<string> {
    const changePath = await this.getChangePath(changeId, projectPath);
    return path.join(changePath, 'tasks.md');
  }

  private async ensureChangeExists(changeId: string, projectPath: string): Promise<void> {
    const changePath = await this.getChangePath(changeId, projectPath);
    if (!(await FileSystemUtils.directoryExists(changePath))) {
      throw new Error(`Change "${changeId}" not found`);
    }
  }

  async init(changeId: string, projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (await FileSystemUtils.fileExists(tasksPath)) {
      throw new Error(`tasks.md already exists for "${changeId}". Use "tasks add" to add tasks.`);
    }

    const context = {
      changeId,
      currentDate: new Date().toISOString().split('T')[0],
    };

    const content = enhancedTasksTemplate(context);
    await FileSystemUtils.writeFile(tasksPath, content);

    ora().succeed(chalk.green(`Enhanced tasks.md created for "${changeId}"`));
  }

  async status(changeId: string, projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (!(await FileSystemUtils.fileExists(tasksPath))) {
      console.log(
        chalk.yellow(
          `No tasks.md found for "${changeId}". Run "spool tasks init ${changeId}" first.`
        )
      );
      return;
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const model = parseTasksTrackingFile(content);

    printTasksStatus(changeId, model);
  }

  async add(
    changeId: string,
    taskName: string,
    wave: number = 1,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (!(await FileSystemUtils.fileExists(tasksPath))) {
      throw new Error(
        `No tasks.md found for "${changeId}". Run "spool tasks init ${changeId}" first.`
      );
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const model = parseTasksTrackingFile(content);

    if (model.format !== 'enhanced') {
      throw new Error(
        'Cannot add tasks to checkbox-only tracking file. Use enhanced tasks.md format.'
      );
    }
    assertNoTaskErrors(model.diagnostics);

    const newTaskId = getNextTaskIdForWave(model, wave);
    const newContent = addTaskToEnhancedTasksMarkdown(content, wave, newTaskId, taskName);
    await FileSystemUtils.writeFile(tasksPath, newContent);

    ora().succeed(chalk.green(`Task ${newTaskId} "${taskName}" added to Wave ${wave}`));
  }

  async complete(changeId: string, taskId: string, projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (!(await FileSystemUtils.fileExists(tasksPath))) {
      throw new Error(`No tasks.md found for "${changeId}"`);
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const model = parseTasksTrackingFile(content);

    if (model.format === 'enhanced') {
      assertNoTaskErrors(model.diagnostics);
      const updated = updateEnhancedTaskStatusInMarkdown(content, taskId, 'complete');
      await FileSystemUtils.writeFile(tasksPath, updated);
      ora().succeed(chalk.green(`Task "${taskId}" marked as complete`));
      return;
    }

    // Checkbox-only compatibility mode: taskId is 1-based index
    const idx = Number.parseInt(taskId, 10);
    if (!Number.isFinite(idx) || idx < 1) {
      throw new Error('Checkbox-only tasks.md: task id must be a 1-based number');
    }
    const updated = updateCheckboxTaskInMarkdown(content, idx, true);
    await FileSystemUtils.writeFile(tasksPath, updated);
    ora().succeed(chalk.green(`Task "${taskId}" marked as complete`));
  }

  async start(changeId: string, taskId: string, projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (!(await FileSystemUtils.fileExists(tasksPath))) {
      throw new Error(`No tasks.md found for "${changeId}"`);
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const model = parseTasksTrackingFile(content);

    if (model.format !== 'enhanced') {
      throw new Error(
        'Checkbox-only tasks.md does not support in-progress. Use "spool tasks complete" when done.'
      );
    }

    assertNoTaskErrors(model.diagnostics);
    const readiness = model.readiness;
    if (!readiness) {
      throw new Error('Task readiness not available');
    }

    const tasks = model.tasks as any[];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }
    if (task.status !== 'pending') {
      throw new Error(`Task "${taskId}" is not pending (current: ${task.status})`);
    }

    const isReady = readiness.readyTaskIds.includes(taskId);
    if (!isReady) {
      const blockers = readiness.blocked[taskId] ?? [];
      throw new Error(formatBlockers(blockers));
    }

    const updated = updateEnhancedTaskStatusInMarkdown(content, taskId, 'in_progress');
    await FileSystemUtils.writeFile(tasksPath, updated);
    ora().succeed(chalk.green(`Task "${taskId}" marked as in-progress`));
  }

  async next(changeId: string, projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (!(await FileSystemUtils.fileExists(tasksPath))) {
      throw new Error(`No tasks.md found for "${changeId}"`);
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const model = parseTasksTrackingFile(content);

    if (model.format === 'checkbox') {
      const tasks = model.tasks as any[];
      const nextIndex = tasks.findIndex((t) => !t.done);
      if (nextIndex < 0) {
        console.log(chalk.green('All tasks complete!'));
        return;
      }
      const task = tasks[nextIndex];
      console.log(chalk.white.bold('Next Task (compat)'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.white(`Task ${nextIndex + 1}`)}: ${task.description}`);
      console.log(chalk.gray(`Run "spool tasks complete ${changeId} ${nextIndex + 1}" when done`));
      return;
    }

    assertNoTaskErrors(model.diagnostics);
    const readiness = model.readiness;
    if (!readiness) throw new Error('Task readiness not available');

    const readyId = readiness.readyTaskIds[0];
    const tasks = model.tasks as any[];
    if (!readyId) {
      const progress = model.progress;
      if (progress.remaining === 0) {
        console.log(chalk.green('All tasks complete!'));
        return;
      }

      console.log(chalk.yellow('No ready tasks.'));
      const blockedEntries = Object.entries(readiness.blocked);
      if (blockedEntries.length > 0) {
        const [firstTaskId, blockers] = blockedEntries.sort(([a], [b]) => a.localeCompare(b))[0];
        const t = tasks.find((x) => x.id === firstTaskId);
        console.log(chalk.gray('First blocked task:'), `${firstTaskId}${t ? ` - ${t.name}` : ''}`);
        console.log(chalk.gray(formatBlockers(blockers)));
      }
      return;
    }

    const task = tasks.find((t) => t.id === readyId);
    if (!task) throw new Error('Ready task not found');

    console.log(chalk.white.bold('Next Task'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.white(`Task ${task.id}`)}: ${task.name}`);
    console.log();
    if (task.files?.length) console.log(chalk.gray('Files:'), task.files.join(', '));
    if (task.action) {
      console.log(chalk.gray('Action:'));
      console.log(`  ${task.action}`);
    }
    if (task.verify) console.log(chalk.gray('Verify:'), task.verify);
    if (task.doneWhen) console.log(chalk.gray('Done When:'), task.doneWhen);
    console.log();
    console.log(chalk.gray(`Run "spool tasks start ${changeId} ${task.id}" to begin`));
  }

  async show(changeId: string, projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (!(await FileSystemUtils.fileExists(tasksPath))) {
      throw new Error(`No tasks.md found for "${changeId}"`);
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    console.log(content);
  }
}

function assertNoTaskErrors(diagnostics: TaskDiagnostic[]): void {
  const errors = diagnostics.filter((d) => d.level === 'error');
  if (errors.length === 0) return;

  const first = errors[0];
  const prefix = first.taskId ? `${first.taskId}: ` : '';
  throw new Error(`${prefix}${first.message}`);
}

function formatBlockers(blockers: TaskBlocker[]): string {
  if (!blockers || blockers.length === 0) return 'Task is blocked.';
  const messages = blockers.map((b) => b.message);
  return `Task is blocked:\n- ${messages.join('\n- ')}`;
}

function updateCheckboxTaskInMarkdown(
  content: string,
  oneBasedIndex: number,
  done: boolean
): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let seen = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*[-*]\s+)\[([ xX])\](\s+.+)$/);
    if (!m) continue;
    seen++;
    if (seen !== oneBasedIndex) continue;
    const mark = done ? 'x' : ' ';
    lines[i] = `${m[1]}[${mark}]${m[3]}`;
    return lines.join('\n');
  }
  throw new Error(`Checkbox task "${oneBasedIndex}" not found`);
}

function printTasksStatus(changeId: string, model: TasksTrackingModel): void {
  console.log(chalk.white.bold(`Tasks for: ${changeId}`));
  console.log(chalk.gray('─'.repeat(50)));

  if (model.diagnostics.length > 0) {
    const errors = model.diagnostics.filter((d) => d.level === 'error');
    const warnings = model.diagnostics.filter((d) => d.level === 'warning');
    if (errors.length > 0) {
      console.log();
      console.log(chalk.red('Errors'));
      for (const e of errors) {
        const prefix = e.taskId ? `${e.taskId}: ` : '';
        console.log(`- ${prefix}${e.message}`);
      }
    }
    if (warnings.length > 0) {
      console.log();
      console.log(chalk.yellow('Warnings'));
      for (const w of warnings) {
        const prefix = w.taskId ? `${w.taskId}: ` : '';
        console.log(`- ${prefix}${w.message}`);
      }
    }
  }

  console.log();
  const p = model.progress;
  if (model.format === 'enhanced') {
    console.log(
      `Progress: ${chalk.white(`${p.complete}/${p.total}`)} complete, ` +
        `${chalk.white(`${p.in_progress}`)} in-progress, ${chalk.white(`${p.pending}`)} pending`
    );
  } else {
    console.log(`Progress (compat): ${chalk.white(`${p.complete}/${p.total}`)} complete`);
  }

  // When there are parse/validation errors, avoid claiming readiness.
  const errors = model.diagnostics.filter((d) => d.level === 'error');
  if (errors.length > 0) {
    console.log();
    console.log(chalk.gray('Readiness unavailable until errors are fixed.'));
    return;
  }

  if (model.format !== 'enhanced' || !model.readiness) return;

  const ready = model.readiness.readyTaskIds;
  const blocked = model.readiness.blocked;
  const tasks = model.tasks as any[];

  console.log();
  console.log(chalk.white('Ready'));
  if (ready.length === 0) {
    console.log(chalk.gray('  (none)'));
  } else {
    for (const id of ready) {
      const t = tasks.find((x) => x.id === id);
      console.log(`  - ${id}${t ? `: ${t.name}` : ''}`);
    }
  }

  const blockedEntries = Object.entries(blocked);
  console.log();
  console.log(chalk.white('Blocked'));
  if (blockedEntries.length === 0) {
    console.log(chalk.gray('  (none)'));
  } else {
    for (const [id, blockers] of blockedEntries.sort(([a], [b]) => a.localeCompare(b))) {
      const t = tasks.find((x) => x.id === id);
      console.log(`  - ${id}${t ? `: ${t.name}` : ''}`);
      for (const b of blockers) {
        console.log(chalk.gray(`    - ${b.message}`));
      }
    }
  }
}

function getNextTaskIdForWave(model: TasksTrackingModel, wave: number): string {
  const tasks = model.tasks as any[];
  let max = 0;
  for (const t of tasks) {
    if (t.wave !== wave) continue;
    const m = String(t.id).match(new RegExp(`^${wave}\\.(\\d+)$`));
    if (!m) continue;
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `${wave}.${max + 1}`;
}

function addTaskToEnhancedTasksMarkdown(
  content: string,
  wave: number,
  taskId: string,
  taskName: string
): string {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  const waveHeader = `## Wave ${wave}`;
  const waveHeaderIndex = lines.findIndex((l) => l.trim() === waveHeader);

  const newTaskBlock = taskItemTemplate(taskId, taskName).trimEnd();

  if (waveHeaderIndex >= 0) {
    // Insert before the next "---" divider after this wave, or before next section.
    let insertAt = lines.length;
    for (let i = waveHeaderIndex + 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        insertAt = i;
        break;
      }
      if (/^##\s+/.test(lines[i])) {
        insertAt = i;
        break;
      }
    }

    const blockLines = ['', ...newTaskBlock.split('\n'), ''];
    lines.splice(insertAt, 0, ...blockLines);
    return lines.join('\n');
  }

  // Wave section doesn't exist; insert before Checkpoints section if present.
  const checkpointsIndex = lines.findIndex((l) => l.trim() === '## Checkpoints');
  const insertAt = checkpointsIndex >= 0 ? checkpointsIndex : lines.length;
  const sectionLines = ['', '---', '', waveHeader, '', ...newTaskBlock.split('\n'), '', '---', ''];
  lines.splice(insertAt, 0, ...sectionLines);
  return lines.join('\n');
}
