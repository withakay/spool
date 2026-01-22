import { SlashCommandConfigurator, EXTENDED_COMMANDS } from "./base.js";
import { SlashCommandId } from "../../templates/index.js";
import { replaceHardcodedSpoolPaths } from "../../../utils/path-normalization.js";

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: ".opencode/commands/spool-proposal.md",
  apply: ".opencode/commands/spool-apply.md",
  archive: ".opencode/commands/spool-archive.md",
  research: ".opencode/commands/spool-research.md",
  review: ".opencode/commands/spool-review.md",
};

const FRONTMATTER_TEMPLATES: Record<SlashCommandId, string> = {
  proposal: `---
description: Scaffold a new Spool change and validate strictly.
---
The user has requested the following change proposal. Use the Spool skill to create their proposal.
<UserRequest>
  $ARGUMENTS
</UserRequest>
`,
  apply: `---
description: Implement an approved Spool change and keep tasks in sync.
---
The user has requested to implement the following change proposal. Follow the Spool skill instructions.
<UserRequest>
  $ARGUMENTS
</UserRequest>
`,
  archive: `---
description: Archive a deployed Spool change and update specs.
---
<ChangeId>
  $ARGUMENTS
</ChangeId>
`,
  research: `---
description: Conduct Spool research via skills (stack, architecture, features, pitfalls).
---
Conduct Spool research for the following topic. The prompt may include a focus like stack, architecture, features, or pitfalls.
Write findings under spool/research/investigations/ as directed by the skill.
<Topic>
  $ARGUMENTS
</Topic>
`,
  review: `---
description: Conduct adversarial review via Spool review skill.
---
Review the following change or scope using the Spool review skill instructions.
<ChangeId>
  $ARGUMENTS
</ChangeId>
`,
};


export class OpenCodeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = "opencode";
  readonly isAvailable = true;

  protected getSupportedCommands(): SlashCommandId[] {
    return EXTENDED_COMMANDS;
  }

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId, spoolDir: string = '.spool'): string | undefined {
    const template = FRONTMATTER_TEMPLATES[id];
    if (!template) {
      return undefined;
    }
    
    // Replace hardcoded 'spool/' paths with the configured spoolDir
    return replaceHardcodedSpoolPaths(template, spoolDir);
  }

}
