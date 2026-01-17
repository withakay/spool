import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.augment/commands/openspec-proposal.md',
  apply: '.augment/commands/openspec-apply.md',
  archive: '.augment/commands/openspec-archive.md'
};

const FRONTMATTER: Record<CoreSlashCommandId, string> = {
  proposal: `---
description: Scaffold a new OpenSpec change and validate strictly.
argument-hint: feature description or request
---`,
  apply: `---
description: Implement an approved OpenSpec change and keep tasks in sync.
argument-hint: change-id
---`,
  archive: `---
description: Archive a deployed OpenSpec change and update specs.
argument-hint: change-id
---`
};

export class AuggieSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'auggie';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id as CoreSlashCommandId];
  }
}

