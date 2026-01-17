import { agentConfigManager, AgentConfig } from '../core/agent-config.js';
import { stringify as stringifyYaml } from 'yaml';

export class AgentConfigCommand {
  async init(projectPath: string = '.'): Promise<void> {
    await agentConfigManager.init(projectPath);
    console.log('Created config.yaml with default settings');
  }

  async show(projectPath: string = '.'): Promise<void> {
    const config = await agentConfigManager.load(projectPath);
    console.log(stringifyYaml(config, { indent: 2, lineWidth: 0 }));
  }

  async get(key: string, projectPath: string = '.'): Promise<void> {
    const value = await agentConfigManager.get(projectPath, key);
    if (value === undefined) {
      console.log(`Key "${key}" not found`);
    } else if (typeof value === 'object') {
      console.log(stringifyYaml(value, { indent: 2, lineWidth: 0 }));
    } else {
      console.log(value);
    }
  }

  async set(key: string, value: string, projectPath: string = '.'): Promise<void> {
    await agentConfigManager.set(projectPath, key, value);
    console.log(`Set ${key} = ${value}`);
  }

  async showModel(
    tool: 'opencode' | 'codex' | 'claude-code',
    agentType: 'research' | 'execution' | 'review' | 'planning',
    projectPath: string = '.'
  ): Promise<void> {
    const config = await agentConfigManager.load(projectPath);
    const model = agentConfigManager.getModelForAgent(config, tool, agentType);
    const contextBudget = agentConfigManager.getContextBudget(config, tool, agentType);

    console.log(`Tool: ${tool}`);
    console.log(`Agent Type: ${agentType}`);
    console.log(`Model: ${model}`);
    console.log(`Context Budget: ${contextBudget}`);
  }

  async summary(projectPath: string = '.'): Promise<void> {
    const config = await agentConfigManager.load(projectPath);
    const tools = ['opencode', 'codex', 'claude-code'] as const;
    const agentTypes = ['research', 'execution', 'review', 'planning'] as const;

    console.log('Agent Configuration Summary\n');
    console.log('=' .repeat(60));

    for (const tool of tools) {
      console.log(`\n${tool.toUpperCase()}`);
      console.log('-'.repeat(40));

      for (const agentType of agentTypes) {
        const model = agentConfigManager.getModelForAgent(config, tool, agentType);
        const budget = agentConfigManager.getContextBudget(config, tool, agentType);
        console.log(`  ${agentType.padEnd(12)} -> ${model.padEnd(15)} (${budget} tokens)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\nContext Strategy:');
    console.log(`  Overflow: ${config.context_strategy?.overflow_handling || 'summarize'}`);
    console.log(`  Always Include: ${config.context_strategy?.always_include?.join(', ') || 'none'}`);
  }
}
