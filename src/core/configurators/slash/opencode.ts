import { SlashCommandConfigurator, EXTENDED_COMMANDS } from "./base.js";
import { SlashCommandId } from "../../templates/index.js";
import { FileSystemUtils } from "../../../utils/file-system.js";
import { SPOOL_MARKERS } from "../../config.js";
import { replaceHardcodedSpoolPaths } from "../../../utils/path-normalization.js";

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: ".opencode/command/spool-proposal.md",
  apply: ".opencode/command/spool-apply.md",
  archive: ".opencode/command/spool-archive.md",
  research: ".opencode/command/spool-research.md",
  review: ".opencode/command/spool-review.md",
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

  async generateAll(projectPath: string, spoolDir: string): Promise<string[]> {
    const createdOrUpdated = await super.generateAll(projectPath, spoolDir);
    await this.rewriteArchiveFile(projectPath, spoolDir);
    return createdOrUpdated;
  }

  async updateExisting(projectPath: string, spoolDir: string): Promise<string[]> {
    const updated = await super.updateExisting(projectPath, spoolDir);
    const rewroteArchive = await this.rewriteArchiveFile(projectPath, spoolDir);
    if (rewroteArchive && !updated.includes(FILE_PATHS.archive)) {
      updated.push(FILE_PATHS.archive);
    }
    return updated;
  }

  private async rewriteArchiveFile(projectPath: string, spoolDir: string = '.spool'): Promise<boolean> {
    const archivePath = FileSystemUtils.joinPath(projectPath, FILE_PATHS.archive);
    if (!await FileSystemUtils.fileExists(archivePath)) {
      return false;
    }

    const body = this.getBody("archive", spoolDir);
    const frontmatter = this.getFrontmatter("archive", spoolDir);
    const sections: string[] = [];

    if (frontmatter) {
      sections.push(frontmatter.trim());
    }

    sections.push(`${SPOOL_MARKERS.start}\n${body}\n${SPOOL_MARKERS.end}`);
    await FileSystemUtils.writeFile(archivePath, sections.join("\n") + "\n");
    return true;
  }
}
