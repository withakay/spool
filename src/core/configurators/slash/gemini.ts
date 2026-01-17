import { TomlSlashCommandConfigurator } from './toml-base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.gemini/commands/openspec/proposal.toml',
  apply: '.gemini/commands/openspec/apply.toml',
  archive: '.gemini/commands/openspec/archive.toml'
};

const DESCRIPTIONS: Record<CoreSlashCommandId, string> = {
  proposal: 'Scaffold a new OpenSpec change and validate strictly.',
  apply: 'Implement an approved OpenSpec change and keep tasks in sync.',
  archive: 'Archive a deployed OpenSpec change and update specs.'
};

export class GeminiSlashCommandConfigurator extends TomlSlashCommandConfigurator {
  readonly toolId = 'gemini';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getDescription(id: SlashCommandId): string {
    return DESCRIPTIONS[id as CoreSlashCommandId];
  }
}
