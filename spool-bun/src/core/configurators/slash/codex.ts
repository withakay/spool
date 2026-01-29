import path from 'path';
import os from 'os';
import { SlashCommandConfigurator, EXTENDED_COMMANDS } from './base.js';
import { SlashCommandId, TemplateManager } from '../../templates/index.js';
import { FileSystemUtils } from '../../../utils/file-system.js';
import { SPOOL_MARKERS } from '../../config.js';

// Use POSIX-style paths for consistent logging across platforms.
const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.codex/prompts/spool-proposal.md',
  apply: '.codex/prompts/spool-apply.md',
  archive: '.codex/prompts/spool-archive.md',
  research: '.codex/prompts/spool-research.md',
  review: '.codex/prompts/spool-review.md',
  spool: '.codex/prompts/spool.md',
};

export class CodexSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'codex';
  readonly isAvailable = true;

  protected getSupportedCommands(): SlashCommandId[] {
    return EXTENDED_COMMANDS;
  }

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    // Codex supports YAML frontmatter with description and argument-hint fields,
    // plus $ARGUMENTS to capture all arguments as a single string.
    const frontmatter: Record<SlashCommandId, string> = {
      proposal: `---
 description: Scaffold a new Spool change and validate strictly.
 argument-hint: request or feature description
 ---
 
 $ARGUMENTS`,
      apply: `---
 description: Implement an approved Spool change and keep tasks in sync.
 argument-hint: change-id
 ---
 
 $ARGUMENTS`,
      archive: `---
 description: Archive a deployed Spool change and update specs.
 argument-hint: change-id
 ---
 
 $ARGUMENTS`,
      research: `---
 description: Conduct Spool research via skills (stack, architecture, features, pitfalls).
 argument-hint: topic to research
 ---
 
 $ARGUMENTS`,
      review: `---
 description: Conduct adversarial review via Spool review skill.
 argument-hint: change-id
 ---
 
 $ARGUMENTS`,
      spool: `---
 description: Route spool commands via the spool skill (skill-first, CLI fallback).
 argument-hint: spool command
 ---
 
 $ARGUMENTS`,
    };

    return frontmatter[id];
  }

  private getGlobalPromptsDir(): string {
    const home =
      process.env.CODEX_HOME && process.env.CODEX_HOME.trim()
        ? process.env.CODEX_HOME.trim()
        : FileSystemUtils.joinPath(os.homedir(), '.codex');
    return FileSystemUtils.joinPath(home, 'prompts');
  }

  // Codex discovers prompts globally. Generate directly in the global directory
  // and wrap shared body with markers.
  async generateAll(projectPath: string, _spoolDir: string): Promise<string[]> {
    const createdOrUpdated: string[] = [];
    for (const target of this.getTargets()) {
      const body = TemplateManager.getSlashCommandBody(target.id).trim();
      const promptsDir = this.getGlobalPromptsDir();
      const filePath = FileSystemUtils.joinPath(promptsDir, path.basename(target.path));

      await FileSystemUtils.createDirectory(path.dirname(filePath));

      if (await FileSystemUtils.fileExists(filePath)) {
        await this.updateFullFile(filePath, target.id, body);
      } else {
        const frontmatter = this.getFrontmatter(target.id);
        const sections: string[] = [];
        if (frontmatter) sections.push(frontmatter.trim());
        sections.push(`${SPOOL_MARKERS.start}\n${body}\n${SPOOL_MARKERS.end}`);
        await FileSystemUtils.writeFile(filePath, sections.join('\n') + '\n');
      }

      createdOrUpdated.push(target.path);
    }
    return createdOrUpdated;
  }

  async updateExisting(projectPath: string, _spoolDir: string): Promise<string[]> {
    const updated: string[] = [];
    for (const target of this.getTargets()) {
      const promptsDir = this.getGlobalPromptsDir();
      const filePath = FileSystemUtils.joinPath(promptsDir, path.basename(target.path));
      if (await FileSystemUtils.fileExists(filePath)) {
        const body = TemplateManager.getSlashCommandBody(target.id).trim();
        await this.updateFullFile(filePath, target.id, body);
        updated.push(target.path);
      }
    }
    return updated;
  }

  // Update both frontmatter and body in an existing file
  private async updateFullFile(filePath: string, id: SlashCommandId, body: string): Promise<void> {
    const content = await FileSystemUtils.readFile(filePath);
    const startIndex = content.indexOf(SPOOL_MARKERS.start);

    if (startIndex === -1) {
      throw new Error(`Missing Spool start marker in ${filePath}`);
    }

    // Replace everything before the start marker with the new frontmatter
    const frontmatter = this.getFrontmatter(id);
    const sections: string[] = [];
    if (frontmatter) sections.push(frontmatter.trim());
    sections.push(`${SPOOL_MARKERS.start}\n${body}\n${SPOOL_MARKERS.end}`);

    await FileSystemUtils.writeFile(filePath, sections.join('\n') + '\n');
  }

  // Resolve to the global prompts location for configuration detection
  resolveAbsolutePath(_projectPath: string, id: SlashCommandId): string {
    const promptsDir = this.getGlobalPromptsDir();
    const fileName = path.basename(FILE_PATHS[id]);
    return FileSystemUtils.joinPath(promptsDir, fileName);
  }
}
