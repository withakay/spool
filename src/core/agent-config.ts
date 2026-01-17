import path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { FileSystemUtils } from '../utils/file-system.js';
import { getOpenSpecDirName } from './project-config.js';

export interface ModelConfig {
  fast?: string;
  balanced?: string;
  powerful?: string;
}

export interface ToolConfig {
  default_model?: string;
  models?: ModelConfig;
  context_limits?: Record<string, number>;
}

export interface AgentCategoryConfig {
  model_preference?: 'fast' | 'balanced' | 'powerful';
  context_budget?: number | 'max';
  requires?: string[];
}

export interface ContextStrategy {
  overflow_handling?: 'summarize' | 'truncate' | 'error';
  always_include?: string[];
  priority_files?: string[];
  small_context?: {
    max_file_size: number;
    max_files: number;
    summarize_threshold: number;
  };
  medium_context?: {
    max_file_size: number;
    max_files: number;
    summarize_threshold: number;
  };
  large_context?: {
    max_file_size: number;
    max_files: number;
    summarize_threshold: number;
  };
}

export interface AgentConfig {
  version: string;
  defaults?: {
    model?: string;
    context_budget?: number;
    timeout?: number;
    retry_count?: number;
  };
  tools?: {
    opencode?: ToolConfig;
    codex?: ToolConfig;
    'claude-code'?: ToolConfig;
  };
  agents?: {
    research?: AgentCategoryConfig;
    execution?: AgentCategoryConfig;
    review?: AgentCategoryConfig;
    planning?: AgentCategoryConfig;
  };
  context_strategy?: ContextStrategy;
}

const DEFAULT_CONFIG: AgentConfig = {
  version: '1.0',
  defaults: {
    model: 'auto',
    context_budget: 100000,
    timeout: 300,
    retry_count: 2,
  },
  tools: {
    opencode: {
      default_model: 'claude-sonnet',
      models: {
        fast: 'claude-haiku',
        balanced: 'claude-sonnet',
        powerful: 'claude-opus',
      },
      context_limits: {
        'claude-haiku': 200000,
        'claude-sonnet': 200000,
        'claude-opus': 200000,
        'gpt-4o': 128000,
        'gpt-4o-mini': 128000,
        'gemini-pro': 1000000,
      },
    },
    codex: {
      default_model: 'gpt-4o',
      models: {
        fast: 'gpt-4o-mini',
        balanced: 'gpt-4o',
        powerful: 'o1',
      },
      context_limits: {
        'gpt-4o': 128000,
        'gpt-4o-mini': 128000,
        'o1': 200000,
      },
    },
    'claude-code': {
      default_model: 'sonnet',
      models: {
        fast: 'haiku',
        balanced: 'sonnet',
        powerful: 'opus',
      },
      context_limits: {
        haiku: 200000,
        sonnet: 200000,
        opus: 200000,
      },
    },
  },
  agents: {
    research: {
      model_preference: 'balanced',
      context_budget: 50000,
      requires: ['web_search', 'file_read'],
    },
    execution: {
      model_preference: 'balanced',
      context_budget: 'max',
      requires: ['file_read', 'file_write', 'bash'],
    },
    review: {
      model_preference: 'powerful',
      context_budget: 80000,
      requires: ['file_read'],
    },
    planning: {
      model_preference: 'balanced',
      context_budget: 60000,
      requires: ['file_read', 'file_write'],
    },
  },
  context_strategy: {
    overflow_handling: 'summarize',
    always_include: [
      'openspec/planning/STATE.md',
      'openspec/planning/PROJECT.md',
    ],
    priority_files: [
      'openspec/planning/ROADMAP.md',
      'openspec/research/SUMMARY.md',
    ],
  },
};

export class AgentConfigManager {
  private config: AgentConfig | null = null;
  private configPath: string | null = null;

  async getConfigPath(projectPath: string): Promise<string> {
    const openspecDir = getOpenSpecDirName(projectPath);
    return path.join(projectPath, openspecDir, 'config.yaml');
  }

  async load(projectPath: string): Promise<AgentConfig> {
    const configPath = await this.getConfigPath(projectPath);
    this.configPath = configPath;

    if (await FileSystemUtils.fileExists(configPath)) {
      const content = await FileSystemUtils.readFile(configPath);
      this.config = parseYaml(content) as AgentConfig;
    } else {
      this.config = { ...DEFAULT_CONFIG };
    }

    return this.config;
  }

  async save(projectPath: string, config?: AgentConfig): Promise<void> {
    const configPath = await this.getConfigPath(projectPath);
    const configToSave = config || this.config || DEFAULT_CONFIG;

    const content = stringifyYaml(configToSave, {
      indent: 2,
      lineWidth: 0,
    });

    await FileSystemUtils.writeFile(configPath, content);
    this.config = configToSave;
  }

  async init(projectPath: string): Promise<void> {
    const configPath = await this.getConfigPath(projectPath);

    if (await FileSystemUtils.fileExists(configPath)) {
      throw new Error('config.yaml already exists');
    }

    await this.save(projectPath, DEFAULT_CONFIG);
  }

  async get(projectPath: string, key: string): Promise<any> {
    const config = await this.load(projectPath);
    return this.getNestedValue(config, key);
  }

  async set(projectPath: string, key: string, value: any): Promise<void> {
    const config = await this.load(projectPath);
    this.setNestedValue(config, key, value);
    await this.save(projectPath, config);
  }

  getModelForAgent(
    config: AgentConfig,
    tool: 'opencode' | 'codex' | 'claude-code',
    agentCategory: 'research' | 'execution' | 'review' | 'planning'
  ): string {
    const agentConfig = config.agents?.[agentCategory];
    const toolConfig = config.tools?.[tool];

    if (!toolConfig) {
      return config.defaults?.model || 'auto';
    }

    const preference = agentConfig?.model_preference || 'balanced';
    return toolConfig.models?.[preference] || toolConfig.default_model || 'auto';
  }

  getContextBudget(
    config: AgentConfig,
    tool: 'opencode' | 'codex' | 'claude-code',
    agentCategory: 'research' | 'execution' | 'review' | 'planning'
  ): number {
    const agentConfig = config.agents?.[agentCategory];
    const toolConfig = config.tools?.[tool];

    const budget = agentConfig?.context_budget;

    if (budget === 'max') {
      // Get model's context limit
      const model = this.getModelForAgent(config, tool, agentCategory);
      return toolConfig?.context_limits?.[model] || config.defaults?.context_budget || 100000;
    }

    return (budget as number) || config.defaults?.context_budget || 100000;
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined) {
        current[key] = {};
      }
      current = current[key];
    }

    // The value from the CLI is a string. Avoid automatic type coercion.
    current[keys[keys.length - 1]] = value;
  }

  static getDefaultConfig(): AgentConfig {
    return { ...DEFAULT_CONFIG };
  }
}

export const agentConfigManager = new AgentConfigManager();
