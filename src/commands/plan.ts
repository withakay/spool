import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { FileSystemUtils } from '../utils/file-system.js';
import { getSpoolDirName } from '../core/project-config.js';
import { TemplateManager, PlanningContext } from '../core/templates/index.js';

export class PlanCommand {
  private async getPlanningPath(projectPath: string): Promise<string> {
    const spoolDir = getSpoolDirName(projectPath);
    return path.join(projectPath, spoolDir, 'planning');
  }

  private async getRoadmapPath(projectPath: string): Promise<string> {
    const planningPath = await this.getPlanningPath(projectPath);
    return path.join(planningPath, 'ROADMAP.md');
  }

  private async ensureRoadmapFile(roadmapPath: string): Promise<void> {
    if (!(await FileSystemUtils.fileExists(roadmapPath))) {
      throw new Error(
        'ROADMAP.md not found. Run "spool init" or "spool plan init" first.'
      );
    }
  }

  async init(projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const spoolDir = getSpoolDirName(resolvedPath);
    const spoolPath = path.join(resolvedPath, spoolDir);
    const planningPath = path.join(spoolPath, 'planning');

    // Create directories
    const directories = [
      planningPath,
      path.join(planningPath, 'milestones'),
    ];

    for (const dir of directories) {
      await FileSystemUtils.createDirectory(dir);
    }

    // Create template files
    const context: PlanningContext = {
      currentDate: new Date().toISOString().split('T')[0],
    };

    const templates = TemplateManager.getPlanningTemplates(context);

    for (const template of templates) {
      const filePath = path.join(spoolPath, template.path);

      // Skip if file exists
      if (await FileSystemUtils.fileExists(filePath)) {
        continue;
      }

      const content =
        typeof template.content === 'function'
          ? template.content(context)
          : template.content;

      await FileSystemUtils.writeFile(filePath, content);
    }

    ora().succeed(chalk.green('Planning structure initialized'));
    console.log(chalk.gray('Created:'));
    console.log(chalk.gray(`  - ${spoolDir}/planning/PROJECT.md`));
    console.log(chalk.gray(`  - ${spoolDir}/planning/ROADMAP.md`));
    console.log(chalk.gray(`  - ${spoolDir}/planning/STATE.md`));
  }

  async status(projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const roadmapPath = await this.getRoadmapPath(resolvedPath);

    await this.ensureRoadmapFile(roadmapPath);

    const content = await FileSystemUtils.readFile(roadmapPath);

    // Parse current milestone info
    const currentMilestoneMatch = content.match(
      /## Current Milestone: (.+)\n- Status: (.+)\n- Phase: (.+)/
    );

    if (currentMilestoneMatch) {
      console.log(chalk.white.bold('Current Progress'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(
        `${chalk.gray('Milestone:')} ${chalk.white(currentMilestoneMatch[1])}`
      );
      console.log(
        `${chalk.gray('Status:')} ${chalk.white(currentMilestoneMatch[2])}`
      );
      console.log(
        `${chalk.gray('Phase:')} ${chalk.white(currentMilestoneMatch[3])}`
      );
    }

    // Parse and display phase table
    const tableMatch = content.match(
      /\| Phase \| Name \| Status \| Changes \|[\s\S]*?(?=\n\n|\n##|$)/
    );
    if (tableMatch) {
      console.log();
      console.log(chalk.white.bold('Phases'));
      console.log(chalk.gray('─'.repeat(40)));

      const lines = tableMatch[0].split('\n').slice(2); // Skip header and separator
      for (const line of lines) {
        if (line.trim() && line.includes('|')) {
          const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
          if (cols.length >= 4) {
            const statusIcon =
              cols[2] === 'Complete'
                ? chalk.green('✓')
                : cols[2] === 'In Progress'
                ? chalk.yellow('●')
                : chalk.gray('○');
            console.log(
              `  ${statusIcon} Phase ${cols[0]}: ${chalk.white(cols[1])} ${chalk.gray(`[${cols[2]}]`)}`
            );
          }
        }
      }
    }
  }

  async addMilestone(
    name: string,
    target: string = '',
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const roadmapPath = await this.getRoadmapPath(resolvedPath);

    await this.ensureRoadmapFile(roadmapPath);

    const content = await FileSystemUtils.readFile(roadmapPath);

    // Create milestone entry
    const milestoneEntry = `
### ${name}
Target: ${target || '[Define the goal for this milestone]'}

| Phase | Name | Status | Changes |
|-------|------|--------|---------|
| 1 | [Phase Name] | Pending | - |
`;

    // Find "## Completed Milestones" and insert before it
    const completedIndex = content.indexOf('## Completed Milestones');
    let updatedContent: string;

    if (completedIndex !== -1) {
      updatedContent =
        content.slice(0, completedIndex) +
        milestoneEntry +
        '\n' +
        content.slice(completedIndex);
    } else {
      // Append at end
      updatedContent = content + '\n' + milestoneEntry;
    }

    await FileSystemUtils.writeFile(roadmapPath, updatedContent);

    // Create milestone directory
    const planningPath = await this.getPlanningPath(resolvedPath);
    const milestoneDir = path.join(
      planningPath,
      'milestones',
      name.toLowerCase().replace(/\s+/g, '-')
    );
    await FileSystemUtils.createDirectory(milestoneDir);
    await FileSystemUtils.createDirectory(path.join(milestoneDir, 'phases'));

    ora().succeed(chalk.green(`Milestone "${name}" added`));
  }

  async addPhase(
    milestone: string,
    phaseName: string,
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const roadmapPath = await this.getRoadmapPath(resolvedPath);

    await this.ensureRoadmapFile(roadmapPath);

    const content = await FileSystemUtils.readFile(roadmapPath);

    // Find the milestone section
    const milestoneRegex = new RegExp(
      `### ${milestone}[\\s\\S]*?(?=\\n### |\\n## |$)`,
      'i'
    );
    const milestoneMatch = content.match(milestoneRegex);

    if (!milestoneMatch) {
      throw new Error(`Milestone "${milestone}" not found in ROADMAP.md`);
    }

    const milestoneSection = milestoneMatch[0];

    // Find the last phase number
    const phaseMatches = milestoneSection.match(/\| (\d+) \|/g);
    const lastPhaseNum = phaseMatches
      ? Math.max(...phaseMatches.map((m) => parseInt(m.match(/\d+/)![0])))
      : 0;

    const newPhaseNum = lastPhaseNum + 1;
    const newPhaseRow = `| ${newPhaseNum} | ${phaseName} | Pending | - |`;

    // Insert new phase row before the last row ends
    const tableEndIndex = milestoneSection.lastIndexOf('|');
    const updatedMilestone =
      milestoneSection.slice(0, tableEndIndex + 1) +
      '\n' +
      newPhaseRow +
      milestoneSection.slice(tableEndIndex + 1);

    const updatedContent = content.replace(milestoneSection, updatedMilestone);

    await FileSystemUtils.writeFile(roadmapPath, updatedContent);

    // Create phase directory
    const planningPath = await this.getPlanningPath(resolvedPath);
    const phaseDir = path.join(
      planningPath,
      'milestones',
      milestone.toLowerCase().replace(/\s+/g, '-'),
      'phases',
      `phase-${newPhaseNum}`
    );
    await FileSystemUtils.createDirectory(phaseDir);

    ora().succeed(
      chalk.green(`Phase ${newPhaseNum} "${phaseName}" added to ${milestone}`)
    );
  }

  async updatePhaseStatus(
    milestone: string,
    phaseNum: number,
    status: 'Pending' | 'In Progress' | 'Complete',
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const roadmapPath = await this.getRoadmapPath(resolvedPath);

    await this.ensureRoadmapFile(roadmapPath);

    const content = await FileSystemUtils.readFile(roadmapPath);

    // Find and update the phase row
    const phaseRowRegex = new RegExp(
      `\\| ${phaseNum} \\| ([^|]+) \\| [^|]+ \\| ([^|]+) \\|`,
      'g'
    );

    let updatedContent = content;
    const milestoneRegex = new RegExp(
      `### ${milestone}[\\s\\S]*?(?=\\n### |\\n## |$)`,
      'i'
    );
    const milestoneMatch = content.match(milestoneRegex);

    if (!milestoneMatch) {
      throw new Error(`Milestone "${milestone}" not found`);
    }

    const updatedMilestone = milestoneMatch[0].replace(
      phaseRowRegex,
      `| ${phaseNum} | $1 | ${status} | $2 |`
    );

    updatedContent = content.replace(milestoneMatch[0], updatedMilestone);

    // Update current milestone status if needed
    if (status === 'In Progress') {
      updatedContent = updatedContent.replace(
        /## Current Milestone: .+\n- Status: .+\n- Phase: .+/,
        `## Current Milestone: ${milestone}\n- Status: In Progress\n- Phase: ${phaseNum} of ?`
      );
    }

    await FileSystemUtils.writeFile(roadmapPath, updatedContent);

    ora().succeed(
      chalk.green(`Phase ${phaseNum} status updated to "${status}"`)
    );
  }
}
