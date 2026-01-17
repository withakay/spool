import { TomlSlashCommandConfigurator } from './toml-base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.gemini/commands/projector/proposal.toml',
  apply: '.gemini/commands/projector/apply.toml',
  archive: '.gemini/commands/projector/archive.toml'
};

const DESCRIPTIONS: Record<CoreSlashCommandId, string> = {
  proposal: 'Scaffold a new Projector change and validate strictly.',
  apply: 'Implement an approved Projector change and keep tasks in sync.',
  archive: 'Archive a deployed Projector change and update specs.'
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
