/**
 * Skills Command
 *
 * Manages Spool Agent Skills installation and configuration.
 */

import type { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import * as fs from 'node:fs/promises';
import { PALETTE } from '../core/styles/palette.js';
import { getSpoolDirName } from '../core/project-config.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { SkillsConfigurator, type SkillsHarness } from '../core/configurators/skills.js';

interface SkillsOptions {
  list?: boolean;
  install?: string[];
  uninstall?: string[];
}

function normalizeToolId(raw?: string): SkillsHarness {
  const value = (raw ?? 'claude').trim();
  const supported: SkillsHarness[] = ['claude', 'opencode', 'codex', 'github-copilot'];
  if (supported.includes(value as SkillsHarness)) {
    return value as SkillsHarness;
  }
  throw new Error(`Unsupported tool: ${value}. Use one of ${supported.join(', ')}`);
}

/**
 * List available Spool skills
 */
async function listAvailableSkills(): Promise<void> {
  const spinner = ora('Loading available skills...').start();
  
  try {
    const configurator = new SkillsConfigurator();
    const availableSkills = configurator.getAvailableSkills();
    
    spinner.stop();
    
    console.log(chalk.bold('Available Spool Skills:'));
    console.log();
    
    // Group skills by category
    const coreSkills = availableSkills.filter(skill => 
      ['spool-proposal', 'spool-apply', 'spool-archive', 'spool-research', 'spool-review'].includes(skill.id)
    );
    
    const experimentalSkills = availableSkills.filter(skill =>
      ['spool-explore', 'spool-new-change', 'spool-continue-change', 'spool-apply-change', 'spool-ff-change', 'spool-sync-specs', 'spool-archive-change'].includes(skill.id)
    );
    
    // Core workflow skills
    if (coreSkills.length > 0) {
      console.log(chalk.white('Core Workflow Skills:'));
      for (const skill of coreSkills) {
        console.log(`  ${chalk.cyan('•')} ${chalk.white(skill.template.name)} - ${skill.template.description}`);
      }
      console.log();
    }
    
    // Experimental workflow skills (OPSX)
    if (experimentalSkills.length > 0) {
      console.log(chalk.white('Experimental Workflow Skills (OPSX):'));
      for (const skill of experimentalSkills) {
        console.log(`  ${chalk.cyan('•')} ${chalk.white(skill.template.name)} - ${skill.template.description}`);
      }
      console.log();
    }
    
    if (coreSkills.length === 0 && experimentalSkills.length === 0) {
      console.log(chalk.gray('No skills available.'));
    }
    
    console.log();
    console.log(chalk.gray('Usage:'));
    console.log(`  ${chalk.cyan('spool install skills <skill-id>...')} - Install specific skills`);
    console.log(`  ${chalk.cyan('spool install skills --all')} - Install all skills`);
    console.log(`  ${chalk.cyan('spool list skills')} - Show available skills`);
    console.log(`  ${chalk.cyan('spool uninstall skills <skill-id>...')} - Remove specific skills`);
    
  } catch (error) {
    spinner.fail('Failed to load skills');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Install specified skills
 */
async function installSkills(skillIds: string[], toolId: SkillsHarness): Promise<void> {
  const spinner = ora(`Installing Spool Skills for ${toolId}...`).start();
  
  try {
    const projectRoot = process.cwd();
    const spoolDir = getSpoolDirName(projectRoot);
    const configurator = new SkillsConfigurator();
    
    await configurator.installSkills(projectRoot, spoolDir, skillIds, toolId);
    
    spinner.succeed(`Spool Skills installed successfully for ${toolId}!`);
    
    console.log();
    console.log(chalk.bold('Skills Installed:'));
    for (const skillId of skillIds) {
      console.log(`  ${chalk.green('✓')} ${chalk.white(skillId)}`);
    }
    
    console.log();
    console.log(chalk.gray('Note: Restart your IDE to ensure skills are loaded.'));
    
  } catch (error) {
    spinner.fail('Failed to install skills');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * List currently installed skills
 */
async function listInstalledSkills(toolId: SkillsHarness): Promise<void> {
  const spinner = ora(`Checking installed skills for ${toolId}...`).start();
  
  try {
    const projectRoot = process.cwd();
    const configurator = new SkillsConfigurator();
    
    const installedSkills = await configurator.getInstalledSkills(projectRoot, toolId);
    
    spinner.stop();
    
    if (installedSkills.length === 0) {
      console.log(chalk.gray('No Spool skills are currently installed.'));
    } else {
      console.log(chalk.bold('Installed Spool Skills:'));
      for (const skill of installedSkills) {
        console.log(`  ${chalk.cyan('•')} ${chalk.white(skill)}`);
      }
    }
    
    console.log();
    console.log(chalk.gray('Use ') + chalk.cyan('spool list skills') + chalk.gray(' to see all available skills.'));
    
  } catch (error) {
    spinner.fail('Failed to check installed skills');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Uninstall specified skills
 */
async function uninstallSkills(skillIds: string[], toolId: SkillsHarness): Promise<void> {
  const spinner = ora(`Uninstalling Spool Skills for ${toolId}...`).start();
  
  try {
    const projectRoot = process.cwd();
    const configurator = new SkillsConfigurator();
    const skillsDir = configurator.getSkillsDirectory(projectRoot, toolId);
    
    let removedCount = 0;
    
    for (const skillId of skillIds) {
      const skillPath = path.join(skillsDir, skillId);
      
      if (await FileSystemUtils.directoryExists(skillPath)) {
        await FileSystemUtils.createDirectory(path.join(skillsDir, '.trash'));
        const trashPath = path.join(skillsDir, '.trash', skillId);
        await fs.rename(skillPath, trashPath);
        removedCount++;
        console.log(`  ${chalk.yellow('−')} ${chalk.white(skillId)} (moved to trash)`);
      } else {
        console.log(`  ${chalk.gray('○')} ${chalk.white(skillId)} (not found)`);
      }
    }
    
    spinner.succeed(`${removedCount} skill(s) uninstalled successfully!`);
    
    if (removedCount > 0) {
      console.log();
      console.log(chalk.gray('Note: Restart your IDE to ensure skills are unloaded.'));
    }
    
  } catch (error) {
    spinner.fail('Failed to uninstall skills');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

export class SkillsCommand {
  async list(): Promise<void> {
    await listAvailableSkills();
  }

  async status(options: { tool?: string } = {}): Promise<void> {
    const toolId = normalizeToolId(options.tool);
    await listInstalledSkills(toolId);
  }

  async install(skills: string[], options: { all?: boolean; tool?: string } = {}): Promise<void> {
    const toolId = normalizeToolId(options.tool);
    if (options.all) {
      const configurator = new SkillsConfigurator();
      const availableSkills = configurator.getAvailableSkills();
      const skillIds = availableSkills.map((skill) => skill.id);
      await installSkills(skillIds, toolId);
      return;
    }

    if (skills.length > 0) {
      await installSkills(skills, toolId);
      return;
    }

    console.log(chalk.yellow('Error: Please specify skill IDs to install or use --all.'));
    console.log(chalk.gray('Use ') + chalk.cyan('spool list skills') + chalk.gray(' to see available skills.'));
    process.exit(1);
  }

  async uninstall(skills: string[], options: { tool?: string } = {}): Promise<void> {
    const toolId = normalizeToolId(options.tool);
    if (skills.length > 0) {
      await uninstallSkills(skills, toolId);
      return;
    }

    console.log(chalk.yellow('Error: Please specify skill IDs to uninstall.'));
    console.log(chalk.gray('Use ') + chalk.cyan('spool list skills --installed') + chalk.gray(' to see installed skills.'));
    process.exit(1);
  }
}

/**
 * Register skills commands on the main program
 */
export function registerSkillsCommands(program: Command): void {
  const skillsCmd = program
    .command('skills', { hidden: true })
    .description('Manage Spool Agent Skills (core workflows and experimental OPSX) (deprecated)');

  skillsCmd.hook('preAction', () => {
    console.error('Warning: The "spool skills ..." commands are deprecated. Skills are installed/updated by "spool init" and "spool update".');
  });
    
  // List command
  skillsCmd
    .command('list')
    .description('List all available Spool skills')
    .action(async () => {
      const cmd = new SkillsCommand();
      await cmd.list();
    });
  
  // Install command
  skillsCmd
    .command('install <skills...>')
    .description('Install specified Spool skills (or --all for all)')
    .option('--all', 'Install all available skills')
    .option('--tool <toolId>', 'Target tool (claude, opencode, codex, github-copilot)', 'claude')
    .action(async (skills: string[], options: { all?: boolean; tool?: string }) => {
      const cmd = new SkillsCommand();
      await cmd.install(skills, options);
    });
  
  // Uninstall command
  skillsCmd
    .command('uninstall <skills...>')
    .description('Remove specified Spool skills')
    .option('--tool <toolId>', 'Target tool (claude, opencode, codex, github-copilot)', 'claude')
    .action(async (skills: string[], options: { tool?: string }) => {
      const cmd = new SkillsCommand();
      await cmd.uninstall(skills, options);
    });
  
  // Status command
  skillsCmd
    .command('status')
    .description('Show currently installed Spool skills')
    .option('--tool <toolId>', 'Target tool (claude, opencode, codex, github-copilot)', 'claude')
    .action(async (options: { tool?: string }) => {
      const cmd = new SkillsCommand();
      await cmd.status(options);
    });
}
