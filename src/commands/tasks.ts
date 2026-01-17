import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { FileSystemUtils } from '../utils/file-system.js';
import { getProjectorDirName } from '../core/project-config.js';
import {
  enhancedTasksTemplate,
  taskItemTemplate,
  parseTasksFile,
  serializeTasksFile,
  ParsedTask,
  ParsedTasksFile,
} from '../core/templates/tasks-template.js';

export class TasksCommand {
  private async getChangePath(changeId: string, projectPath: string): Promise<string> {
    const projectorDir = getProjectorDirName(projectPath);
    return path.join(projectPath, projectorDir, 'changes', changeId);
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
      console.log(chalk.yellow(`No tasks.md found for "${changeId}". Run "projector tasks init ${changeId}" first.`));
      return;
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const parsed = parseTasksFile(content);

    console.log(chalk.white.bold(`Tasks for: ${parsed.changeId}`));
    console.log(chalk.gray('─'.repeat(50)));

    let totalTasks = 0;
    let completedTasks = 0;

    // Display waves
    const sortedWaves = Array.from(parsed.waves.keys()).sort((a, b) => a - b);
    for (const waveNum of sortedWaves) {
      const tasks = parsed.waves.get(waveNum) || [];
      console.log();
      console.log(chalk.white(`Wave ${waveNum}`));

      for (const task of tasks) {
        totalTasks++;
        if (task.status === 'complete') completedTasks++;

        const icon = task.status === 'complete'
          ? chalk.green('✓')
          : task.status === 'in-progress'
          ? chalk.yellow('●')
          : chalk.gray('○');

        const statusText = task.status === 'complete'
          ? chalk.green('complete')
          : task.status === 'in-progress'
          ? chalk.yellow('in-progress')
          : chalk.gray('pending');

        console.log(`  ${icon} ${chalk.white(`Task ${task.id}`)}: ${task.name} [${statusText}]`);
      }
    }

    // Display checkpoints
    if (parsed.checkpoints.length > 0) {
      console.log();
      console.log(chalk.white('Checkpoints'));
      for (const task of parsed.checkpoints) {
        totalTasks++;
        if (task.status === 'complete') completedTasks++;

        const icon = task.status === 'complete'
          ? chalk.green('✓')
          : chalk.gray('○');

        console.log(`  ${icon} ${chalk.white(task.name)} [${task.status}]`);
      }
    }

    // Summary
    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log(
      `Progress: ${chalk.white(`${completedTasks}/${totalTasks}`)} tasks complete ` +
      `(${Math.round((completedTasks / totalTasks) * 100)}%)`
    );
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
      throw new Error(`No tasks.md found for "${changeId}". Run "projector tasks init ${changeId}" first.`);
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const parsed = parseTasksFile(content);

    // Find next task number in wave
    const waveTasks = parsed.waves.get(wave) || [];
    const maxTaskNum = waveTasks.reduce((max, t) => {
      const match = t.id.match(/\d+\.(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);

    const newTaskId = `${wave}.${maxTaskNum + 1}`;
    const newTask: ParsedTask = {
      id: newTaskId,
      name: taskName,
      wave,
      files: ['[target files]'],
      dependencies: [],
      action: '[Describe what needs to be done]',
      verify: '[verification command]',
      doneWhen: '[Success criteria]',
      status: 'pending',
    };

    // Add to wave
    if (!parsed.waves.has(wave)) {
      parsed.waves.set(wave, []);
    }
    parsed.waves.get(wave)!.push(newTask);

    // Serialize and save
    const newContent = serializeTasksFile(parsed);
    await FileSystemUtils.writeFile(tasksPath, newContent);

    ora().succeed(chalk.green(`Task ${newTaskId} "${taskName}" added to Wave ${wave}`));
  }

  async complete(
    changeId: string,
    taskId: string,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (!(await FileSystemUtils.fileExists(tasksPath))) {
      throw new Error(`No tasks.md found for "${changeId}"`);
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const parsed = parseTasksFile(content);

    // Find and update task
    let found = false;
    for (const [, tasks] of parsed.waves) {
      for (const task of tasks) {
        if (task.id === taskId) {
          task.status = 'complete';
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      // Check checkpoints
      for (const task of parsed.checkpoints) {
        if (task.id === taskId || task.name.toLowerCase().includes(taskId.toLowerCase())) {
          task.status = 'complete';
          found = true;
          break;
        }
      }
    }

    if (!found) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const newContent = serializeTasksFile(parsed);
    await FileSystemUtils.writeFile(tasksPath, newContent);

    ora().succeed(chalk.green(`Task "${taskId}" marked as complete`));
  }

  async start(
    changeId: string,
    taskId: string,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    await this.ensureChangeExists(changeId, resolvedPath);

    const tasksPath = await this.getTasksPath(changeId, resolvedPath);

    if (!(await FileSystemUtils.fileExists(tasksPath))) {
      throw new Error(`No tasks.md found for "${changeId}"`);
    }

    const content = await FileSystemUtils.readFile(tasksPath);
    const parsed = parseTasksFile(content);

    // Find and update task
    let found = false;
    for (const [, tasks] of parsed.waves) {
      for (const task of tasks) {
        if (task.id === taskId) {
          task.status = 'in-progress';
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const newContent = serializeTasksFile(parsed);
    await FileSystemUtils.writeFile(tasksPath, newContent);

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
    const parsed = parseTasksFile(content);

    // Find next pending task in order
    const sortedWaves = Array.from(parsed.waves.keys()).sort((a, b) => a - b);

    for (const waveNum of sortedWaves) {
      const tasks = parsed.waves.get(waveNum) || [];

      // Check if all dependencies in previous waves are complete
      const prevWavesComplete = sortedWaves
        .filter(w => w < waveNum)
        .every(w => {
          const waveTasks = parsed.waves.get(w) || [];
          return waveTasks.every(t => t.status === 'complete');
        });

      if (!prevWavesComplete) {
        continue;
      }

      for (const task of tasks) {
        if (task.status === 'pending') {
          // Check dependencies
          const depsComplete = task.dependencies.every(dep => {
            for (const [, waveTasks] of parsed.waves) {
              const depTask = waveTasks.find(t => t.id === dep);
              if (depTask) return depTask.status === 'complete';
            }
            return true;
          });

          if (depsComplete) {
            console.log(chalk.white.bold('Next Task'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.white(`Task ${task.id}`)}: ${task.name}`);
            console.log();
            console.log(chalk.gray('Files:'), task.files.join(', '));
            console.log(chalk.gray('Action:'));
            console.log(`  ${task.action}`);
            console.log(chalk.gray('Verify:'), task.verify);
            console.log(chalk.gray('Done When:'), task.doneWhen);
            console.log();
            console.log(chalk.gray(`Run "projector tasks start ${changeId} ${task.id}" to begin`));
            return;
          }
        }
      }
    }

    // Check checkpoints
    for (const task of parsed.checkpoints) {
      if (task.status === 'pending') {
        console.log(chalk.white.bold('Next: Checkpoint'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.yellow(`Checkpoint: ${task.name}`));
        console.log(chalk.gray('This requires human approval before proceeding.'));
        return;
      }
    }

    console.log(chalk.green('All tasks complete!'));
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
