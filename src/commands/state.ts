import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { FileSystemUtils } from '../utils/file-system.js';
import { getProjectorDirName } from '../core/project-config.js';

export class StateCommand {
  private async getStatePath(projectPath: string): Promise<string> {
    const projectorDir = getProjectorDirName(projectPath);
    return path.join(projectPath, projectorDir, 'planning', 'STATE.md');
  }

  private async ensureStateFile(statePath: string): Promise<void> {
    if (!(await FileSystemUtils.fileExists(statePath))) {
      throw new Error(
        'STATE.md not found. Run "projector init" first or create projector/planning/STATE.md'
      );
    }
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').split('.')[0];
  }

  async show(projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const statePath = await this.getStatePath(resolvedPath);

    await this.ensureStateFile(statePath);

    const content = await FileSystemUtils.readFile(statePath);
    console.log(content);
  }

  async addDecision(
    text: string,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const statePath = await this.getStatePath(resolvedPath);

    await this.ensureStateFile(statePath);

    const content = await FileSystemUtils.readFile(statePath);
    const date = this.getCurrentDate();
    const entry = `- ${date}: ${text}`;

    // Find the "## Recent Decisions" section and add the entry
    const updatedContent = this.insertAfterSection(
      content,
      '## Recent Decisions',
      entry
    );

    await FileSystemUtils.writeFile(statePath, updatedContent);
    await this.updateLastUpdated(statePath);

    ora().succeed(chalk.green(`Decision recorded: ${text}`));
  }

  async addBlocker(
    text: string,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const statePath = await this.getStatePath(resolvedPath);

    await this.ensureStateFile(statePath);

    const content = await FileSystemUtils.readFile(statePath);
    const entry = `- ${text}`;

    // Find the "## Blockers" section and add the entry
    let updatedContent = content;

    // Replace "[None currently]" if present
    if (content.includes('[None currently]')) {
      updatedContent = content.replace('[None currently]', entry);
    } else {
      updatedContent = this.insertAfterSection(content, '## Blockers', entry);
    }

    await FileSystemUtils.writeFile(statePath, updatedContent);
    await this.updateLastUpdated(statePath);

    ora().succeed(chalk.green(`Blocker recorded: ${text}`));
  }

  async addNote(
    text: string,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const statePath = await this.getStatePath(resolvedPath);

    await this.ensureStateFile(statePath);

    const content = await FileSystemUtils.readFile(statePath);
    const date = this.getCurrentDate();
    const timestamp = this.getCurrentTimestamp();

    // Check if there's already a session note for today
    const todayHeader = `### ${date}`;

    let updatedContent: string;
    if (content.includes(todayHeader)) {
      // Add to existing today's session
      const entry = `- ${timestamp.split(' ')[1]}: ${text}`;
      updatedContent = this.insertAfterSection(content, todayHeader, entry);
    } else {
      // Create new session section
      const sessionEntry = `### ${date} Session\n- ${timestamp.split(' ')[1]}: ${text}`;
      updatedContent = this.insertAfterSection(
        content,
        '## Session Notes',
        sessionEntry
      );
    }

    await FileSystemUtils.writeFile(statePath, updatedContent);
    await this.updateLastUpdated(statePath);

    ora().succeed(chalk.green(`Note recorded: ${text}`));
  }

  async setFocus(
    text: string,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const statePath = await this.getStatePath(resolvedPath);

    await this.ensureStateFile(statePath);

    const content = await FileSystemUtils.readFile(statePath);

    // Replace the current focus section content
    const focusRegex = /(## Current Focus\n)([^\n#]*)/;
    const updatedContent = content.replace(focusRegex, `$1${text}`);

    await FileSystemUtils.writeFile(statePath, updatedContent);
    await this.updateLastUpdated(statePath);

    ora().succeed(chalk.green(`Focus updated: ${text}`));
  }

  async addQuestion(
    text: string,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const statePath = await this.getStatePath(resolvedPath);

    await this.ensureStateFile(statePath);

    const content = await FileSystemUtils.readFile(statePath);
    const entry = `- [ ] ${text}`;

    const updatedContent = this.insertAfterSection(
      content,
      '## Open Questions',
      entry
    );

    await FileSystemUtils.writeFile(statePath, updatedContent);
    await this.updateLastUpdated(statePath);

    ora().succeed(chalk.green(`Question added: ${text}`));
  }

  private insertAfterSection(
    content: string,
    sectionHeader: string,
    entry: string
  ): string {
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex((line) =>
      line.startsWith(sectionHeader)
    );

    if (sectionIndex === -1) {
      // Section not found, append at the end before "---" divider or at the very end
      const dividerIndex = lines.findIndex((line) => line.trim() === '---');
      if (dividerIndex !== -1) {
        lines.splice(dividerIndex, 0, '', sectionHeader, entry);
      } else {
        lines.push('', sectionHeader, entry);
      }
    } else {
      // Find the next section or end, insert before it
      let insertIndex = sectionIndex + 1;

      // Skip empty lines after header
      while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
        insertIndex++;
      }

      // Insert the new entry
      lines.splice(insertIndex, 0, entry);
    }

    return lines.join('\n');
  }

  private async updateLastUpdated(statePath: string): Promise<void> {
    const content = await FileSystemUtils.readFile(statePath);
    const date = this.getCurrentDate();

    const updatedContent = content.replace(
      /Last Updated: .*/,
      `Last Updated: ${date}`
    );

    await FileSystemUtils.writeFile(statePath, updatedContent);
  }
}
