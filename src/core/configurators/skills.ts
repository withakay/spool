/**
 * Agent Skills Configurator
 * 
 * Configures Agent Skills (agentskills.io compatible) for supported harnesses.
 * Installs core Projector workflow skills as Agent Skills.
 */

import path from 'path';
import { promises as fs } from 'fs';
import { FileSystemUtils } from '../../utils/file-system.js';
import { replaceHardcodedDotProjectorPaths } from '../../utils/path-normalization.js';
import type { ToolConfigurator } from './base.js';
import { PROJECTOR_MARKERS } from '../config.js';
import {
  // Core workflow skills
  getProposalSkillTemplate,
  getApplySkillTemplate,
  getArchiveSkillTemplate,
  getResearchSkillTemplate,
  getReviewSkillTemplate,
  // Experimental workflow skills
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';

/**
 * Skills configuration for a specific skill
 */
interface SkillConfig {
  id: string;
  template: SkillTemplate;
  directory: string;
}

/**
 * Apply projectorDir to a skill template by replacing hardcoded paths
 */
function applyProjectorDirToTemplate(template: SkillTemplate, projectorDir: string = '.projector'): SkillTemplate {
  return {
    ...template,
    instructions: replaceHardcodedDotProjectorPaths(template.instructions, projectorDir)
  };
}

/**
 * Agent Skills configurator for managing Projector skills
 */
export class SkillsConfigurator implements ToolConfigurator {
  readonly name = 'Projector Skills';
  readonly isAvailable = true;
  readonly configFileName = '.claude/skills'; // Virtual config file for tracking

  /**
   * Get the path where skills should be installed
   */
  getSkillsDirectory(projectPath: string): string {
    return path.join(projectPath, '.claude', 'skills');
  }

  /**
   * Get all available skills
   */
  getAvailableSkills(projectorDir: string = '.projector'): SkillConfig[] {
    // Core workflow skills
    const coreSkills: SkillConfig[] = [
      {
        id: 'projector-proposal',
        template: applyProjectorDirToTemplate(getProposalSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-proposal',
      },
      {
        id: 'projector-apply',
        template: applyProjectorDirToTemplate(getApplySkillTemplate(projectorDir), projectorDir),
        directory: 'projector-apply',
      },
      {
        id: 'projector-archive',
        template: applyProjectorDirToTemplate(getArchiveSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-archive',
      },
      {
        id: 'projector-research',
        template: applyProjectorDirToTemplate(getResearchSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-research',
      },
      {
        id: 'projector-review',
        template: applyProjectorDirToTemplate(getReviewSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-review',
      },
];

    // Experimental workflow skills (OPSX)
    const experimentalSkills: SkillConfig[] = [
      {
        id: 'projector-explore',
        template: applyProjectorDirToTemplate(getExploreSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-explore',
      },
      {
        id: 'projector-new-change',
        template: applyProjectorDirToTemplate(getNewChangeSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-new-change',
      },
      {
        id: 'projector-continue-change',
        template: applyProjectorDirToTemplate(getContinueChangeSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-continue-change',
      },
      {
        id: 'projector-apply-change',
        template: applyProjectorDirToTemplate(getFfChangeSkillTemplate(projectorDir), projectorDir), // Note: Using FF template for apply-change
        directory: 'projector-apply-change',
      },
      {
        id: 'projector-ff-change',
        template: applyProjectorDirToTemplate(getFfChangeSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-ff-change',
      },
      {
        id: 'projector-sync-specs',
        template: applyProjectorDirToTemplate(getSyncSpecsSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-sync-specs',
      },
      {
        id: 'projector-archive-change',
        template: applyProjectorDirToTemplate(getArchiveChangeSkillTemplate(projectorDir), projectorDir),
        directory: 'projector-archive-change',
      },
    ];

    return [...coreSkills, ...experimentalSkills];
  }
  /**
   * Install skills for the given category
   */
  async installSkills(
    projectPath: string,
    projectorDir: string,
    skillIds: string[]
  ): Promise<void> {
    const skillsDir = this.getSkillsDirectory(projectPath);
    const availableSkills = this.getAvailableSkills(projectorDir);

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
      await this.installSkill(skillsDir, skill, projectorDir);
    }
  }

  /**
   * Install a single skill
   */
  private async installSkill(skillsDir: string, skillConfig: SkillConfig, projectorDir: string): Promise<void> {
    const skillDir = path.join(skillsDir, skillConfig.directory);
    const skillFile = path.join(skillDir, 'SKILL.md');

    // Create skill directory
    await FileSystemUtils.createDirectory(skillDir);

    // Generate SKILL.md content with YAML frontmatter and path replacement
    const skillContent = this.generateSkillFile(skillConfig.template, projectorDir);

    // Write the skill file
    await FileSystemUtils.writeFile(skillFile, skillContent);
  }

  /**
   * Generate SKILL.md content with YAML frontmatter
   */
  private generateSkillFile(template: SkillTemplate, projectorDir: string = '.projector'): string {
    // Replace hardcoded .projector/ paths with the configured projectorDir
    const normalizedInstructions = replaceHardcodedDotProjectorPaths(template.instructions, projectorDir);
    
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
  async isConfigured(projectPath: string): Promise<boolean> {
    const skillsDir = this.getSkillsDirectory(projectPath);
    
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

      // Check if any skill directories contain SKILL.md with Projector markers
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
          if (await FileSystemUtils.fileExists(skillFile)) {
            const content = await FileSystemUtils.readFile(skillFile);
            if (content.includes('projector-proposal') || 
                content.includes('projector-apply') || 
                content.includes('Projector')) {
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
  async configure(projectPath: string, projectorDir: string): Promise<void> {
    // This is handled by installSkills method
    console.log('Use installSkills method to configure specific skills.');
  }

  /**
   * Get skills that are already installed
   */
  async getInstalledSkills(projectPath: string): Promise<string[]> {
    const skillsDir = this.getSkillsDirectory(projectPath);
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