/**
 * Workflow Parser
 *
 * Parses YAML workflow definitions and validates them.
 */

import { parse as parseYaml } from 'yaml';
import path from 'path';
import { promises as fs } from 'fs';
import { FileSystemUtils } from '../../utils/file-system.js';
import { getSpoolDirName } from '../project-config.js';
import { WorkflowDefinition, WaveDefinition, TaskDefinition, AgentType } from './types.js';

const VALID_AGENT_TYPES: AgentType[] = ['research', 'execution', 'review', 'planning'];

export class WorkflowParser {
  async getWorkflowsDir(projectPath: string): Promise<string> {
    const spoolDir = getSpoolDirName(projectPath);
    return path.join(projectPath, spoolDir, 'workflows');
  }

  async parse(workflowPath: string): Promise<WorkflowDefinition> {
    const content = await FileSystemUtils.readFile(workflowPath);
    const raw = parseYaml(content);

    return this.validate(raw, workflowPath);
  }

  async parseByName(name: string, projectPath: string): Promise<WorkflowDefinition> {
    const workflowsDir = await this.getWorkflowsDir(projectPath);
    const workflowPath = path.join(workflowsDir, `${name}.yaml`);

    if (!(await FileSystemUtils.fileExists(workflowPath))) {
      throw new Error(`Workflow not found: ${name}`);
    }

    return this.parse(workflowPath);
  }

  async listWorkflows(projectPath: string): Promise<string[]> {
    const workflowsDir = await this.getWorkflowsDir(projectPath);

    if (!(await FileSystemUtils.directoryExists(workflowsDir))) {
      return [];
    }

    const files = await fs.readdir(workflowsDir);
    return files
      .filter((f: string) => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map((f: string) => f.replace(/\.ya?ml$/, ''));
  }

  private validate(raw: any, sourcePath: string): WorkflowDefinition {
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Invalid workflow file: ${sourcePath}`);
    }

    // Required fields
    if (!raw.id || typeof raw.id !== 'string') {
      throw new Error(`Workflow missing required field 'id': ${sourcePath}`);
    }
    if (!raw.name || typeof raw.name !== 'string') {
      throw new Error(`Workflow missing required field 'name': ${sourcePath}`);
    }
    if (!Array.isArray(raw.waves) || raw.waves.length === 0) {
      throw new Error(`Workflow must have at least one wave: ${sourcePath}`);
    }

    // Validate waves
    const waves: WaveDefinition[] = raw.waves.map((wave: any, waveIndex: number) =>
      this.validateWave(wave, waveIndex, sourcePath)
    );

    // Check for duplicate task IDs
    const taskIds = new Set<string>();
    for (const wave of waves) {
      for (const task of wave.tasks) {
        if (taskIds.has(task.id)) {
          throw new Error(`Duplicate task ID '${task.id}' in workflow: ${sourcePath}`);
        }
        taskIds.add(task.id);
      }
    }

    return {
      version: raw.version || '1.0',
      id: raw.id,
      name: raw.name,
      description: raw.description || '',
      requires: raw.requires,
      waves,
      context_files: raw.context_files,
      on_complete: raw.on_complete,
    };
  }

  private validateWave(raw: any, index: number, sourcePath: string): WaveDefinition {
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Invalid wave at index ${index}: ${sourcePath}`);
    }

    const waveId = raw.id || `wave-${index + 1}`;

    if (!Array.isArray(raw.tasks) || raw.tasks.length === 0) {
      throw new Error(`Wave '${waveId}' must have at least one task: ${sourcePath}`);
    }

    const tasks: TaskDefinition[] = raw.tasks.map((task: any, taskIndex: number) =>
      this.validateTask(task, waveId, taskIndex, sourcePath)
    );

    return {
      id: waveId,
      name: raw.name,
      tasks,
      checkpoint: raw.checkpoint === true,
    };
  }

  private validateTask(
    raw: any,
    waveId: string,
    index: number,
    sourcePath: string
  ): TaskDefinition {
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Invalid task at wave '${waveId}' index ${index}: ${sourcePath}`);
    }

    if (!raw.id || typeof raw.id !== 'string') {
      throw new Error(
        `Task at wave '${waveId}' index ${index} is missing a required 'id' field: ${sourcePath}`
      );
    }
    const taskId = raw.id;

    if (!raw.agent || !VALID_AGENT_TYPES.includes(raw.agent)) {
      throw new Error(
        `Task '${taskId}' has invalid agent type '${raw.agent}'. ` +
          `Valid types: ${VALID_AGENT_TYPES.join(', ')}: ${sourcePath}`
      );
    }

    if (!raw.prompt || typeof raw.prompt !== 'string') {
      throw new Error(`Task '${taskId}' missing required field 'prompt': ${sourcePath}`);
    }

    return {
      id: taskId,
      name: raw.name || taskId,
      agent: raw.agent as AgentType,
      prompt: raw.prompt,
      inputs: raw.inputs,
      output: raw.output,
      type: raw.type || 'auto',
      context: raw.context,
    };
  }
}

export const workflowParser = new WorkflowParser();
