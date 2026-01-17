import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { FileSystemUtils } from '../utils/file-system.js';
import { getOpenSpecDirName } from '../core/project-config.js';
import { TemplateManager, ResearchContext } from '../core/templates/index.js';

export type ResearchType = 'stack' | 'features' | 'architecture' | 'pitfalls' | 'summary' | 'all';

export class ResearchCommand {
  private async getResearchPath(projectPath: string): Promise<string> {
    const openspecDir = getOpenSpecDirName(projectPath);
    return path.join(projectPath, openspecDir, 'research');
  }

  private async ensureResearchStructure(researchPath: string): Promise<void> {
    await FileSystemUtils.createDirectory(researchPath);
    await FileSystemUtils.createDirectory(path.join(researchPath, 'investigations'));
  }

  async init(topic: string = '', projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const openspecDir = getOpenSpecDirName(resolvedPath);
    const openspecPath = path.join(resolvedPath, openspecDir);
    const researchPath = path.join(openspecPath, 'research');

    // Create directories
    await this.ensureResearchStructure(researchPath);

    // Create template files
    const context: ResearchContext = {
      topic: topic || '[Topic]',
      currentDate: new Date().toISOString().split('T')[0],
    };

    const templates = TemplateManager.getResearchTemplates(context);

    for (const template of templates) {
      const filePath = path.join(openspecPath, template.path);

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

    ora().succeed(chalk.green('Research structure initialized'));
    console.log(chalk.gray('Created:'));
    console.log(chalk.gray('  - openspec/research/SUMMARY.md'));
    console.log(chalk.gray('  - openspec/research/investigations/stack-analysis.md'));
    console.log(chalk.gray('  - openspec/research/investigations/feature-landscape.md'));
    console.log(chalk.gray('  - openspec/research/investigations/architecture.md'));
    console.log(chalk.gray('  - openspec/research/investigations/pitfalls.md'));
  }

  async status(projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const researchPath = await this.getResearchPath(resolvedPath);

    if (!(await FileSystemUtils.directoryExists(researchPath))) {
      console.log(chalk.yellow('Research directory not found. Run "openspec research init" first.'));
      return;
    }

    console.log(chalk.white.bold('Research Status'));
    console.log(chalk.gray('─'.repeat(40)));

    const investigations = [
      { name: 'Stack Analysis', file: 'investigations/stack-analysis.md' },
      { name: 'Feature Landscape', file: 'investigations/feature-landscape.md' },
      { name: 'Architecture', file: 'investigations/architecture.md' },
      { name: 'Pitfalls', file: 'investigations/pitfalls.md' },
      { name: 'Summary', file: 'SUMMARY.md' },
    ];

    for (const inv of investigations) {
      const filePath = path.join(researchPath, inv.file);
      const exists = await FileSystemUtils.fileExists(filePath);

      if (exists) {
        const content = await FileSystemUtils.readFile(filePath);
        // Check if it's still a template (contains placeholder text)
        const isTemplate = content.includes('[Topic]') || content.includes('[Domain]');
        const icon = isTemplate ? chalk.yellow('○') : chalk.green('●');
        const status = isTemplate ? chalk.gray('(template)') : chalk.green('(completed)');
        console.log(`  ${icon} ${chalk.white(inv.name)} ${status}`);
      } else {
        console.log(`  ${chalk.gray('○')} ${chalk.gray(inv.name)} ${chalk.gray('(missing)')}`);
      }
    }
  }

  async create(
    type: ResearchType,
    topic: string = '',
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const openspecDir = getOpenSpecDirName(resolvedPath);
    const openspecPath = path.join(resolvedPath, openspecDir);
    const researchPath = path.join(openspecPath, 'research');

    await this.ensureResearchStructure(researchPath);

    const context: ResearchContext = {
      topic: topic || '[Topic]',
      currentDate: new Date().toISOString().split('T')[0],
    };

    const fileMap: Record<string, string> = {
      stack: 'investigations/stack-analysis.md',
      features: 'investigations/feature-landscape.md',
      architecture: 'investigations/architecture.md',
      pitfalls: 'investigations/pitfalls.md',
      summary: 'SUMMARY.md',
    };

    if (type === 'all') {
      const templates = TemplateManager.getResearchTemplates(context);
      for (const template of templates) {
        const filePath = path.join(openspecPath, template.path);
        const content =
          typeof template.content === 'function'
            ? template.content(context)
            : template.content;
        await FileSystemUtils.writeFile(filePath, content);
      }
      ora().succeed(chalk.green('All research templates created'));
    } else {
      const fileName = fileMap[type];
      if (!fileName) {
        throw new Error(`Unknown research type: ${type}`);
      }

      const filePath = path.join(researchPath, fileName);
      const content = TemplateManager.getResearchTemplate(type as any, context);
      await FileSystemUtils.writeFile(filePath, content);
      ora().succeed(chalk.green(`Created ${fileName}`));
    }
  }

  async show(
    type: 'stack' | 'features' | 'architecture' | 'pitfalls' | 'summary',
    projectPath: string = '.'
  ): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const researchPath = await this.getResearchPath(resolvedPath);

    const fileMap: Record<string, string> = {
      stack: 'investigations/stack-analysis.md',
      features: 'investigations/feature-landscape.md',
      architecture: 'investigations/architecture.md',
      pitfalls: 'investigations/pitfalls.md',
      summary: 'SUMMARY.md',
    };

    const fileName = fileMap[type];
    const filePath = path.join(researchPath, fileName);

    if (!(await FileSystemUtils.fileExists(filePath))) {
      throw new Error(`Research file not found: ${fileName}. Run "openspec research init" first.`);
    }

    const content = await FileSystemUtils.readFile(filePath);
    console.log(content);
  }

  async synthesize(projectPath: string = '.'): Promise<void> {
    const resolvedPath = path.resolve(projectPath);
    const researchPath = await this.getResearchPath(resolvedPath);
    const summaryPath = path.join(researchPath, 'SUMMARY.md');

    // Read all investigation files
    const investigations = [
      { name: 'Stack Analysis', file: 'investigations/stack-analysis.md', key: 'stack' },
      { name: 'Feature Landscape', file: 'investigations/feature-landscape.md', key: 'features' },
      { name: 'Architecture', file: 'investigations/architecture.md', key: 'architecture' },
      { name: 'Pitfalls', file: 'investigations/pitfalls.md', key: 'pitfalls' },
    ];

    const findings: string[] = [];
    let topic = '[Topic]';

    for (const inv of investigations) {
      const filePath = path.join(researchPath, inv.file);
      if (await FileSystemUtils.fileExists(filePath)) {
        const content = await FileSystemUtils.readFile(filePath);

        // Extract topic from first file that has it
        const topicMatch = content.match(/^# .+?: (.+)$/m);
        if (topicMatch && topic === '[Topic]') {
          topic = topicMatch[1];
        }

        // Check if file has been filled in (not just template)
        if (!content.includes('[Topic]') && !content.includes('[Domain]')) {
          findings.push(`### From ${inv.name}\n${this.extractKeyFindings(content)}`);
        }
      }
    }

    if (findings.length === 0) {
      console.log(chalk.yellow('No completed research found. Complete the investigation files first.'));
      return;
    }

    // Generate summary
    const currentDate = new Date().toISOString().split('T')[0];
    const summary = `# Research Summary: ${topic}

Generated: ${currentDate}
Synthesized from: ${findings.length} investigation(s)

## Key Findings
${findings.join('\n\n')}

## Next Steps
- [ ] Review findings with stakeholders
- [ ] Update PROJECT.md with insights
- [ ] Create roadmap based on research
`;

    await FileSystemUtils.writeFile(summaryPath, summary);
    ora().succeed(chalk.green('Research synthesized into SUMMARY.md'));
  }

  private extractKeyFindings(content: string): string {
    // Extract bullet points and key sections
    const lines = content.split('\n');
    const findings: string[] = [];

    let inRelevantSection = false;
    for (const line of lines) {
      if (line.startsWith('## ')) {
        inRelevantSection = ['## Primary', '## Key', '## Recommendation', '## Pitfall'].some(
          prefix => line.includes(prefix.slice(3))
        );
      }
      if (inRelevantSection && line.startsWith('- ')) {
        findings.push(line);
      }
    }

    return findings.slice(0, 5).join('\n') || '- [See full document for details]';
  }
}
