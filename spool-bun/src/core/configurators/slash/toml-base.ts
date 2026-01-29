import { FileSystemUtils } from '../../../utils/file-system.js';
import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';
import { SPOOL_MARKERS } from '../../config.js';

export abstract class TomlSlashCommandConfigurator extends SlashCommandConfigurator {
  protected getFrontmatter(_id: SlashCommandId): string | undefined {
    // TOML doesn't use separate frontmatter - it's all in one structure
    return undefined;
  }

  protected abstract getDescription(id: SlashCommandId): string;

  // Override to generate TOML format with markers inside the prompt field
  async generateAll(projectPath: string, _spoolDir: string): Promise<string[]> {
    const createdOrUpdated: string[] = [];

    for (const target of this.getTargets()) {
      const body = this.getBody(target.id);
      const filePath = FileSystemUtils.joinPath(projectPath, target.path);

      if (await FileSystemUtils.fileExists(filePath)) {
        await this.updateBody(filePath, target.id, body);
      } else {
        const tomlContent = this.generateTOML(target.id, body);
        await FileSystemUtils.writeFile(filePath, tomlContent);
      }

      createdOrUpdated.push(target.path);
    }

    return createdOrUpdated;
  }

  private generateTOML(id: SlashCommandId, body: string): string {
    const description = this.getDescription(id);

    // TOML format with triple-quoted string for multi-line prompt
    // Markers are inside the prompt value
    return `description = "${description}"

prompt = """
${SPOOL_MARKERS.start}
${body}
${SPOOL_MARKERS.end}
"""
`;
  }

  // Override updateBody to handle TOML format
  protected async updateBody(filePath: string, id: SlashCommandId, body: string): Promise<void> {
    const content = await FileSystemUtils.readFile(filePath);
    const startIndex = content.indexOf(SPOOL_MARKERS.start);
    const endIndex = content.indexOf(SPOOL_MARKERS.end);

    // If markers are missing, treat this as a legacy/unmanaged file and
    // overwrite it with the canonical Spool-managed TOML structure.
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      const tomlContent = this.generateTOML(id, body);
      await FileSystemUtils.writeFile(filePath, tomlContent);
      return;
    }

    const before = content.slice(0, startIndex + SPOOL_MARKERS.start.length);
    const after = content.slice(endIndex);
    const updatedContent = `${before}\n${body}\n${after}`;

    await FileSystemUtils.writeFile(filePath, updatedContent);
  }
}
