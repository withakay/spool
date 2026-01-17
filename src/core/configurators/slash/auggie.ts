import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.augment/commands/projector-proposal.md',
  apply: '.augment/commands/projector-apply.md',
  archive: '.augment/commands/projector-archive.md'
};

const FRONTMATTER: Record<CoreSlashCommandId, string> = {
  proposal: `---
description: Scaffold a new Projector change and validate strictly.
argument-hint: feature description or request
---`,
  apply: `---
description: Implement an approved Projector change and keep tasks in sync.
argument-hint: change-id
---`,
  archive: `---
description: Archive a deployed Projector change and update specs.
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

