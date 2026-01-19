import path from 'path';
import { FileSystemUtils } from '../utils/file-system.js';
import { ToolRegistry } from './configurators/registry.js';
import { SlashCommandRegistry } from './configurators/slash/registry.js';
import { agentsTemplate } from './templates/agents-template.js';
import { getSpoolPath, getSpoolDirName } from './project-config.js';

export class UpdateCommand {
  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);
    const spoolDirName = getSpoolDirName(resolvedProjectPath);
    const spoolPath = getSpoolPath(resolvedProjectPath);

    // 1. Check spool directory exists
    if (!await FileSystemUtils.directoryExists(spoolPath)) {
      throw new Error(`No Spool directory found. Run 'spool init' first.`);
    }

    // 2. Update AGENTS.md (full replacement)
    const agentsPath = path.join(spoolPath, 'AGENTS.md');

    await FileSystemUtils.writeFile(agentsPath, agentsTemplate({ spoolDir: spoolDirName }));

    // 3. Update existing AI tool configuration files only
    const configurators = ToolRegistry.getAll();
    const slashConfigurators = SlashCommandRegistry.getAll();
    const updatedFiles: string[] = [];
    const createdFiles: string[] = [];
    const failedFiles: string[] = [];
    const updatedSlashFiles: string[] = [];
    const failedSlashTools: string[] = [];

    for (const configurator of configurators) {
      const configFilePath = path.join(
        resolvedProjectPath,
        configurator.configFileName
      );
      const fileExists = await FileSystemUtils.fileExists(configFilePath);
      const shouldConfigure =
        fileExists || configurator.configFileName === 'AGENTS.md';

      if (!shouldConfigure) {
        continue;
      }

      try {
        if (fileExists && !await FileSystemUtils.canWriteFile(configFilePath)) {
          throw new Error(
            `Insufficient permissions to modify ${configurator.configFileName}`
          );
        }

        await configurator.configure(resolvedProjectPath, spoolPath);
        updatedFiles.push(configurator.configFileName);

        if (!fileExists) {
          createdFiles.push(configurator.configFileName);
        }
      } catch (error) {
        failedFiles.push(configurator.configFileName);
        console.error(
          `Failed to update ${configurator.configFileName}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    for (const slashConfigurator of slashConfigurators) {
      if (!slashConfigurator.isAvailable) {
        continue;
      }

      try {
        const updated = await slashConfigurator.updateExisting(
          resolvedProjectPath,
          spoolPath
        );
        updatedSlashFiles.push(...updated);
      } catch (error) {
        failedSlashTools.push(slashConfigurator.toolId);
        console.error(
          `Failed to update slash commands for ${slashConfigurator.toolId}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    const summaryParts: string[] = [];
    const instructionFiles: string[] = [`${spoolDirName}/AGENTS.md`];

    if (updatedFiles.includes('AGENTS.md')) {
      instructionFiles.push(
        createdFiles.includes('AGENTS.md') ? 'AGENTS.md (created)' : 'AGENTS.md'
      );
    }

    summaryParts.push(
      `Updated Spool instructions (${instructionFiles.join(', ')})`
    );

    const aiToolFiles = updatedFiles.filter((file) => file !== 'AGENTS.md');
    if (aiToolFiles.length > 0) {
      summaryParts.push(`Updated AI tool files: ${aiToolFiles.join(', ')}`);
    }

    if (updatedSlashFiles.length > 0) {
      // Normalize to forward slashes for cross-platform log consistency
      const normalized = updatedSlashFiles.map((p) => FileSystemUtils.toPosixPath(p));
      summaryParts.push(`Updated slash commands: ${normalized.join(', ')}`);
    }

    const failedItems = [
      ...failedFiles,
      ...failedSlashTools.map(
        (toolId) => `slash command refresh (${toolId})`
      ),
    ];

    if (failedItems.length > 0) {
      summaryParts.push(`Failed to update: ${failedItems.join(', ')}`);
    }

    console.log(summaryParts.join(' | '));

    // No additional notes
  }
}
