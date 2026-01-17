import { FileSystemUtils } from '../../../utils/file-system.js';
import { TemplateManager, SlashCommandId } from '../../templates/index.js';
import { PROJECTOR_MARKERS } from '../../config.js';

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
  'research-stack',
  'research-features',
  'research-architecture',
  'research-pitfalls',
  'review',
  'review-security',
  'review-scale',
  'review-edge',
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

  async generateAll(projectPath: string, _projectorDir: string): Promise<string[]> {
    const createdOrUpdated: string[] = [];

    for (const target of this.getTargets()) {
      const body = this.getBody(target.id);
      const filePath = FileSystemUtils.joinPath(projectPath, target.path);

      if (await FileSystemUtils.fileExists(filePath)) {
        await this.updateBody(filePath, body);
      } else {
        const frontmatter = this.getFrontmatter(target.id);
        const sections: string[] = [];
        if (frontmatter) {
          sections.push(frontmatter.trim());
        }
        sections.push(`${PROJECTOR_MARKERS.start}\n${body}\n${PROJECTOR_MARKERS.end}`);
        const content = sections.join('\n') + '\n';
        await FileSystemUtils.writeFile(filePath, content);
      }

      createdOrUpdated.push(target.path);
    }

    return createdOrUpdated;
  }

  async updateExisting(projectPath: string, _projectorDir: string): Promise<string[]> {
    const updated: string[] = [];

    for (const target of this.getTargets()) {
      const filePath = FileSystemUtils.joinPath(projectPath, target.path);
      if (await FileSystemUtils.fileExists(filePath)) {
        const body = this.getBody(target.id);
        await this.updateBody(filePath, body);
        updated.push(target.path);
      }
    }

    return updated;
  }

  protected abstract getRelativePath(id: SlashCommandId): string;
  protected abstract getFrontmatter(id: SlashCommandId): string | undefined;

  protected getBody(id: SlashCommandId): string {
    return TemplateManager.getSlashCommandBody(id).trim();
  }

  // Resolve absolute path for a given slash command target. Subclasses may override
  // to redirect to tool-specific locations (e.g., global directories).
  resolveAbsolutePath(projectPath: string, id: SlashCommandId): string {
    const rel = this.getRelativePath(id);
    return FileSystemUtils.joinPath(projectPath, rel);
  }

  protected async updateBody(filePath: string, body: string): Promise<void> {
    const content = await FileSystemUtils.readFile(filePath);
    const startIndex = content.indexOf(PROJECTOR_MARKERS.start);
    const endIndex = content.indexOf(PROJECTOR_MARKERS.end);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      throw new Error(`Missing Projector markers in ${filePath}`);
    }

    const before = content.slice(0, startIndex + PROJECTOR_MARKERS.start.length);
    const after = content.slice(endIndex);
    const updatedContent = `${before}\n${body}\n${after}`;

    await FileSystemUtils.writeFile(filePath, updatedContent);
  }
}
