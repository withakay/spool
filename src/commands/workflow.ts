/**
 * Workflow CLI Command
 *
 * Manage and execute multi-agent workflows
 */

import path from 'path';
import { FileSystemUtils } from '../utils/file-system.js';
import { getProjectorDirName } from '../core/project-config.js';
import {
  workflowParser,
  workflowOrchestrator,
  Tool,
  WorkflowDefinition,
} from '../core/workflow/index.js';

export class WorkflowCommand {
  /**
   * Initialize workflows directory with example workflows
   */
  async init(projectPath: string = '.'): Promise<void> {
    const projectorDir = getProjectorDirName(projectPath);
    const workflowsDir = path.join(projectPath, projectorDir, 'workflows');
    const commandsDir = path.join(projectPath, projectorDir, 'commands');

    // Create directories
    await FileSystemUtils.createDirectory(workflowsDir);
    await FileSystemUtils.createDirectory(path.join(workflowsDir, '.state'));
    await FileSystemUtils.createDirectory(commandsDir);

    // Create example research workflow
    const researchWorkflow = this.getResearchWorkflowTemplate();
    await FileSystemUtils.writeFile(
      path.join(workflowsDir, 'research.yaml'),
      researchWorkflow
    );

    // Create example execute workflow
    const executeWorkflow = this.getExecuteWorkflowTemplate();
    await FileSystemUtils.writeFile(
      path.join(workflowsDir, 'execute.yaml'),
      executeWorkflow
    );

    // Create example review workflow
    const reviewWorkflow = this.getReviewWorkflowTemplate();
    await FileSystemUtils.writeFile(
      path.join(workflowsDir, 'review.yaml'),
      reviewWorkflow
    );

    console.log('Created workflows directory with example workflows:');
    console.log('  - research.yaml  (domain investigation)');
    console.log('  - execute.yaml   (task execution)');
    console.log('  - review.yaml    (adversarial review)');
    console.log('');
    console.log('Prompt templates are installed via `projector init`.');
  }

  /**
   * List available workflows
   */
  async list(projectPath: string = '.'): Promise<void> {
    const workflows = await workflowParser.listWorkflows(projectPath);

    if (workflows.length === 0) {
      console.log('No workflows found. Run `projector workflow init` to create examples.');
      return;
    }

    console.log('Available workflows:\n');

    for (const name of workflows) {
      try {
        const workflow = await workflowParser.parseByName(name, projectPath);
        console.log(`  ${name}`);
        console.log(`    ${workflow.description || 'No description'}`);
        console.log(`    Waves: ${workflow.waves.length}, Tasks: ${this.countTasks(workflow)}`);
        console.log('');
      } catch (error) {
        console.log(`  ${name} (invalid: ${(error as Error).message})`);
      }
    }
  }

  /**
   * Show workflow details
   */
  async show(workflowName: string, projectPath: string = '.'): Promise<void> {
    const workflow = await workflowParser.parseByName(workflowName, projectPath);

    console.log(`# Workflow: ${workflow.name}`);
    console.log(`ID: ${workflow.id}`);
    console.log(`Description: ${workflow.description || 'None'}`);
    console.log('');

    if (workflow.requires) {
      console.log('## Requirements');
      if (workflow.requires.files?.length) {
        console.log(`Files: ${workflow.requires.files.join(', ')}`);
      }
      if (workflow.requires.variables?.length) {
        console.log(`Variables: ${workflow.requires.variables.join(', ')}`);
      }
      console.log('');
    }

    console.log('## Waves');
    console.log('');

    for (let i = 0; i < workflow.waves.length; i++) {
      const wave = workflow.waves[i];
      console.log(`### Wave ${i + 1}: ${wave.id}${wave.checkpoint ? ' (checkpoint)' : ''}`);
      console.log('');

      for (const task of wave.tasks) {
        console.log(`  - [${task.agent}] ${task.name}`);
        console.log(`    Prompt: ${task.prompt}`);
        if (task.output) {
          console.log(`    Output: ${task.output}`);
        }
      }
      console.log('');
    }
  }

  /**
   * Generate execution instructions for a tool
   */
  async run(
    workflowName: string,
    tool: Tool,
    projectPath: string = '.',
    variables: Record<string, string> = {}
  ): Promise<void> {
    const instructions = await workflowOrchestrator.generateInstructions(
      workflowName,
      tool,
      projectPath,
      variables
    );

    console.log(instructions);
  }

  /**
   * Generate execution plan (JSON)
   */
  async plan(
    workflowName: string,
    tool: Tool,
    projectPath: string = '.',
    variables: Record<string, string> = {}
  ): Promise<void> {
    const plan = await workflowOrchestrator.generatePlan(
      workflowName,
      tool,
      projectPath,
      variables
    );

    console.log(JSON.stringify(plan, null, 2));
  }

  /**
   * Check workflow execution status
   */
  async status(workflowName: string, projectPath: string = '.'): Promise<void> {
    const execution = await workflowOrchestrator.loadExecutionState(workflowName, projectPath);

    if (!execution) {
      console.log(`No execution state found for workflow: ${workflowName}`);
      return;
    }

    console.log(`# Workflow Status: ${execution.workflow.name}`);
    console.log(`Status: ${execution.status}`);
    console.log(`Started: ${execution.started_at}`);
    if (execution.completed_at) {
      console.log(`Completed: ${execution.completed_at}`);
    }
    console.log(`Current Wave: ${execution.current_wave_index + 1} of ${execution.waves.length}`);
    console.log('');

    for (const wave of execution.waves) {
      const completedTasks = wave.tasks.filter((t) => t.status === 'complete').length;
      console.log(`Wave ${wave.wave.id}: ${wave.status} (${completedTasks}/${wave.tasks.length} tasks)`);

      for (const task of wave.tasks) {
        const icon = task.status === 'complete' ? '✓' : task.status === 'running' ? '→' : '○';
        console.log(`  ${icon} ${task.task.name}: ${task.status}`);
      }
    }
  }

  private countTasks(workflow: WorkflowDefinition): number {
    return workflow.waves.reduce((sum, wave) => sum + wave.tasks.length, 0);
  }

  // ============ Workflow Templates ============

  private getResearchWorkflowTemplate(): string {
    return `# Research Workflow
# Parallel domain investigation before proposal creation

version: "1.0"
id: research
name: Domain Research
description: Investigate domain knowledge, stack options, architecture patterns, and pitfalls before creating a proposal.

requires:
  variables:
    - topic

context_files:
  - planning/PROJECT.md
  - planning/STATE.md

waves:
  - id: investigate
    name: Parallel Investigation
    tasks:
      - id: stack-analysis
        name: Stack Analysis
        agent: research
        prompt: commands/research-stack.md
        output: research/investigations/stack-analysis.md
        context:
          topic: "{{topic}}"

      - id: feature-landscape
        name: Feature Landscape
        agent: research
        prompt: commands/research-features.md
        output: research/investigations/feature-landscape.md
        context:
          topic: "{{topic}}"

      - id: architecture
        name: Architecture Patterns
        agent: research
        prompt: commands/research-architecture.md
        output: research/investigations/architecture.md
        context:
          topic: "{{topic}}"

      - id: pitfalls
        name: Pitfall Research
        agent: research
        prompt: commands/research-pitfalls.md
        output: research/investigations/pitfalls.md
        context:
          topic: "{{topic}}"

  - id: synthesize
    name: Synthesize Findings
    tasks:
      - id: summary
        name: Create Research Summary
        agent: planning
        prompt: commands/research-synthesize.md
        inputs:
          - research/investigations/stack-analysis.md
          - research/investigations/feature-landscape.md
          - research/investigations/architecture.md
          - research/investigations/pitfalls.md
        output: research/SUMMARY.md

on_complete:
  update_state: true
`;
  }

  private getExecuteWorkflowTemplate(): string {
    return `# Execute Workflow
# Execute tasks from a change proposal

version: "1.0"
id: execute
name: Task Execution
description: Execute tasks from an Projector change proposal, wave by wave.

requires:
  variables:
    - change_id
  files:
    - changes/{{change_id}}/tasks.md

context_files:
  - planning/STATE.md
  - planning/PROJECT.md

waves:
  - id: execute-tasks
    name: Execute Change Tasks
    tasks:
      - id: executor
        name: Task Executor
        agent: execution
        prompt: commands/execute-task.md
        inputs:
          - changes/{{change_id}}/tasks.md
          - changes/{{change_id}}/proposal.md
        context:
          change_id: "{{change_id}}"

on_complete:
  update_state: true
  update_roadmap: true
`;
  }

  private getReviewWorkflowTemplate(): string {
    return `# Review Workflow
# Adversarial review of a change proposal

version: "1.0"
id: review
name: Adversarial Review
description: Stress-test a proposal from security, scale, and edge case perspectives.

requires:
  variables:
    - change_id
  files:
    - changes/{{change_id}}/proposal.md

context_files:
  - planning/PROJECT.md

waves:
  - id: parallel-review
    name: Parallel Reviews
    tasks:
      - id: security-review
        name: Security Review
        agent: review
        prompt: commands/review-security.md
        inputs:
          - changes/{{change_id}}/proposal.md
          - changes/{{change_id}}/spec.md
        output: changes/{{change_id}}/reviews/security.md
        context:
          change_id: "{{change_id}}"

      - id: scale-review
        name: Scale Review
        agent: review
        prompt: commands/review-scale.md
        inputs:
          - changes/{{change_id}}/proposal.md
          - changes/{{change_id}}/spec.md
        output: changes/{{change_id}}/reviews/scale.md
        context:
          change_id: "{{change_id}}"

      - id: edge-review
        name: Edge Case Review
        agent: review
        prompt: commands/review-edge.md
        inputs:
          - changes/{{change_id}}/proposal.md
          - changes/{{change_id}}/spec.md
        output: changes/{{change_id}}/reviews/edge-cases.md
        context:
          change_id: "{{change_id}}"

  - id: review-checkpoint
    name: Review Checkpoint
    checkpoint: true
    tasks:
      - id: compile-review
        name: Compile Review Summary
        agent: planning
        prompt: commands/review-compile.md
        inputs:
          - changes/{{change_id}}/reviews/security.md
          - changes/{{change_id}}/reviews/scale.md
          - changes/{{change_id}}/reviews/edge-cases.md
        output: changes/{{change_id}}/REVIEW.md

on_complete:
  update_state: true
`;
  }
}
