import { SlashCommandConfigurator, EXTENDED_COMMANDS } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.claude/commands/spool/proposal.md',
  apply: '.claude/commands/spool/apply.md',
  archive: '.claude/commands/spool/archive.md',
  research: '.claude/commands/spool/research.md',
  review: '.claude/commands/spool/review.md',
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: Spool: Proposal
description: Scaffold a new Spool change and validate strictly.
category: Spool
tags: [spool, change]
---`,
  apply: `---
name: Spool: Apply
description: Implement an approved Spool change and keep tasks in sync.
category: Spool
tags: [spool, apply]
---`,
  archive: `---
name: Spool: Archive
description: Archive a deployed Spool change and update specs.
category: Spool
tags: [spool, archive]
---`,
  research: `---
name: Spool: Research
description: Conduct research via Spool skills (stack, architecture, features, pitfalls).
category: Spool
tags: [spool, research]
---`,
  review: `---
name: Spool: Review
description: Conduct adversarial review via Spool review skill.
category: Spool
tags: [spool, review]
---`,
};

export class ClaudeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'claude';
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
