/**
 * Spool Research Command
 * 
 * Single entrypoint for Spool research functionality.
 * Routes based on arguments or asks user to choose.
 */

import type { Command } from 'commander';

import { 
  researchSummaryTemplate,
  stackAnalysisTemplate,
  featureLandscapeTemplate,
  architectureTemplate,
  pitfallsTemplate,
  type ResearchContext
} from '../core/templates/research-templates.js';
import { promises as fs } from 'fs';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

interface ResearchOptions {
  type?: string;
  topic?: string;
}

// Available research types with their templates
const RESEARCH_TYPES = {
  summary: {
    name: 'Research Summary',
    description: 'Comprehensive research summary with key findings and recommendations',
    template: researchSummaryTemplate,
  },
  stack: {
    name: 'Stack Analysis',
    description: 'Technology stack analysis with recommendations and trade-offs',
    template: stackAnalysisTemplate,
  },
  features: {
    name: 'Feature Landscape',
    description: 'Market and feature analysis for competitive positioning',
    template: featureLandscapeTemplate,
  },
  architecture: {
    name: 'Architecture Analysis',
    description: 'System architecture evaluation and design decisions',
    template: architectureTemplate,
  },
  pitfalls: {
    name: 'Pitfalls Analysis',
    description: 'Risk assessment and common pitfalls to avoid',
    template: pitfallsTemplate,
  },
};

/**
 * Show available research types and let user choose
 */
async function promptForResearchType(): Promise<string> {
  const { select } = await import('@inquirer/prompts');
  
  const options = Object.entries(RESEARCH_TYPES).map(([key, info]) => ({
    name: `${info.name} - ${info.description}`,
    value: key,
  }));

  return await select({
    message: 'What type of research do you want to conduct?',
    choices: options,
  });
}

/**
 * Prompt for research topic if not provided
 */
async function promptForTopic(): Promise<string> {
  const { input } = await import('@inquirer/prompts');
  
  return await input({
    message: 'What is the research topic or question?',
  });
}

/**
 * Create research directory structure
 */
async function ensureResearchDir(projectPath: string): Promise<string> {
  const researchDir = path.join(projectPath, '.spool', 'research');
  
  // Create main research directory
  await fs.mkdir(researchDir, { recursive: true });
  
  // Create investigations subdirectory
  const investigationsDir = path.join(researchDir, 'investigations');
  await fs.mkdir(investigationsDir, { recursive: true });
  
  return researchDir;
}

/**
 * Generate research file based on type and topic
 */
async function generateResearchFile(
  researchType: string,
  topic: string,
  projectPath: string
): Promise<void> {
  const spinner = ora('Generating research file...').start();
  
  try {
    const researchDir = await ensureResearchDir(projectPath);
    const typeInfo = RESEARCH_TYPES[researchType as keyof typeof RESEARCH_TYPES];
    
    if (!typeInfo) {
      throw new Error(`Unknown research type: ${researchType}`);
    }

    // Generate filename based on topic (kebab-case)
    const filename = `${researchType}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const filepath = path.join(researchDir, 'investigations', filename);

    // Generate content
    const context: ResearchContext = {
      topic,
      currentDate: new Date().toISOString().split('T')[0],
    };
    
    const content = typeInfo.template(context);
    
    // Write file
    await fs.writeFile(filepath, content, 'utf8');
    
    spinner.succeed(`Research file created: ${filepath}`);
    
    // Show next steps
    console.log();
    console.log(chalk.bold('Research file created successfully!'));
    console.log();
    console.log(chalk.gray('File location:'), chalk.cyan(filepath));
    console.log();
    console.log(chalk.bold('Next steps:'));
    console.log(`1. Open the file and fill in your research findings`);
    console.log(`2. Update the SUMMARY.md file with key conclusions`);
    console.log(`3. Share findings with your team`);
    
  } catch (error) {
    spinner.fail('Failed to generate research file');
    throw error;
  }
}

/**
 * Show research directory status
 */
async function showResearchStatus(projectPath: string): Promise<void> {
  const researchDir = path.join(projectPath, '.spool', 'research');
  
  try {
    const exists = await fs.access(researchDir).then(() => true).catch(() => false);
    
    if (!exists) {
      console.log(chalk.yellow('No research directory found.'));
      console.log(chalk.gray('Create your first research with: /spool-research'));
      return;
    }

    const investigationsDir = path.join(researchDir, 'investigations');
    const files = await fs.readdir(investigationsDir).catch(() => []);
    
    if (files.length === 0) {
      console.log(chalk.yellow('No research files found.'));
      console.log(chalk.gray('Create research with: /spool-research <type> <topic>'));
      return;
    }

    console.log(chalk.bold('Research Files:'));
    console.log();
    
    for (const file of files.sort()) {
      const filepath = path.join(investigationsDir, file);
      const stats = await fs.stat(filepath);
      const type = file.split('-')[0];
      const typeInfo = RESEARCH_TYPES[type as keyof typeof RESEARCH_TYPES];
      
      console.log(`${chalk.cyan('•')} ${file}`);
      if (typeInfo) {
        console.log(`   ${chalk.gray(typeInfo.name)}`);
      }
      console.log(`   ${chalk.gray(`Modified: ${stats.mtime.toISOString().split('T')[0]}`)}`);
      console.log();
    }
    
  } catch (error) {
    console.log(chalk.red('Error checking research status:'));
    console.log(chalk.gray((error as Error).message));
  }
}

/**
 * Main research command handler
 */
async function handleResearchCommand(options: ResearchOptions, projectPath: string = '.'): Promise<void> {
  // If no arguments, show status and prompt for action
  if (!options.type && !options.topic) {
    await showResearchStatus(projectPath);
    
    console.log();
    console.log(chalk.bold('Available research types:'));
    console.log();
    
    Object.entries(RESEARCH_TYPES).forEach(([key, info]) => {
      console.log(`${chalk.cyan(key.padEnd(12))} ${info.description}`);
    });
    
    console.log();
    console.log(chalk.gray('Usage:'));
    console.log(`  /spool-research <type> <topic>`);
    console.log(`  /spool-research <type>           (will prompt for topic)`);
    console.log(`  /spool-research                   (shows status and options)`);
    
    return;
  }

  // If type provided but no topic, prompt for topic
  if (options.type && !options.topic) {
    const topic = await promptForTopic();
    await generateResearchFile(options.type, topic, projectPath);
    return;
  }

  // If topic provided but no type, prompt for type
  if (options.topic && !options.type) {
    const type = await promptForResearchType();
    await generateResearchFile(type, options.topic, projectPath);
    return;
  }

  // If both provided, generate directly
  if (options.type && options.topic) {
    await generateResearchFile(options.type, options.topic, projectPath);
    return;
  }
}

/**
 * Register the research command
 */
export function registerResearchCommand(program: Command): void {
  program
    .command('spool-research [type] [topic]')
    .description('Conduct structured research - single entrypoint for all research types')
    .option('--type <type>', 'Research type: summary, stack, features, architecture, pitfalls')
    .option('--topic <topic>', 'Research topic or question')
    .action(async (typeArg?: string, topicArg?: string, cmdOptions?: { type?: string; topic?: string }) => {
      try {
        const options: ResearchOptions = {
          type: typeArg || cmdOptions?.type,
          topic: topicArg || cmdOptions?.topic,
        };
        
        await handleResearchCommand(options, process.cwd());
      } catch (error) {
        console.log();
        ora().fail(`Error: ${(error as Error).message}`);
        process.exit(1);
      }
    });
}

// Export for use in skills system
export { RESEARCH_TYPES, handleResearchCommand };