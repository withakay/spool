import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.continue/prompts/projector-proposal.prompt',
  apply: '.continue/prompts/projector-apply.prompt',
  archive: '.continue/prompts/projector-archive.prompt'
};

/*
 * Continue .prompt format requires YAML frontmatter:
 * ---
 * name: commandName
 * description: description
 * invokable: true
 * ---
 * Body...
 *
 * The 'invokable: true' field is required to make the prompt available as a slash command.
 * We use 'projector-proposal' as the name so the command becomes /projector-proposal.
 */
const FRONTMATTER: Record<CoreSlashCommandId, string> = {
  proposal: `---
name: projector-proposal
description: Scaffold a new Projector change and validate strictly.
invokable: true
---`,
  apply: `---
name: projector-apply
description: Implement an approved Projector change and keep tasks in sync.
invokable: true
---`,
  archive: `---
name: projector-archive
description: Archive a deployed Projector change and update specs.
invokable: true
---`
};

export class ContinueSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'continue';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id as CoreSlashCommandId];
  }
}
