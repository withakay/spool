import path from 'path';
import { FileSystemUtils } from '../utils/file-system.js';
import { ToolRegistry } from './configurators/registry.js';
import { SlashCommandRegistry } from './configurators/slash/registry.js';
import { SkillsConfigurator, type SkillsHarness } from './configurators/skills.js';
import { agentsTemplate } from './templates/agents-template.js';
import { getSpoolPath, getSpoolDirName } from './project-config.js';
import { SPOOL_MARKERS } from './config.js';

export type UpdateSummary = {
  instructionFiles: string[];
  aiToolFiles: string[];
  slashCommands: string[];
  skills: string[];
  failed: string[];
};

const CORE_SKILL_IDS = [
  'spool',
  'spool-proposal',
  'spool-apply',
  'spool-archive',
  'spool-research',
  'spool-review',
  'spool-commit',
];

const SUPPORTED_SKILL_TOOLS: SkillsHarness[] = [
  'claude',
  'opencode',
  'codex',
  'github-copilot',
];

export class UpdateCommand {
  async execute(projectPath: string, options?: { json?: boolean }): Promise<void> {
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
    const updatedSkills: string[] = [];
    const failedSkillsTools: string[] = [];

    // Helper to check if a file exists and contains Spool markers
    const fileHasMarkers = async (absolutePath: string): Promise<boolean> => {
      try {
        const content = await FileSystemUtils.readFile(absolutePath);
        return content.includes(SPOOL_MARKERS.start) && content.includes(SPOOL_MARKERS.end);
      } catch {
        return false;
      }
    };

    const isToolConfigured = async (toolId: SkillsHarness): Promise<boolean> => {
      // A tool is only considered "configured by Spool" if its files contain Spool markers.
      // For tools with both config files and slash commands, BOTH must have markers.
      // For slash commands, at least one file with markers is sufficient (not all required).

      let hasConfigFile = false;
      let hasSlashCommands = false;

      // Check if the tool has a config file with Spool markers
      const configFile = ToolRegistry.get(toolId)?.configFileName;
      if (configFile) {
        const configPath = path.join(resolvedProjectPath, configFile);
        hasConfigFile =
          (await FileSystemUtils.fileExists(configPath)) && (await fileHasMarkers(configPath));
      }

      // Check if any slash command file exists with Spool markers
      const slashConfigurator = SlashCommandRegistry.get(toolId);
      if (slashConfigurator) {
        for (const target of slashConfigurator.getTargets()) {
          const absolute = slashConfigurator.resolveAbsolutePath(resolvedProjectPath, target.id);
          if ((await FileSystemUtils.fileExists(absolute)) && (await fileHasMarkers(absolute))) {
            hasSlashCommands = true;
            break;
          }
        }
      }

      const hasConfigFileRequirement = configFile !== undefined;
      const hasSlashCommandRequirement = slashConfigurator !== undefined;

      if (hasConfigFileRequirement && hasSlashCommandRequirement) {
        return hasConfigFile && hasSlashCommands;
      }

      if (hasConfigFileRequirement) {
        return hasConfigFile;
      }

      if (hasSlashCommandRequirement) {
        return hasSlashCommands;
      }

      return false;
    };

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

    // 4. Refresh core skills for configured tools
    const skillsConfigurator = new SkillsConfigurator();
    for (const toolId of SUPPORTED_SKILL_TOOLS) {
      try {
        if (!(await isToolConfigured(toolId))) {
          continue;
        }

        await skillsConfigurator.installSkills(resolvedProjectPath, spoolDirName, CORE_SKILL_IDS, toolId);

        const skillsDir = skillsConfigurator.getSkillsDirectory(resolvedProjectPath, toolId);
        const displayPath = skillsDir.startsWith(resolvedProjectPath)
          ? FileSystemUtils.toPosixPath(path.relative(resolvedProjectPath, skillsDir))
          : FileSystemUtils.toPosixPath(skillsDir);
        updatedSkills.push(`${displayPath} (${toolId})`);
      } catch (error) {
        failedSkillsTools.push(toolId);
        console.error(
          `Failed to update skills for ${toolId}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    const instructionFiles: string[] = [`${spoolDirName}/AGENTS.md`];

    if (updatedFiles.includes('AGENTS.md')) {
      instructionFiles.push(
        createdFiles.includes('AGENTS.md') ? 'AGENTS.md (created)' : 'AGENTS.md'
      );
    }

    const aiToolFiles = updatedFiles.filter((file) => file !== 'AGENTS.md');

    // Normalize to forward slashes for cross-platform log consistency
    const slashCommands = updatedSlashFiles.map((p) => FileSystemUtils.toPosixPath(p));

    const failed = [
      ...failedFiles,
      ...failedSlashTools.map((toolId) => `slash command refresh (${toolId})`),
      ...failedSkillsTools.map((toolId) => `skills refresh (${toolId})`),
    ];

    const summary: UpdateSummary = {
      instructionFiles,
      aiToolFiles,
      slashCommands,
      skills: updatedSkills,
      failed,
    };

    if (options?.json) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    const lines: string[] = [];
    lines.push('Spool update complete');
    lines.push('');

    if (summary.instructionFiles.length > 0) {
      lines.push(`Instructions (${summary.instructionFiles.length})`);
      for (const file of summary.instructionFiles) {
        lines.push(`- ${file}`);
      }
      lines.push('');
    }

    if (summary.aiToolFiles.length > 0) {
      lines.push(`AI tool files (${summary.aiToolFiles.length})`);
      for (const file of summary.aiToolFiles) {
        lines.push(`- ${file}`);
      }
      lines.push('');
    }

    if (summary.slashCommands.length > 0) {
      lines.push(`Slash commands (${summary.slashCommands.length})`);
      for (const file of summary.slashCommands) {
        lines.push(`- ${file}`);
      }
      lines.push('');
    }

    if (summary.skills.length > 0) {
      lines.push(`Skills (${summary.skills.length})`);
      for (const item of summary.skills) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    if (summary.failed.length > 0) {
      lines.push(`Failed (${summary.failed.length})`);
      for (const item of summary.failed) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    process.stdout.write(lines.join('\n'));

    // No additional notes
  }
}
