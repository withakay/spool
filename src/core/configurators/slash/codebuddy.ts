import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.codebuddy/commands/projector/proposal.md',
  apply: '.codebuddy/commands/projector/apply.md',
  archive: '.codebuddy/commands/projector/archive.md'
};

const FRONTMATTER: Record<CoreSlashCommandId, string> = {
  proposal: `---
name: Projector: Proposal
description: "Scaffold a new Projector change and validate strictly."
argument-hint: "[feature description or request]"
---`,
  apply: `---
name: Projector: Apply
description: "Implement an approved Projector change and keep tasks in sync."
argument-hint: "[change-id]"
---`,
  archive: `---
name: Projector: Archive
description: "Archive a deployed Projector change and update specs."
argument-hint: "[change-id]"
---`
};

export class CodeBuddySlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'codebuddy';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id as CoreSlashCommandId];
  }
}

