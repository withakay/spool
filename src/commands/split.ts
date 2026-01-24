import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { getChangesPath, loadProjectConfig } from '../core/project-config.js';
import { moveDeltaSpecs } from '../core/utils/delta-migration.js';
import fastGlob from 'fast-glob';

// Since createChangeDir is not exported or found, implementing a minimal version here
// We can refactor later to share this logic
async function createChange(changeName: string, changesPath: string) {
    const changePath = path.join(changesPath, changeName);
    const specsPath = path.join(changePath, 'specs');

    await fs.mkdir(changePath, { recursive: true });
    await fs.mkdir(specsPath, { recursive: true });
    
    // Create basic proposal.md
    const proposalContent = `# ${changeName}\n\nSplit from parent change.\n`;
    await fs.writeFile(path.join(changePath, 'proposal.md'), proposalContent);
    
    // Create basic tasks.md
    const tasksContent = `# Tasks\n\n- [ ] Initial task\n`;
    await fs.writeFile(path.join(changePath, 'tasks.md'), tasksContent);

    return changePath;
}

export class SplitCommand {
  constructor(private program: Command) {
    this.program
      .command('split [change-id]')
      .description('Split a large change into smaller changes')
      .action(async (changeId) => {
        await this.execute(changeId);
      });
  }

  async execute(changeId?: string) {
    const { select, checkbox, input } = await import('@inquirer/prompts');

    // We need project root to get config. Assuming CWD is project root or inside it.
    // getChangesPath defaults to CWD.
    const changesPath = getChangesPath();
    const projectRoot = process.cwd(); // simplified, usually we find root

     // 1. Select Change if not provided
     if (!changeId) {
        const entries = await fastGlob('*', { cwd: changesPath, onlyDirectories: true });
        // Filter out archive and dot folders
        const activeChanges = entries.filter((e: string) => !e.startsWith('.') && e !== 'archive');

       if (activeChanges.length === 0) {
         console.log(chalk.yellow('No changes found to split.'));
         return;
       }
       
       changeId = await select({
         message: 'Select a change to split:',
         choices: activeChanges.map(e => ({ name: e, value: e }))
       });
    }

    const changePath = path.join(changesPath, changeId);
    
    // 2. Parse Change to get Deltas
    const specsPath = path.join(changePath, 'specs');
    try {
      await fs.access(specsPath);
    } catch {
       console.log(chalk.red(`Change '${changeId}' has no specs directory.`));
       return;
    }

     const specFiles = (await fastGlob('**/*.md', { cwd: specsPath })) as string[];
    
    if (specFiles.length <= 1) {
       console.log(chalk.yellow(`Change '${changeId}' has only ${specFiles.length} delta(s). Nothing to split.`));
       return;
    }

    // 3. Select Deltas to Move
    const selectedSpecs = await checkbox({
      message: 'Select deltas (specs) to move to a new change:',
      choices: specFiles.map((f: string) => ({ name: f, value: f }))
    });

    if (selectedSpecs.length === 0) {
      console.log(chalk.yellow('No deltas selected. Operation cancelled.'));
      return;
    }

    // 4. Create New Change
    const newChangeName = await input({
      message: 'Enter the ID/name for the new change:',
      validate: (input) => input.trim() !== '' ? true : 'Name cannot be empty'
    });

    const newChangePath = path.join(changesPath, newChangeName);
    
    try {
      await fs.access(newChangePath);
      console.log(chalk.red(`Change '${newChangeName}' already exists.`));
      return;
    } catch {
      // Doesn't exist, proceed
    }

    // Scaffold new change
    await createChange(newChangeName, changesPath);

    // 5. Move Deltas
    console.log(chalk.blue(`Moving ${selectedSpecs.length} deltas to ${newChangeName}...`));
    
    const result = await moveDeltaSpecs(projectRoot, changeId, newChangeName, selectedSpecs);

    if (result.success) {
      console.log(chalk.green(`Successfully moved deltas to '${newChangeName}'.`));
      console.log(chalk.dim(`Moved specs: ${result.movedSpecs.join(', ')}`));
    } else {
       console.log(chalk.red('Failed to move some deltas.'));
    }
  }
}
