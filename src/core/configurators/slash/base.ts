import { FileSystemUtils } from '../../../utils/file-system.js';
import { TemplateManager, SlashCommandId } from '../../templates/index.js';
import { SPOOL_MARKERS } from '../../config.js';

export interface SlashCommandTarget {
  id: SlashCommandId;
  path: string;
  kind: 'slash';
}

// Core commands that all tools support
const CORE_COMMANDS: SlashCommandId[] = ['proposal', 'apply', 'archive'];

// Extended commands for tools with research/review support
export const EXTENDED_COMMANDS: SlashCommandId[] = [
  ...CORE_COMMANDS,
  'research',
  'review',
  'spool',
];

export abstract class SlashCommandConfigurator {
  abstract readonly toolId: string;
  abstract readonly isAvailable: boolean;

  // Override this in subclasses that support extended commands
  protected getSupportedCommands(): SlashCommandId[] {
    return CORE_COMMANDS;
  }

  getTargets(): SlashCommandTarget[] {
    return this.getSupportedCommands().map((id) => ({
      id,
      path: this.getRelativePath(id),
      kind: 'slash'
    }));
  }

  async generateAll(projectPath: string, spoolDir: string): Promise<string[]> {
    const createdOrUpdated: string[] = [];

    for (const target of this.getTargets()) {
      const body = this.getBody(target.id, spoolDir);
      const filePath = FileSystemUtils.joinPath(projectPath, target.path);

      if (await FileSystemUtils.fileExists(filePath)) {
        await this.rewriteFullFile(filePath, target.id, body, spoolDir);
      } else {
        const content = this.buildFullFileContent(target.id, body, spoolDir);
        await FileSystemUtils.writeFile(filePath, content);
      }

      createdOrUpdated.push(target.path);
    }

    return createdOrUpdated;
  }

   async updateExisting(projectPath: string, spoolDir: string): Promise<string[]> {
     const updated: string[] = [];

     for (const target of this.getTargets()) {
       const filePath = FileSystemUtils.joinPath(projectPath, target.path);
       if (await FileSystemUtils.fileExists(filePath)) {
         const body = this.getBody(target.id, spoolDir);
         await this.rewriteFullFile(filePath, target.id, body, spoolDir);
         updated.push(target.path);
       }
     }

     return updated;
   }


  protected abstract getRelativePath(id: SlashCommandId): string;
  protected abstract getFrontmatter(id: SlashCommandId, spoolDir?: string): string | undefined;

  protected getBody(id: SlashCommandId, spoolDir: string = '.spool'): string {
    return TemplateManager.getSlashCommandBody(id, spoolDir).trim();
  }

  // Resolve absolute path for a given slash command target. Subclasses may override
  // to redirect to tool-specific locations (e.g., global directories).
  resolveAbsolutePath(projectPath: string, id: SlashCommandId): string {
    const rel = this.getRelativePath(id);
    return FileSystemUtils.joinPath(projectPath, rel);
  }

   protected buildFullFileContent(id: SlashCommandId, body: string, spoolDir: string): string {
     const frontmatter = this.getFrontmatter(id, spoolDir);
     const sections: string[] = [];

     if (frontmatter) {
       sections.push(frontmatter.trim());
     }

     sections.push(`${SPOOL_MARKERS.start}\n${body}\n${SPOOL_MARKERS.end}`);
     return sections.join('\n') + '\n';
   }

   protected async rewriteFullFile(filePath: string, id: SlashCommandId, body: string, spoolDir: string): Promise<void> {
     const existing = await FileSystemUtils.readFile(filePath);
     const startIndex = existing.indexOf(SPOOL_MARKERS.start);
     const endIndex = existing.indexOf(SPOOL_MARKERS.end);

     if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
       throw new Error(`Missing Spool markers in ${filePath}`);
     }

     const updatedContent = this.buildFullFileContent(id, body, spoolDir);
     await FileSystemUtils.writeFile(filePath, updatedContent);
   }

}
