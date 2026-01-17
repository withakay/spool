import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const NEW_FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.roo/commands/openspec-proposal.md',
  apply: '.roo/commands/openspec-apply.md',
  archive: '.roo/commands/openspec-archive.md'
};

export class RooCodeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'roocode';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return NEW_FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    const descriptions: Record<CoreSlashCommandId, string> = {
      proposal: 'Scaffold a new OpenSpec change and validate strictly.',
      apply: 'Implement an approved OpenSpec change and keep tasks in sync.',
      archive: 'Archive a deployed OpenSpec change and update specs.'
    };
    const description = descriptions[id as CoreSlashCommandId];
    return `# OpenSpec: ${id.charAt(0).toUpperCase() + id.slice(1)}\n\n${description}`;
  }
}
