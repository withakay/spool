import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.agent/workflows/openspec-proposal.md',
  apply: '.agent/workflows/openspec-apply.md',
  archive: '.agent/workflows/openspec-archive.md'
};

const DESCRIPTIONS: Record<CoreSlashCommandId, string> = {
  proposal: 'Scaffold a new OpenSpec change and validate strictly.',
  apply: 'Implement an approved OpenSpec change and keep tasks in sync.',
  archive: 'Archive a deployed OpenSpec change and update specs.'
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
