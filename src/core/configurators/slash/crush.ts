import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.crush/commands/projector/proposal.md',
  apply: '.crush/commands/projector/apply.md',
  archive: '.crush/commands/projector/archive.md'
};

const FRONTMATTER: Record<CoreSlashCommandId, string> = {
  proposal: `---
name: Projector: Proposal
description: Scaffold a new Projector change and validate strictly.
category: Projector
tags: [projector, change]
---`,
  apply: `---
name: Projector: Apply
description: Implement an approved Projector change and keep tasks in sync.
category: Projector
tags: [projector, apply]
---`,
  archive: `---
name: Projector: Archive
description: Archive a deployed Projector change and update specs.
category: Projector
tags: [projector, archive]
---`
};

export class CrushSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'crush';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id as CoreSlashCommandId];
  }
}