import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.iflow/commands/projector-proposal.md',
  apply: '.iflow/commands/projector-apply.md',
  archive: '.iflow/commands/projector-archive.md'
};

const FRONTMATTER: Record<CoreSlashCommandId, string> = {
  proposal: `---
name: /projector-proposal
id: projector-proposal
category: Projector
description: Scaffold a new Projector change and validate strictly.
---`,
  apply: `---
name: /projector-apply
id: projector-apply
category: Projector
description: Implement an approved Projector change and keep tasks in sync.
---`,
  archive: `---
name: /projector-archive
id: projector-archive
category: Projector
description: Archive a deployed Projector change and update specs.
---`
};

export class IflowSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'iflow';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id as CoreSlashCommandId];
  }
}
