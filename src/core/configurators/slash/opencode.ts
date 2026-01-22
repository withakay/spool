import { SlashCommandConfigurator, EXTENDED_COMMANDS } from "./base.js";
import { SlashCommandId } from "../../templates/index.js";
import { replaceHardcodedSpoolPaths } from "../../../utils/path-normalization.js";
import { FileSystemUtils } from "../../../utils/file-system.js";

const OPENCODE_COMMANDS_PATH = ".opencode/command";

// Legacy path that was incorrectly used (plural instead of singular)
const LEGACY_COMMANDS_PATH = ".opencode/commands";
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

  /**
   * Override generateAll to migrate from legacy plural path (.opencode/commands/)
   * to the correct singular path (.opencode/command/).
   */
  async generateAll(projectPath: string, spoolDir: string): Promise<string[]> {
    // First, clean up any legacy files at the old plural path
    await this.cleanupLegacyFiles(projectPath);
    
    // Then generate files at the correct singular path
    return super.generateAll(projectPath, spoolDir);
  }

  /**
   * Override updateExisting to also check for and migrate legacy files.
   */
  async updateExisting(projectPath: string, spoolDir: string): Promise<string[]> {
    // First, migrate any legacy files
    await this.migrateLegacyFiles(projectPath, spoolDir);
    
    // Then update files at the correct path
    return super.updateExisting(projectPath, spoolDir);
  }

  /**
   * Remove legacy slash command files at .opencode/commands/ (plural).
   */
  private async cleanupLegacyFiles(projectPath: string): Promise<void> {
    for (const id of this.getSupportedCommands()) {
      const legacyPath = FileSystemUtils.joinPath(
        projectPath,
        LEGACY_COMMANDS_PATH,
        `spool-${id}.md`
      );
      if (await FileSystemUtils.fileExists(legacyPath)) {
        await FileSystemUtils.deleteFile(legacyPath);
      }
    }
    
    // Try to remove the legacy directory if it's empty
    const legacyDir = FileSystemUtils.joinPath(projectPath, LEGACY_COMMANDS_PATH);
    await this.removeDirectoryIfEmpty(legacyDir);
  }

  /**
   * Migrate legacy files from .opencode/commands/ to .opencode/command/.
   * If a file exists at the legacy path but not at the correct path, move it.
   */
  private async migrateLegacyFiles(projectPath: string, spoolDir: string): Promise<void> {
    for (const target of this.getTargets()) {
      const correctPath = FileSystemUtils.joinPath(projectPath, target.path);
      const legacyPath = FileSystemUtils.joinPath(
        projectPath,
        LEGACY_COMMANDS_PATH,
        `spool-${target.id}.md`
      );

      // If file exists at legacy path but not at correct path, generate at correct path
      if (await FileSystemUtils.fileExists(legacyPath)) {
        if (!(await FileSystemUtils.fileExists(correctPath))) {
          // Generate new file at correct path (don't copy - regenerate to ensure latest content)
          const body = this.getBody(target.id, spoolDir);
          const content = this.buildFullFileContent(target.id, body, spoolDir);
          await FileSystemUtils.writeFile(correctPath, content);
        }
        // Delete the legacy file
        await FileSystemUtils.deleteFile(legacyPath);
      }
    }
    
    // Try to remove the legacy directory if it's empty
    const legacyDir = FileSystemUtils.joinPath(projectPath, LEGACY_COMMANDS_PATH);
    await this.removeDirectoryIfEmpty(legacyDir);
  }

  /**
   * Remove a directory if it exists and is empty.
   */
  private async removeDirectoryIfEmpty(dirPath: string): Promise<void> {
    try {
      if (await FileSystemUtils.directoryExists(dirPath)) {
        const entries = await FileSystemUtils.readDirectory(dirPath);
        if (entries.length === 0) {
          await FileSystemUtils.deleteDirectory(dirPath);
        }
      }
    } catch {
      // Ignore errors - directory might not exist or might not be empty
    }
  }
}
