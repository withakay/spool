import { SlashCommandConfigurator, EXTENDED_COMMANDS } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.claude/commands/openspec/proposal.md',
  apply: '.claude/commands/openspec/apply.md',
  archive: '.claude/commands/openspec/archive.md',
  'research': '.claude/commands/openspec/research.md',
  'research-stack': '.claude/commands/openspec/research-stack.md',
  'research-features': '.claude/commands/openspec/research-features.md',
  'research-architecture': '.claude/commands/openspec/research-architecture.md',
  'research-pitfalls': '.claude/commands/openspec/research-pitfalls.md',
  'review': '.claude/commands/openspec/review.md',
  'review-security': '.claude/commands/openspec/review-security.md',
  'review-scale': '.claude/commands/openspec/review-scale.md',
  'review-edge': '.claude/commands/openspec/review-edge.md',
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: OpenSpec: Proposal
description: Scaffold a new OpenSpec change and validate strictly.
category: OpenSpec
tags: [openspec, change]
---`,
  apply: `---
name: OpenSpec: Apply
description: Implement an approved OpenSpec change and keep tasks in sync.
category: OpenSpec
tags: [openspec, apply]
---`,
  archive: `---
name: OpenSpec: Archive
description: Archive a deployed OpenSpec change and update specs.
category: OpenSpec
tags: [openspec, archive]
---`,
  'research': `---
name: OpenSpec: Research
description: Conduct comprehensive domain research (parallel investigations + synthesis).
category: OpenSpec
tags: [openspec, research]
---`,
  'research-stack': `---
name: OpenSpec: Research Stack
description: Research technology stack options and recommendations.
category: OpenSpec
tags: [openspec, research]
---`,
  'research-features': `---
name: OpenSpec: Research Features
description: Map feature landscape and prioritize capabilities.
category: OpenSpec
tags: [openspec, research]
---`,
  'research-architecture': `---
name: OpenSpec: Research Architecture
description: Research architecture patterns and design decisions.
category: OpenSpec
tags: [openspec, research]
---`,
  'research-pitfalls': `---
name: OpenSpec: Research Pitfalls
description: Identify common pitfalls and mitigation strategies.
category: OpenSpec
tags: [openspec, research]
---`,
  'review': `---
name: OpenSpec: Review
description: Conduct adversarial review (security, scale, edge cases) of a change.
category: OpenSpec
tags: [openspec, review]
---`,
  'review-security': `---
name: OpenSpec: Review Security
description: Security review - find vulnerabilities and attack vectors.
category: OpenSpec
tags: [openspec, review]
---`,
  'review-scale': `---
name: OpenSpec: Review Scale
description: Scale review - identify performance bottlenecks.
category: OpenSpec
tags: [openspec, review]
---`,
  'review-edge': `---
name: OpenSpec: Review Edge Cases
description: Edge case review - find boundary conditions and failure modes.
category: OpenSpec
tags: [openspec, review]
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
