import { SlashCommandConfigurator, EXTENDED_COMMANDS } from "./base.js";
import { SlashCommandId } from "../../templates/index.js";
import { FileSystemUtils } from "../../../utils/file-system.js";
import { PROJECTOR_MARKERS } from "../../config.js";

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: ".opencode/command/projector-proposal.md",
  apply: ".opencode/command/projector-apply.md",
  archive: ".opencode/command/projector-archive.md",
  'research': ".opencode/command/projector-research.md",
  'research-stack': ".opencode/command/projector-research-stack.md",
  'research-features': ".opencode/command/projector-research-features.md",
  'research-architecture': ".opencode/command/projector-research-architecture.md",
  'research-pitfalls': ".opencode/command/projector-research-pitfalls.md",
  'review': ".opencode/command/projector-review.md",
  'review-security': ".opencode/command/projector-review-security.md",
  'review-scale': ".opencode/command/projector-review-scale.md",
  'review-edge': ".opencode/command/projector-review-edge.md",
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: Scaffold a new Projector change and validate strictly.
---
The user has requested the following change proposal. Use the projector instructions to create their change proposal.
<UserRequest>
  $ARGUMENTS
</UserRequest>
`,
  apply: `---
description: Implement an approved Projector change and keep tasks in sync.
---
The user has requested to implement the following change proposal. Find the change proposal and follow the instructions below. If you're not sure or if ambiguous, ask for clarification from the user.
<UserRequest>
  $ARGUMENTS
</UserRequest>
`,
  archive: `---
description: Archive a deployed Projector change and update specs.
---
<ChangeId>
  $ARGUMENTS
</ChangeId>
`,
  'research': `---
description: Conduct comprehensive domain research (parallel investigations + synthesis).
---
Conduct full domain research for the following topic. Run stack, features, architecture, and pitfalls investigations, then synthesize findings.
<Topic>
  $ARGUMENTS
</Topic>
`,
  'research-stack': `---
description: Research technology stack options and recommendations.
---
Research the technology stack for the following topic. Write findings to projector/research/investigations/stack-analysis.md.
<Topic>
  $ARGUMENTS
</Topic>
`,
  'research-features': `---
description: Map feature landscape and prioritize capabilities.
---
Research the feature landscape for the following topic. Write findings to projector/research/investigations/feature-landscape.md.
<Topic>
  $ARGUMENTS
</Topic>
`,
  'research-architecture': `---
description: Research architecture patterns and design decisions.
---
Research architecture patterns for the following topic. Write findings to projector/research/investigations/architecture.md.
<Topic>
  $ARGUMENTS
</Topic>
`,
  'research-pitfalls': `---
description: Identify common pitfalls and mitigation strategies.
---
Research common pitfalls for the following topic. Write findings to projector/research/investigations/pitfalls.md.
<Topic>
  $ARGUMENTS
</Topic>
`,
  'review': `---
description: Conduct adversarial review (security, scale, edge cases) of a change.
---
Conduct full adversarial review for the following change. Run security, scale, and edge case reviews, then compile findings.
<ChangeId>
  $ARGUMENTS
</ChangeId>
`,
  'review-security': `---
description: Security review - find vulnerabilities and attack vectors.
---
Perform a security review for the following change. Write findings to projector/changes/<id>/reviews/security.md.
<ChangeId>
  $ARGUMENTS
</ChangeId>
`,
  'review-scale': `---
description: Scale review - identify performance bottlenecks.
---
Perform a scale review for the following change. Write findings to projector/changes/<id>/reviews/scale.md.
<ChangeId>
  $ARGUMENTS
</ChangeId>
`,
  'review-edge': `---
description: Edge case review - find boundary conditions and failure modes.
---
Perform an edge case review for the following change. Write findings to projector/changes/<id>/reviews/edge-cases.md.
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

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    return FRONTMATTER[id];
  }

  async generateAll(projectPath: string, _projectorDir: string): Promise<string[]> {
    const createdOrUpdated = await super.generateAll(projectPath, _projectorDir);
    await this.rewriteArchiveFile(projectPath);
    return createdOrUpdated;
  }

  async updateExisting(projectPath: string, _projectorDir: string): Promise<string[]> {
    const updated = await super.updateExisting(projectPath, _projectorDir);
    const rewroteArchive = await this.rewriteArchiveFile(projectPath);
    if (rewroteArchive && !updated.includes(FILE_PATHS.archive)) {
      updated.push(FILE_PATHS.archive);
    }
    return updated;
  }

  private async rewriteArchiveFile(projectPath: string): Promise<boolean> {
    const archivePath = FileSystemUtils.joinPath(projectPath, FILE_PATHS.archive);
    if (!await FileSystemUtils.fileExists(archivePath)) {
      return false;
    }

    const body = this.getBody("archive");
    const frontmatter = this.getFrontmatter("archive");
    const sections: string[] = [];

    if (frontmatter) {
      sections.push(frontmatter.trim());
    }

    sections.push(`${PROJECTOR_MARKERS.start}\n${body}\n${PROJECTOR_MARKERS.end}`);
    await FileSystemUtils.writeFile(archivePath, sections.join("\n") + "\n");
    return true;
  }
}
