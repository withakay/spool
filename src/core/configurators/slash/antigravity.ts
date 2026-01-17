import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.agent/workflows/projector-proposal.md',
  apply: '.agent/workflows/projector-apply.md',
  archive: '.agent/workflows/projector-archive.md'
};

const DESCRIPTIONS: Record<CoreSlashCommandId, string> = {
  proposal: 'Scaffold a new Projector change and validate strictly.',
  apply: 'Implement an approved Projector change and keep tasks in sync.',
  archive: 'Archive a deployed Projector change and update specs.'
};

export class AntigravitySlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'antigravity';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    const description = DESCRIPTIONS[id as CoreSlashCommandId];
    return `---\ndescription: ${description}\n---`;
  }
}
