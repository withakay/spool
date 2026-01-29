/**
 * Workflow Schema Types
 *
 * Defines the structure for orchestrating multi-agent workflows
 * across OpenCode, Claude Code, and Codex CLI.
 */

export type AgentType = 'research' | 'execution' | 'review' | 'planning';
export type TaskStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
export type Tool = 'opencode' | 'claude-code' | 'codex';

export interface TaskDefinition {
  /** Unique task identifier within the workflow */
  id: string;

  /** Human-readable task name */
  name: string;

  /** Agent type determines model selection from config */
  agent: AgentType;

  /** Path to prompt template file */
  prompt: string;

  /** Input files/globs the agent should read */
  inputs?: string[];

  /** Output file the agent should write */
  output?: string;

  /** Task type for special handling */
  type?: 'auto' | 'checkpoint' | 'decision';

  /** Optional context to pass to the prompt */
  context?: Record<string, string>;
}

export interface WaveDefinition {
  /** Wave identifier */
  id: string;

  /** Wave name for display */
  name?: string;

  /** Tasks in this wave - run in parallel if tool supports */
  tasks: TaskDefinition[];

  /** If true, wait for user confirmation before proceeding */
  checkpoint?: boolean;
}

export interface WorkflowDefinition {
  /** Workflow schema version */
  version: string;

  /** Workflow identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what this workflow does */
  description: string;

  /** Required inputs before workflow can start */
  requires?: {
    files?: string[];
    variables?: string[];
  };

  /** Waves execute sequentially, tasks within waves can be parallel */
  waves: WaveDefinition[];

  /** Files to always include in agent context */
  context_files?: string[];

  /** Post-workflow actions */
  on_complete?: {
    update_state?: boolean;
    update_roadmap?: boolean;
    notify?: string;
  };
}

export interface TaskExecution {
  task: TaskDefinition;
  wave_id: string;
  status: TaskStatus;
  started_at?: string;
  completed_at?: string;
  error?: string;
  output_content?: string;
}

export interface WaveExecution {
  wave: WaveDefinition;
  status: TaskStatus;
  tasks: TaskExecution[];
  started_at?: string;
  completed_at?: string;
}

export interface WorkflowExecution {
  workflow: WorkflowDefinition;
  status: TaskStatus;
  waves: WaveExecution[];
  started_at: string;
  completed_at?: string;
  current_wave_index: number;
  variables: Record<string, string>;
}

export interface ExecutionPlan {
  workflow: WorkflowDefinition;
  tool: Tool;
  waves: {
    wave_id: string;
    parallel: boolean;
    tasks: {
      task_id: string;
      model: string;
      context_budget: number;
      prompt_content: string;
      inputs: string[];
      output: string;
    }[];
  }[];
}
