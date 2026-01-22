import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { InitCommand } from '../../src/core/init.js';
import {
  getChangesPath,
  getSpoolPath,
  getSpecsPath,
} from '../../src/core/project-config.js';

const DONE = '__done__';

type SelectionQueue = string[][];

let selectionQueue: SelectionQueue = [];

const mockPrompt = vi.fn(async () => {
  if (selectionQueue.length === 0) {
    throw new Error('No queued selections provided to init prompt.');
  }
  return selectionQueue.shift() ?? [];
});

function queueSelections(...values: string[]) {
  let current: string[] = [];
  values.forEach((value) => {
    if (value === DONE) {
      selectionQueue.push(current);
      current = [];
    } else {
      current.push(value);
    }
  });

  if (current.length > 0) {
    selectionQueue.push(current);
  }
}

function getPromptCall(index: number): any {
  const calls = mockPrompt.mock.calls as any[];
  const call = calls[index];
  if (!call) {
    throw new Error(`Missing prompt call at index ${index}`);
  }
  return call[0];
}

describe('InitCommand', () => {
  let testDir: string;
  let initCommand: InitCommand;
  let prevCodexHome: string | undefined;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `spool-init-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    selectionQueue = [];
    mockPrompt.mockReset();
    initCommand = new InitCommand({ prompt: mockPrompt });

    prevCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = path.join(testDir, '.codex');

    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    vi.restoreAllMocks();
    if (prevCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = prevCodexHome;
  });

  describe('execute', () => {
    it('should create Spool directory structure', async () => {
      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      const spoolPath = getSpoolPath(testDir);
      expect(await directoryExists(spoolPath)).toBe(true);
      expect(await directoryExists(getSpecsPath(testDir))).toBe(true);
      expect(await directoryExists(getChangesPath(testDir))).toBe(true);
      expect(
        await directoryExists(path.join(getChangesPath(testDir), 'archive'))
      ).toBe(true);
    });

    it('should create AGENTS.md and project.md', async () => {
      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      const spoolPath = getSpoolPath(testDir);
      expect(await fileExists(path.join(spoolPath, 'AGENTS.md'))).toBe(true);
      expect(await fileExists(path.join(spoolPath, 'project.md'))).toBe(true);

      const agentsContent = await fs.readFile(
        path.join(spoolPath, 'AGENTS.md'),
        'utf-8'
      );
      expect(agentsContent).toContain('Spool Instructions');

      const projectContent = await fs.readFile(
        path.join(spoolPath, 'project.md'),
        'utf-8'
      );
      expect(projectContent).toContain('Project Context');
    });

    it('should install Spool skills by default', async () => {
      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      const skillsDir = path.join(testDir, '.claude/skills');
      const proposalSkill = path.join(
        skillsDir,
        'spool-proposal',
        'SKILL.md'
      );
      const researchSkill = path.join(
        skillsDir,
        'spool-research',
        'SKILL.md'
      );

      expect(await fileExists(proposalSkill)).toBe(true);
      expect(await fileExists(researchSkill)).toBe(true);
    });

    it('should create CLAUDE.md when Claude Code is selected', async () => {
      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      const claudePath = path.join(testDir, 'CLAUDE.md');
      expect(await fileExists(claudePath)).toBe(true);

      const content = await fs.readFile(claudePath, 'utf-8');
      expect(content).toContain('<!-- SPOOL:START -->');
      expect(content).toContain('@/.spool/AGENTS.md');
      expect(content).toContain('spool update');
      expect(content).toContain('<!-- SPOOL:END -->');
    });

    it('should always create AGENTS.md in project root', async () => {
      queueSelections(DONE);

      await initCommand.execute(testDir);

      const rootAgentsPath = path.join(testDir, 'AGENTS.md');
      expect(await fileExists(rootAgentsPath)).toBe(true);

      const content = await fs.readFile(rootAgentsPath, 'utf-8');
      expect(content).toContain('<!-- SPOOL:START -->');
      expect(content).toContain('@/.spool/AGENTS.md');
      expect(content).toContain('spool update');
      expect(content).toContain('<!-- SPOOL:END -->');
    });

    it('should create Claude slash command files with templates', async () => {
      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      const claudeProposal = path.join(
        testDir,
        '.claude/commands/spool/proposal.md'
      );
      const claudeApply = path.join(
        testDir,
        '.claude/commands/spool/apply.md'
      );
      const claudeArchive = path.join(
        testDir,
        '.claude/commands/spool/archive.md'
      );
      const claudeResearch = path.join(
        testDir,
        '.claude/commands/spool/research.md'
      );
      const claudeReview = path.join(
        testDir,
        '.claude/commands/spool/review.md'
      );

      expect(await fileExists(claudeProposal)).toBe(true);
      expect(await fileExists(claudeApply)).toBe(true);
      expect(await fileExists(claudeArchive)).toBe(true);
      expect(await fileExists(claudeResearch)).toBe(true);
      expect(await fileExists(claudeReview)).toBe(true);

      const proposalContent = await fs.readFile(claudeProposal, 'utf-8');
      expect(proposalContent).toContain('name: Spool: Proposal');
      expect(proposalContent).toContain('<!-- SPOOL:START -->');

      const applyContent = await fs.readFile(claudeApply, 'utf-8');
      expect(applyContent).toContain('name: Spool: Apply');

      const archiveContent = await fs.readFile(claudeArchive, 'utf-8');
      expect(archiveContent).toContain('name: Spool: Archive');

      const researchContent = await fs.readFile(claudeResearch, 'utf-8');
      expect(researchContent).toContain('name: Spool: Research');
      expect(researchContent).toContain('Use the Spool agent skill');

      const reviewContent = await fs.readFile(claudeReview, 'utf-8');
      expect(reviewContent).toContain('name: Spool: Review');
      expect(reviewContent).toContain('Use the Spool agent skill');
    });

    it('should create OpenCode slash command files with templates', async () => {
      queueSelections('opencode', DONE);

      await initCommand.execute(testDir);

      const openCodeProposal = path.join(
        testDir,
        '.opencode/commands/spool-proposal.md'
      );
      const openCodeApply = path.join(
        testDir,
        '.opencode/commands/spool-apply.md'
      );
      const openCodeArchive = path.join(
        testDir,
        '.opencode/commands/spool-archive.md'
      );
      const openCodeResearch = path.join(
        testDir,
        '.opencode/commands/spool-research.md'
      );
      const openCodeReview = path.join(
        testDir,
        '.opencode/commands/spool-review.md'
      );

      expect(await fileExists(openCodeProposal)).toBe(true);
      expect(await fileExists(openCodeApply)).toBe(true);
      expect(await fileExists(openCodeArchive)).toBe(true);
      expect(await fileExists(openCodeResearch)).toBe(true);
      expect(await fileExists(openCodeReview)).toBe(true);

      const proposalContent = await fs.readFile(openCodeProposal, 'utf-8');
      expect(proposalContent).toContain(
        'description: Scaffold a new Spool change and validate strictly.'
      );
      expect(proposalContent).toContain('<!-- SPOOL:START -->');

      const researchContent = await fs.readFile(openCodeResearch, 'utf-8');
      expect(researchContent).toContain('Spool research via skills');

      const reviewContent = await fs.readFile(openCodeReview, 'utf-8');
      expect(reviewContent).toContain('Spool review skill');
    });

    it('should create Codex prompts with templates and placeholders', async () => {
      queueSelections('codex', DONE);

      await initCommand.execute(testDir);

      const proposalPath = path.join(
        testDir,
        '.codex/prompts/spool-proposal.md'
      );
      const applyPath = path.join(
        testDir,
        '.codex/prompts/spool-apply.md'
      );
      const archivePath = path.join(
        testDir,
        '.codex/prompts/spool-archive.md'
      );
      const researchPath = path.join(
        testDir,
        '.codex/prompts/spool-research.md'
      );
      const reviewPath = path.join(
        testDir,
        '.codex/prompts/spool-review.md'
      );

      expect(await fileExists(proposalPath)).toBe(true);
      expect(await fileExists(applyPath)).toBe(true);
      expect(await fileExists(archivePath)).toBe(true);
      expect(await fileExists(researchPath)).toBe(true);
      expect(await fileExists(reviewPath)).toBe(true);

      const proposalContent = await fs.readFile(proposalPath, 'utf-8');
      expect(proposalContent).toContain('argument-hint: request or feature description');
      expect(proposalContent).toContain('$ARGUMENTS');

      const researchContent = await fs.readFile(researchPath, 'utf-8');
      expect(researchContent).toContain('Spool research via skills');

      const reviewContent = await fs.readFile(reviewPath, 'utf-8');
      expect(reviewContent).toContain('Spool review skill');
    });

    it('should create GitHub Copilot prompt files with templates', async () => {
      queueSelections('github-copilot', DONE);

      await initCommand.execute(testDir);

      const proposalPath = path.join(
        testDir,
        '.github/prompts/spool-proposal.prompt.md'
      );
      const applyPath = path.join(
        testDir,
        '.github/prompts/spool-apply.prompt.md'
      );
      const archivePath = path.join(
        testDir,
        '.github/prompts/spool-archive.prompt.md'
      );
      const researchPath = path.join(
        testDir,
        '.github/prompts/spool-research.prompt.md'
      );
      const reviewPath = path.join(
        testDir,
        '.github/prompts/spool-review.prompt.md'
      );

      expect(await fileExists(proposalPath)).toBe(true);
      expect(await fileExists(applyPath)).toBe(true);
      expect(await fileExists(archivePath)).toBe(true);
      expect(await fileExists(researchPath)).toBe(true);
      expect(await fileExists(reviewPath)).toBe(true);

      const proposalContent = await fs.readFile(proposalPath, 'utf-8');
      expect(proposalContent).toContain('description: Scaffold a new Spool change and validate strictly.');
      expect(proposalContent).toContain('$ARGUMENTS');

      const researchContent = await fs.readFile(researchPath, 'utf-8');
      expect(researchContent).toContain('Spool research via skills');

      const reviewContent = await fs.readFile(reviewPath, 'utf-8');
      expect(reviewContent).toContain('Spool review skill');
    });

    it('should add new tool when Spool already exists', async () => {
      queueSelections('claude', DONE, 'opencode', DONE);
      await initCommand.execute(testDir);
      await initCommand.execute(testDir);

      const openCodeProposal = path.join(
        testDir,
        '.opencode/commands/spool-proposal.md'
      );
      expect(await fileExists(openCodeProposal)).toBe(true);
    });

    it('should allow extend mode with no additional native tools', async () => {
      queueSelections('claude', DONE, DONE);
      await initCommand.execute(testDir);
      await expect(initCommand.execute(testDir)).resolves.toBeUndefined();
    });

    it('should recreate deleted spool/AGENTS.md in extend mode', async () => {
      await testFileRecreationInExtendMode(
        testDir,
        initCommand,
        '.spool/AGENTS.md',
        'Spool Instructions'
      );
    });

    it('should recreate deleted spool/project.md in extend mode', async () => {
      await testFileRecreationInExtendMode(
        testDir,
        initCommand,
        '.spool/project.md',
        'Project Context'
      );
    });

    it('should preserve existing template files in extend mode', async () => {
      queueSelections('claude', DONE, DONE);

      await initCommand.execute(testDir);

      const agentsPath = path.join(getSpoolPath(testDir), 'AGENTS.md');
      const customContent = '# My Custom AGENTS Content\nDo not overwrite this!';

      await fs.writeFile(agentsPath, customContent);

      await initCommand.execute(testDir);

      const content = await fs.readFile(agentsPath, 'utf-8');
      expect(content).toBe(customContent);
      expect(content).not.toContain('Spool Instructions');
    });

    it('should display success message with selected tool name', async () => {
      queueSelections('claude', DONE);
      const logSpy = vi.spyOn(console, 'log');

      await initCommand.execute(testDir);

      const calls = logSpy.mock.calls.flat().join('\n');
      expect(calls).toContain('Copy these prompts to Claude Code');
      expect(calls).toContain('Please read .spool/project.md');
      expect(calls).toContain('Spool workflow from .spool/AGENTS.md');
    });
  });

  describe('AI tool selection', () => {
    it('should prompt for AI tool selection', async () => {
      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      expect(mockPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          baseMessage: expect.stringContaining(
            'Which natively supported AI tools do you use?'
          ),
        })
      );
    });

    it('should mark existing tools as already configured during extend mode', async () => {
      queueSelections('claude', DONE, 'opencode', DONE);
      await initCommand.execute(testDir);
      await initCommand.execute(testDir);

      const secondRunArgs = getPromptCall(1);
      const claudeChoice = secondRunArgs.choices.find(
        (choice: any) => choice.value === 'claude'
      );
      expect(claudeChoice.configured).toBe(true);
    });

    it('should mark Codex as already configured during extend mode', async () => {
      queueSelections('codex', DONE, 'codex', DONE);
      await initCommand.execute(testDir);
      await initCommand.execute(testDir);

      const secondRunArgs = getPromptCall(1);
      const codexChoice = secondRunArgs.choices.find(
        (choice: any) => choice.value === 'codex'
      );
      expect(codexChoice.configured).toBe(true);
    });
  });

  describe('non-interactive mode', () => {
    it('should select all available tools with --tools all option', async () => {
      const nonInteractiveCommand = new InitCommand({ tools: 'all' });

      await nonInteractiveCommand.execute(testDir);

      const claudePath = path.join(testDir, 'CLAUDE.md');
      const openCodeProposal = path.join(
        testDir,
        '.opencode/commands/spool-proposal.md'
      );
      const codexProposal = path.join(
        testDir,
        '.codex/prompts/spool-proposal.md'
      );
      const copilotProposal = path.join(
        testDir,
        '.github/prompts/spool-proposal.prompt.md'
      );

      expect(await fileExists(claudePath)).toBe(true);
      expect(await fileExists(openCodeProposal)).toBe(true);
      expect(await fileExists(codexProposal)).toBe(true);
      expect(await fileExists(copilotProposal)).toBe(true);
    });

    it('should select specific tools with --tools option', async () => {
      const nonInteractiveCommand = new InitCommand({ tools: 'claude,codex' });

      await nonInteractiveCommand.execute(testDir);

      const claudePath = path.join(testDir, 'CLAUDE.md');
      const openCodeProposal = path.join(
        testDir,
        '.opencode/commands/spool-proposal.md'
      );
      const codexProposal = path.join(
        testDir,
        '.codex/prompts/spool-proposal.md'
      );

      expect(await fileExists(claudePath)).toBe(true);
      expect(await fileExists(codexProposal)).toBe(true);
      expect(await fileExists(openCodeProposal)).toBe(false);
    });

    it('should skip tool configuration with --tools none option', async () => {
      const nonInteractiveCommand = new InitCommand({ tools: 'none' });

      await nonInteractiveCommand.execute(testDir);

      const claudePath = path.join(testDir, 'CLAUDE.md');
      const openCodeProposal = path.join(
        testDir,
        '.opencode/commands/spool-proposal.md'
      );

      const rootAgentsPath = path.join(testDir, 'AGENTS.md');
      expect(await fileExists(rootAgentsPath)).toBe(true);
      expect(await fileExists(claudePath)).toBe(false);
      expect(await fileExists(openCodeProposal)).toBe(false);
    });

    it('should throw error for invalid tool names', async () => {
      const nonInteractiveCommand = new InitCommand({ tools: 'invalid-tool' });

      await expect(nonInteractiveCommand.execute(testDir)).rejects.toThrow(
        /Invalid tool\(s\): invalid-tool\. Available values: /
      );
    });

    it('should handle comma-separated tool names with spaces', async () => {
      const nonInteractiveCommand = new InitCommand({ tools: 'claude, codex' });

      await nonInteractiveCommand.execute(testDir);

      const claudePath = path.join(testDir, 'CLAUDE.md');
      const codexProposal = path.join(
        testDir,
        '.codex/prompts/spool-proposal.md'
      );

      expect(await fileExists(claudePath)).toBe(true);
      expect(await fileExists(codexProposal)).toBe(true);
    });

    it('should reject combining reserved keywords with explicit tool ids', async () => {
      const nonInteractiveCommand = new InitCommand({ tools: 'all,claude' });

      await expect(nonInteractiveCommand.execute(testDir)).rejects.toThrow(
        /Cannot combine reserved values "all" or "none" with specific tool IDs/
      );
    });
  });

  describe('already configured detection', () => {
    it('should NOT show tools as already configured in fresh project with existing CLAUDE.md', async () => {
      const claudePath = path.join(testDir, 'CLAUDE.md');
      await fs.writeFile(claudePath, '# My Custom Claude Instructions\n');

      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      const firstCallArgs = getPromptCall(0);
      const claudeChoice = firstCallArgs.choices.find(
        (choice: any) => choice.value === 'claude'
      );

      expect(claudeChoice.configured).toBe(false);
    });

    it('should NOT show tools as already configured in fresh project with existing slash commands', async () => {
      const customCommandDir = path.join(testDir, '.claude/commands/custom');
      await fs.mkdir(customCommandDir, { recursive: true });
      await fs.writeFile(
        path.join(customCommandDir, 'mycommand.md'),
        '# My Custom Command\n'
      );

      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      const firstCallArgs = getPromptCall(0);
      const claudeChoice = firstCallArgs.choices.find(
        (choice: any) => choice.value === 'claude'
      );

      expect(claudeChoice.configured).toBe(false);
    });

    it('should show tools as already configured in extend mode', async () => {
      queueSelections('claude', DONE);
      await initCommand.execute(testDir);

      queueSelections('opencode', DONE);
      await initCommand.execute(testDir);

      const secondCallArgs = getPromptCall(1);
      const claudeChoice = secondCallArgs.choices.find(
        (choice: any) => choice.value === 'claude'
      );

      expect(claudeChoice.configured).toBe(true);
    });

    it('should NOT show already configured for Codex in fresh init even with global prompts', async () => {
      const codexPromptsDir = path.join(testDir, '.codex/prompts');
      await fs.mkdir(codexPromptsDir, { recursive: true });
      await fs.writeFile(
        path.join(codexPromptsDir, 'spool-proposal.md'),
        '# Existing prompt\n'
      );

      queueSelections('claude', DONE);

      await initCommand.execute(testDir);

      const firstCallArgs = getPromptCall(0);
      const codexChoice = firstCallArgs.choices.find(
        (choice: any) => choice.value === 'codex'
      );

      expect(codexChoice.configured).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error for insufficient permissions', async () => {
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);

      const originalCheck = fs.writeFile;
      vi.spyOn(fs, 'writeFile').mockImplementation(
        async (filePath: any, ...args: any[]) => {
          if (
            typeof filePath === 'string' &&
            filePath.includes('.spool-test-')
          ) {
            throw new Error('EACCES: permission denied');
          }
          return originalCheck.call(fs, filePath, ...args);
        }
      );

      queueSelections('claude', DONE);
      await expect(initCommand.execute(readOnlyDir)).rejects.toThrow(
        /Insufficient permissions/
      );
    });
  });
});

async function testFileRecreationInExtendMode(
  testDir: string,
  initCommand: InitCommand,
  relativePath: string,
  expectedContent: string
): Promise<void> {
  queueSelections('claude', DONE, DONE);

  await initCommand.execute(testDir);

  const filePath = path.join(testDir, relativePath);
  expect(await fileExists(filePath)).toBe(true);

  await fs.unlink(filePath);
  expect(await fileExists(filePath)).toBe(false);

  await initCommand.execute(testDir);
  expect(await fileExists(filePath)).toBe(true);

  const content = await fs.readFile(filePath, 'utf-8');
  expect(content).toContain(expectedContent);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
