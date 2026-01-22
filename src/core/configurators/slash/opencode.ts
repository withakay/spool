import { SlashCommandConfigurator, EXTENDED_COMMANDS } from "./base.js";
import { SlashCommandId } from "../../templates/index.js";
import { replaceHardcodedSpoolPaths } from "../../../utils/path-normalization.js";

const OPENCODE_COMMANDS_PATH = ".opencode/command";
const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: `${OPENCODE_COMMANDS_PATH}/spool-proposal.md`,
  apply: `${OPENCODE_COMMANDS_PATH}/spool-apply.md`,
  archive: `${OPENCODE_COMMANDS_PATH}/spool-archive.md`,
  research: `${OPENCODE_COMMANDS_PATH}/spool-research.md`,
  review: `${OPENCODE_COMMANDS_PATH}/spool-review.md`,
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
