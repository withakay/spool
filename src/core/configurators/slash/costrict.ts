import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS = {
  proposal: '.cospec/projector/commands/projector-proposal.md',
  apply: '.cospec/projector/commands/projector-apply.md',
  archive: '.cospec/projector/commands/projector-archive.md',
} as const satisfies Record<CoreSlashCommandId, string>;

const FRONTMATTER = {
  proposal: `---
description: "Scaffold a new Projector change and validate strictly."
argument-hint: feature description or request
---`,
  apply: `---
description: "Implement an approved Projector change and keep tasks in sync."
argument-hint: change-id
---`,
  archive: `---
description: "Archive a deployed Projector change and update specs."
argument-hint: change-id
---`
} as const satisfies Record<CoreSlashCommandId, string>;

export class CostrictSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'costrict';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    return FRONTMATTER[id as CoreSlashCommandId];
  }
}