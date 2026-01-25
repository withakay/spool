import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';
import { EXTENDED_COMMANDS } from './base.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.github/prompts/spool-proposal.prompt.md',
  apply: '.github/prompts/spool-apply.prompt.md',
  archive: '.github/prompts/spool-archive.prompt.md',
  research: '.github/prompts/spool-research.prompt.md',
  review: '.github/prompts/spool-review.prompt.md',
  spool: '.github/prompts/spool.prompt.md',
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
 description: Scaffold a new Spool change and validate strictly.
 ---
 
 $ARGUMENTS`,
  apply: `---
 description: Implement an approved Spool change and keep tasks in sync.
 ---
 
 $ARGUMENTS`,
  archive: `---
 description: Archive a deployed Spool change and update specs.
 ---
 
 $ARGUMENTS`,
  research: `---
 description: Conduct Spool research via skills (stack, architecture, features, pitfalls).
 ---
 
 $ARGUMENTS`,
  review: `---
 description: Conduct adversarial review via Spool review skill.
 ---
 
  $ARGUMENTS`,
  spool: `---
 description: Route spool commands via the spool skill (skill-first, CLI fallback).
 ---
 
 $ARGUMENTS`,
};

export class GitHubCopilotSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'github-copilot';
  readonly isAvailable = true;

  protected getSupportedCommands(): SlashCommandId[] {
    return EXTENDED_COMMANDS;
  }

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
