import { EventEmitter } from 'events';

export interface RalphRunConfig {
  prompt: string;
  model?: string;
  cwd: string;
  env?: NodeJS.ProcessEnv;
  interactive?: boolean;
}

export interface AgentHarness extends EventEmitter {
  name: string;
  run(config: RalphRunConfig): Promise<void>;
  stop(): void;
}

export interface RalphState {
  changeId: string;
  iteration: number;
  history: Array<{
    timestamp: number;
    duration: number;
    completionPromiseFound: boolean;
    fileChangesCount: number;
  }>;
  contextFile: string;
}

export interface RalphOptions {
  prompt?: string;
  changeId?: string;
  moduleId?: string;
  harness?: 'opencode' | 'claude-code' | 'codex' | 'github-copilot';
  model?: string;
  minIterations?: number;
  maxIterations?: number;
  completionPromise?: string;
  allowAll?: boolean;
  noCommit?: boolean;
  interactive?: boolean;
  status?: boolean;
  addContext?: string;
  clearContext?: boolean;
}
