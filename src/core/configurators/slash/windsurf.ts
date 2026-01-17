import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.windsurf/workflows/projector-proposal.md',
  apply: '.windsurf/workflows/projector-apply.md',
  archive: '.windsurf/workflows/projector-archive.md'
};

export class WindsurfSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'windsurf';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    const descriptions: Record<CoreSlashCommandId, string> = {
      proposal: 'Scaffold a new Projector change and validate strictly.',
      apply: 'Implement an approved Projector change and keep tasks in sync.',
      archive: 'Archive a deployed Projector change and update specs.'
    };
    const description = descriptions[id as CoreSlashCommandId];
    return `---\ndescription: ${description}\nauto_execution_mode: 3\n---`;
  }
}
