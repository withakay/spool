import { SlashCommandConfigurator, EXTENDED_COMMANDS } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.claude/commands/projector/proposal.md',
  apply: '.claude/commands/projector/apply.md',
  archive: '.claude/commands/projector/archive.md',
  'research': '.claude/commands/projector/research.md',
  'research-stack': '.claude/commands/projector/research-stack.md',
  'research-features': '.claude/commands/projector/research-features.md',
  'research-architecture': '.claude/commands/projector/research-architecture.md',
  'research-pitfalls': '.claude/commands/projector/research-pitfalls.md',
  'review': '.claude/commands/projector/review.md',
  'review-security': '.claude/commands/projector/review-security.md',
  'review-scale': '.claude/commands/projector/review-scale.md',
  'review-edge': '.claude/commands/projector/review-edge.md',
};

const FRONTMATTER: Record<SlashCommandId, string> = {
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
---`,
  'research': `---
name: Projector: Research
description: Conduct comprehensive domain research (parallel investigations + synthesis).
category: Projector
tags: [projector, research]
---`,
  'research-stack': `---
name: Projector: Research Stack
description: Research technology stack options and recommendations.
category: Projector
tags: [projector, research]
---`,
  'research-features': `---
name: Projector: Research Features
description: Map feature landscape and prioritize capabilities.
category: Projector
tags: [projector, research]
---`,
  'research-architecture': `---
name: Projector: Research Architecture
description: Research architecture patterns and design decisions.
category: Projector
tags: [projector, research]
---`,
  'research-pitfalls': `---
name: Projector: Research Pitfalls
description: Identify common pitfalls and mitigation strategies.
category: Projector
tags: [projector, research]
---`,
  'review': `---
name: Projector: Review
description: Conduct adversarial review (security, scale, edge cases) of a change.
category: Projector
tags: [projector, review]
---`,
  'review-security': `---
name: Projector: Review Security
description: Security review - find vulnerabilities and attack vectors.
category: Projector
tags: [projector, review]
---`,
  'review-scale': `---
name: Projector: Review Scale
description: Scale review - identify performance bottlenecks.
category: Projector
tags: [projector, review]
---`,
  'review-edge': `---
name: Projector: Review Edge Cases
description: Edge case review - find boundary conditions and failure modes.
category: Projector
tags: [projector, review]
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
