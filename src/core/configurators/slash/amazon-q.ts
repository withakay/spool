import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.amazonq/prompts/projector-proposal.md',
  apply: '.amazonq/prompts/projector-apply.md',
  archive: '.amazonq/prompts/projector-archive.md'
};

const FRONTMATTER: Record<CoreSlashCommandId, string> = {
  proposal: `---
description: Scaffold a new Projector change and validate strictly.
---

The user has requested the following change proposal. Use the projector instructions to create their change proposal.

<UserRequest>
  $ARGUMENTS
</UserRequest>`,
  apply: `---
description: Implement an approved Projector change and keep tasks in sync.
---

The user wants to apply the following change. Use the projector instructions to implement the approved change.

<ChangeId>
  $ARGUMENTS
</ChangeId>`,
  archive: `---
description: Archive a deployed Projector change and update specs.
---

The user wants to archive the following deployed change. Use the projector instructions to archive the change and update specs.

<ChangeId>
  $ARGUMENTS
</ChangeId>`
};

export class AmazonQSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'amazon-q';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id as CoreSlashCommandId];
  }
}