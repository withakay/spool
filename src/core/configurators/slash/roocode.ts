import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const NEW_FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.roo/commands/projector-proposal.md',
  apply: '.roo/commands/projector-apply.md',
  archive: '.roo/commands/projector-archive.md'
};

export class RooCodeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'roocode';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return NEW_FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    const descriptions: Record<CoreSlashCommandId, string> = {
      proposal: 'Scaffold a new Projector change and validate strictly.',
      apply: 'Implement an approved Projector change and keep tasks in sync.',
      archive: 'Archive a deployed Projector change and update specs.'
    };
    const description = descriptions[id as CoreSlashCommandId];
    return `# Projector: ${id.charAt(0).toUpperCase() + id.slice(1)}\n\n${description}`;
  }
}
