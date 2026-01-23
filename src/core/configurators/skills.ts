/**
 * Agent Skills Configurator
 *
 * Configures Agent Skills (agentskills.io compatible) for supported harnesses.
 * Installs core Spool workflow skills as Agent Skills.
 */

import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { FileSystemUtils } from '../../utils/file-system.js';
import { replaceHardcodedDotSpoolPaths } from '../../utils/path-normalization.js';
import type { ToolConfigurator } from './base.js';
import { SPOOL_MARKERS } from '../config.js';
import {
  // Core workflow skills
  getProposalSkillTemplate,
  getApplySkillTemplate,
  getArchiveSkillTemplate,
  getResearchSkillTemplate,
  getReviewSkillTemplate,
  getCommitSkillTemplate,
  // Experimental workflow skills
  getExploreSkillTemplate,

  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  // Slash commands
  getSpoolCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';

/**
 * Skills configuration for a specific skill
 */
export type SkillsHarness = 'claude' | 'opencode' | 'codex' | 'github-copilot';

interface SkillConfig {
  id: string;
  template: SkillTemplate;
  directory: string;
}

/**
 * Apply spoolDir to a skill template by replacing hardcoded paths
 */
function applySpoolDirToTemplate(template: SkillTemplate, spoolDir: string = '.spool'): SkillTemplate {
  return {
    ...template,
    instructions: replaceHardcodedDotSpoolPaths(template.instructions, spoolDir)
  };
}

/**
 * Agent Skills configurator for managing Spool skills
 */
export class SkillsConfigurator implements ToolConfigurator {
  readonly name = 'Spool Skills';
  readonly isAvailable = true;
  readonly configFileName = '.claude/skills'; // Virtual config file for tracking

  /**
   * Get the path where skills should be installed
   */
  getSkillsDirectory(projectPath: string, toolId: SkillsHarness = 'claude'): string {
    if (toolId === 'codex') {
      const base = (process.env.CODEX_HOME && process.env.CODEX_HOME.trim())
        ? process.env.CODEX_HOME.trim()
        : FileSystemUtils.joinPath(os.homedir(), '.codex');
      return FileSystemUtils.joinPath(base, 'skills');
    }

    if (toolId === 'opencode') {
      // IMPORTANT! Opencode uses the singular "skill" directory, the same goes for command, plugin etc.
      return path.join(projectPath, '.opencode', 'skill');
    }

    if (toolId === 'github-copilot') {
      return path.join(projectPath, '.github', 'skills');
    }

    return path.join(projectPath, '.claude', 'skills');
  }

  /**
   * Get all available skills
   */
  getAvailableSkills(spoolDir: string = '.spool'): SkillConfig[] {
    // Core workflow skills
    const coreSkills: SkillConfig[] = [
      {
        id: 'spool-proposal',
        template: applySpoolDirToTemplate(getProposalSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-proposal',
      },
      {
        id: 'spool-apply',
        template: applySpoolDirToTemplate(getApplySkillTemplate(spoolDir), spoolDir),
        directory: 'spool-apply',
      },
      {
        id: 'spool-archive',
        template: applySpoolDirToTemplate(getArchiveSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-archive',
      },
      {
        id: 'spool-research',
        template: applySpoolDirToTemplate(getResearchSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-research',
      },
      {
        id: 'spool-review',
        template: applySpoolDirToTemplate(getReviewSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-review',
      },
      {
        id: 'spool-commit',
        template: applySpoolDirToTemplate(getCommitSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-commit',
      },
];

    // Experimental workflow skills (OPSX)
    const experimentalSkills: SkillConfig[] = [
      {
        id: 'spool-explore',
        template: applySpoolDirToTemplate(getExploreSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-explore',
      },
      {
        id: 'spool-new-change',
        template: applySpoolDirToTemplate(getNewChangeSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-new-change',
      },
      {
        id: 'spool-continue-change',
        template: applySpoolDirToTemplate(getContinueChangeSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-continue-change',
      },
      {
        id: 'spool-apply-change',
        template: applySpoolDirToTemplate(getApplyChangeSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-apply-change',
      },
      {
        id: 'spool-ff-change',
        template: applySpoolDirToTemplate(getFfChangeSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-ff-change',
      },
      {
        id: 'spool-sync-specs',
        template: applySpoolDirToTemplate(getSyncSpecsSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-sync-specs',
      },
      {
        id: 'spool-archive-change',
        template: applySpoolDirToTemplate(getArchiveChangeSkillTemplate(spoolDir), spoolDir),
        directory: 'spool-archive-change',
      },
    ];

    return [...coreSkills, ...experimentalSkills];
  }
  /**
   * Install skills for given category
   */
  async installSkills(
    projectPath: string,
    spoolDir: string,
    skillIds: string[],
    toolId: SkillsHarness = 'claude'
  ): Promise<void> {
    const skillsDir = this.getSkillsDirectory(projectPath, toolId);
    const availableSkills = this.getAvailableSkills(spoolDir);

    // Filter skills to install
    const skillsToInstall = availableSkills.filter(skill => skillIds.includes(skill.id));

    if (skillsToInstall.length === 0) {
      console.log('No skills selected for installation.');
      return;
    }

    // Create skills directory
    await FileSystemUtils.createDirectory(skillsDir);

    // Install each selected skill
    for (const skill of skillsToInstall) {
      await this.installSkill(skillsDir, skill, spoolDir);
    }

    // Install spool.md slash command for skill-first routing
    await this.installSpoolSlashCommand(projectPath, spoolDir, toolId);
  }

  /**
   * Install spool.md slash command for unified spool command routing
   */
  private async installSpoolSlashCommand(
    projectPath: string,
    spoolDir: string,
    toolId: SkillsHarness = 'claude'
  ): Promise<void> {
    const commandFile = this.getSlashCommandFile(projectPath, toolId);
    const commandDir = path.dirname(commandFile);

    try {
      // Create command directory
      await FileSystemUtils.createDirectory(commandDir);

      // Generate command template with spoolDir path replacement
      const commandTemplate = getSpoolCommandTemplate(spoolDir);

      // Write command file with YAML frontmatter and content
      const commandContent = this.generateCommandFile(commandTemplate);
      await FileSystemUtils.writeFile(commandFile, commandContent);
    } catch (error) {
      console.error(`Failed to install spool.md slash command: ${error}`);
    }
  }

  /**
   * Generate command file with YAML frontmatter
   */
  private generateCommandFile(template: any): string {
    return `---
description: ${template.description}
---

${template.content}
`;
  }

  /**
   * Get the slash command file path for a given tool
   */
  private getSlashCommandFile(projectPath: string, toolId: SkillsHarness): string {
    switch (toolId) {
      case 'claude':
        return path.join(projectPath, '.claude', 'command', 'spool.md');
      case 'opencode':
        return path.join(projectPath, '.opencode', 'command', 'spool.md');
      case 'codex':
        return path.join(projectPath, '.codex', 'command', 'spool.md');
      default:
        throw new Error(`Unsupported tool: ${toolId}`);
    }
  }

  /**
   * Install a single skill
   */
  private async installSkill(skillsDir: string, skillConfig: SkillConfig, spoolDir: string): Promise<void> {
    const skillDir = path.join(skillsDir, skillConfig.directory);
    const skillFile = path.join(skillDir, 'SKILL.md');

    // Create skill directory
    await FileSystemUtils.createDirectory(skillDir);

    // Generate SKILL.md content with YAML frontmatter and path replacement
    const skillContent = this.generateSkillFile(skillConfig.template, spoolDir);

    // Write the skill file
    await FileSystemUtils.writeFile(skillFile, skillContent);
  }

  /**
   * Generate SKILL.md content with YAML frontmatter
   */
  private generateSkillFile(template: SkillTemplate, spoolDir: string = '.spool'): string {
    // Replace hardcoded .spool/ paths with the configured spoolDir
    const normalizedInstructions = replaceHardcodedDotSpoolPaths(template.instructions, spoolDir);

    return `---
name: ${template.name}
description: ${template.description}
---

${normalizedInstructions}
`;
  }

  /**
   * Check if skills are already configured
   */
  async isConfigured(projectPath: string, toolId: SkillsHarness = 'claude'): Promise<boolean> {
    const skillsDir = this.getSkillsDirectory(projectPath, toolId);

    try {
      // Check if skills directory exists
      if (!(await FileSystemUtils.directoryExists(skillsDir))) {
        return false;
      }

      // Read directory to check for skill files
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });

      if (entries.length === 0) {
        return false;
      }

      // Check if any skill directories contain SKILL.md with Spool markers
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
          if (await FileSystemUtils.fileExists(skillFile)) {
            const content = await FileSystemUtils.readFile(skillFile);
            if (content.includes('spool-proposal') ||
                content.includes('spool-apply') ||
                content.includes('Spool')) {
              return true;
            }
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Configure tool (implements ToolConfigurator interface)
   */
  async configure(projectPath: string, spoolDir: string): Promise<void> {
    // This is handled by installSkills method
    console.log('Use installSkills method to configure specific skills.');
  }

  /**
   * Get skills that are already installed
   */
  async getInstalledSkills(projectPath: string, toolId: SkillsHarness = 'claude'): Promise<string[]> {
    const skillsDir = this.getSkillsDirectory(projectPath, toolId);
    const installedSkills: string[] = [];

    try {
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
          if (await FileSystemUtils.fileExists(skillFile)) {
            installedSkills.push(entry.name);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return installedSkills;
  }
}
