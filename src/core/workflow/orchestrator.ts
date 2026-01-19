/**
 * Workflow Orchestrator
 *
 * Generates execution plans and tool-specific instructions
 * for running multi-agent workflows.
 */

import path from 'path';
import { FileSystemUtils } from '../../utils/file-system.js';
import { getSpoolDirName } from '../project-config.js';
import { agentConfigManager } from '../agent-config.js';
import { workflowParser } from './parser.js';
import {
  WorkflowDefinition,
  WorkflowExecution,
  ExecutionPlan,
  Tool,
  TaskStatus,
} from './types.js';

export class WorkflowOrchestrator {
  /**
   * Generate an execution plan for a workflow
   */
  async generatePlan(
    workflowName: string,
    tool: Tool,
    projectPath: string,
    variables: Record<string, string> = {}
  ): Promise<ExecutionPlan> {
    const workflow = await workflowParser.parseByName(workflowName, projectPath);
    const config = await agentConfigManager.load(projectPath);
    const spoolDir = getSpoolDirName(projectPath);

    const plan: ExecutionPlan = {
      workflow,
      tool,
      waves: [],
    };

    for (const wave of workflow.waves) {
      const wavePlan = {
        wave_id: wave.id,
        parallel: wave.tasks.length > 1, // Can parallelize if multiple tasks
        tasks: [] as ExecutionPlan['waves'][0]['tasks'],
      };

      for (const task of wave.tasks) {
        // Get model and context budget from config
        const model = agentConfigManager.getModelForAgent(config, tool, task.agent);
        const contextBudget = agentConfigManager.getContextBudget(config, tool, task.agent);

        // Load prompt template
        const promptPath = path.join(projectPath, spoolDir, task.prompt);
        let promptContent = '';
        if (await FileSystemUtils.fileExists(promptPath)) {
          promptContent = await FileSystemUtils.readFile(promptPath);
          // Substitute variables in prompt
          promptContent = this.substituteVariables(promptContent, variables);
        } else {
          promptContent = `[Prompt file not found: ${task.prompt}]`;
        }

        wavePlan.tasks.push({
          task_id: task.id,
          model,
          context_budget: contextBudget,
          prompt_content: promptContent,
          inputs: task.inputs || [],
          output: task.output || '',
        });
      }

      plan.waves.push(wavePlan);
    }

    return plan;
  }

  /**
   * Generate tool-specific orchestration instructions
   */
  async generateInstructions(
    workflowName: string,
    tool: Tool,
    projectPath: string,
    variables: Record<string, string> = {}
  ): Promise<string> {
    const plan = await this.generatePlan(workflowName, tool, projectPath, variables);

    switch (tool) {
      case 'opencode':
        return this.generateOpenCodeInstructions(plan, projectPath);
      case 'claude-code':
        return this.generateClaudeCodeInstructions(plan, projectPath);
      case 'codex':
        return this.generateCodexInstructions(plan, projectPath);
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  }

  /**
   * Initialize workflow execution state
   */
  async initExecution(
    workflowName: string,
    projectPath: string,
    variables: Record<string, string> = {}
  ): Promise<WorkflowExecution> {
    const workflow = await workflowParser.parseByName(workflowName, projectPath);

    const execution: WorkflowExecution = {
      workflow,
      status: 'pending',
      waves: workflow.waves.map((wave) => ({
        wave: wave,
        status: 'pending' as TaskStatus,
        tasks: wave.tasks.map((task) => ({
          task,
          wave_id: wave.id,
          status: 'pending' as TaskStatus,
        })),
      })),
      started_at: new Date().toISOString(),
      current_wave_index: 0,
      variables,
    };

    // Save execution state
    await this.saveExecutionState(execution, projectPath);

    return execution;
  }

  /**
   * Save execution state to file
   */
  async saveExecutionState(
    execution: WorkflowExecution,
    projectPath: string
  ): Promise<void> {
    const spoolDir = getSpoolDirName(projectPath);
    const statePath = path.join(
      projectPath,
      spoolDir,
      'workflows',
      '.state',
      `${execution.workflow.id}.json`
    );

    await FileSystemUtils.createDirectory(path.dirname(statePath));
    await FileSystemUtils.writeFile(statePath, JSON.stringify(execution, null, 2));
  }

  /**
   * Load execution state from file
   */
  async loadExecutionState(
    workflowId: string,
    projectPath: string
  ): Promise<WorkflowExecution | null> {
    const spoolDir = getSpoolDirName(projectPath);
    const statePath = path.join(
      projectPath,
      spoolDir,
      'workflows',
      '.state',
      `${workflowId}.json`
    );

    if (!(await FileSystemUtils.fileExists(statePath))) {
      return null;
    }

    const content = await FileSystemUtils.readFile(statePath);
    return JSON.parse(content) as WorkflowExecution;
  }

  private substituteVariables(
    content: string,
    variables: Record<string, string>
  ): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * Generate OpenCode-specific orchestration instructions
   */
  private generateOpenCodeInstructions(plan: ExecutionPlan, projectPath: string): string {
    const spoolDir = getSpoolDirName(projectPath);
    const lines: string[] = [

      `# Workflow Execution: ${plan.workflow.name}`,
      '',
      `> Tool: OpenCode`,
      `> Generated: ${new Date().toISOString()}`,
      '',
      '## Overview',
      plan.workflow.description,
      '',
      '## Execution Instructions',
      '',
      'Execute the following waves sequentially. Within each wave, spawn parallel agents for each task.',
      '',
    ];

    for (let i = 0; i < plan.waves.length; i++) {
      const wave = plan.waves[i];
      const waveNum = i + 1;

      lines.push(`### Wave ${waveNum}: ${wave.wave_id}`);
      lines.push('');

      if (wave.parallel && wave.tasks.length > 1) {
        lines.push(`**Parallel Execution** - Spawn ${wave.tasks.length} agents simultaneously:`);
      } else {
        lines.push('**Sequential Execution:**');
      }
      lines.push('');

      for (const task of wave.tasks) {
        lines.push(`#### Task: ${task.task_id}`);
        lines.push(`- **Model**: ${task.model}`);
        lines.push(`- **Context Budget**: ${task.context_budget} tokens`);
        if (task.inputs.length > 0) {
          lines.push(`- **Read Files**: ${task.inputs.join(', ')}`);
        }
        if (task.output) {
          lines.push(`- **Write Output To**: ${task.output}`);
        }
        lines.push('');
        lines.push('**Agent Instructions:**');
        lines.push('```');
        lines.push(task.prompt_content);
        lines.push('```');
        lines.push('');
      }

      // Check for checkpoint
      const waveDefn = plan.workflow.waves[i];
      if (waveDefn.checkpoint) {
        lines.push('⚠️ **CHECKPOINT**: Wait for user confirmation before proceeding to next wave.');
        lines.push('');
      }
    }

    lines.push('## Completion');
    lines.push('');
    lines.push('After all waves complete:');
    if (plan.workflow.on_complete?.update_state) {
      lines.push(`- Update \`${spoolDir}/planning/STATE.md\` with session notes`);
    }
    if (plan.workflow.on_complete?.update_roadmap) {
      lines.push(`- Update \`${spoolDir}/planning/ROADMAP.md\` progress`);
    }

    return lines.join('\n');
  }

  /**
   * Generate Claude Code-specific orchestration instructions
   */
  private generateClaudeCodeInstructions(plan: ExecutionPlan, projectPath: string): string {
    const lines: string[] = [
      `# Workflow Execution: ${plan.workflow.name}`,
      '',
      `> Tool: Claude Code`,
      `> Generated: ${new Date().toISOString()}`,
      '',
      '## Overview',
      plan.workflow.description,
      '',
      '## Execution Instructions',
      '',
      'Use the Task tool to spawn subagents. For parallel waves, spawn all tasks in a single message.',
      '',
    ];

    for (let i = 0; i < plan.waves.length; i++) {
      const wave = plan.waves[i];
      const waveNum = i + 1;

      lines.push(`### Wave ${waveNum}: ${wave.wave_id}`);
      lines.push('');

      if (wave.parallel && wave.tasks.length > 1) {
        lines.push('**Spawn these agents in parallel** (single message with multiple Task tool calls):');
      } else {
        lines.push('**Execute sequentially:**');
      }
      lines.push('');

      for (const task of wave.tasks) {
        lines.push(`#### Task: ${task.task_id}`);
        lines.push('');
        lines.push('```');
        lines.push(`Task tool call:`);
        lines.push(`  subagent_type: "general-purpose"`);
        lines.push(`  model: "${this.mapModelToClaudeCode(task.model)}"`);
        lines.push(`  description: "${task.task_id}"`);
        lines.push(`  prompt: |`);
        // Indent the prompt content
        const promptLines = task.prompt_content.split('\n');
        for (const line of promptLines) {
          lines.push(`    ${line}`);
        }
        lines.push('```');
        lines.push('');
        if (task.output) {
          lines.push(`Expected output: \`${task.output}\``);
          lines.push('');
        }
      }

      const waveDefn = plan.workflow.waves[i];
      if (waveDefn.checkpoint) {
        lines.push('⚠️ **CHECKPOINT**: Use AskUserQuestion to confirm before proceeding.');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate Codex CLI-specific orchestration instructions
   */
  private generateCodexInstructions(plan: ExecutionPlan, projectPath: string): string {
    const lines: string[] = [
      `# Workflow Execution: ${plan.workflow.name}`,
      '',
      `> Tool: Codex CLI`,
      `> Generated: ${new Date().toISOString()}`,
      '',
      '## Overview',
      plan.workflow.description,
      '',
      '## Execution Instructions',
      '',
      'Use background agents for parallel execution within waves.',
      '',
    ];

    for (let i = 0; i < plan.waves.length; i++) {
      const wave = plan.waves[i];
      const waveNum = i + 1;

      lines.push(`### Wave ${waveNum}: ${wave.wave_id}`);
      lines.push('');

      if (wave.parallel && wave.tasks.length > 1) {
        lines.push('**Run in parallel** using background execution:');
      } else {
        lines.push('**Execute:**');
      }
      lines.push('');

      for (const task of wave.tasks) {
        lines.push(`#### ${task.task_id}`);
        lines.push(`Model preference: ${task.model}`);
        lines.push('');
        if (task.inputs.length > 0) {
          lines.push(`Read: ${task.inputs.join(', ')}`);
        }
        if (task.output) {
          lines.push(`Write to: ${task.output}`);
        }
        lines.push('');
        lines.push('Instructions:');
        lines.push('```');
        lines.push(task.prompt_content);
        lines.push('```');
        lines.push('');
      }

      const waveDefn = plan.workflow.waves[i];
      if (waveDefn.checkpoint) {
        lines.push('⚠️ **CHECKPOINT**: Pause for user confirmation.');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private mapModelToClaudeCode(model: string): string {
    // Map generic model names to Claude Code model parameter
    const mapping: Record<string, string> = {
      'claude-haiku': 'haiku',
      'claude-sonnet': 'sonnet',
      'claude-opus': 'opus',
      'haiku': 'haiku',
      'sonnet': 'sonnet',
      'opus': 'opus',
    };
    return mapping[model] || 'sonnet';
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();
