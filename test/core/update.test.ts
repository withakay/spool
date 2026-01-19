import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UpdateCommand } from '../../src/core/update.js';
import { FileSystemUtils } from '../../src/utils/file-system.js';
import { getProjectorPath } from '../../src/core/project-config.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { randomUUID } from 'crypto';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe('UpdateCommand', () => {
  let testDir: string;
  let updateCommand: UpdateCommand;
  let prevCodexHome: string | undefined;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `projector-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });

    const projectorDir = getProjectorPath(testDir);
    await fs.mkdir(projectorDir, { recursive: true });

    updateCommand = new UpdateCommand();

    prevCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = path.join(testDir, '.codex');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    if (prevCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = prevCodexHome;
  });

  it('should update only existing CLAUDE.md file', async () => {
    const claudePath = path.join(testDir, 'CLAUDE.md');
    const initialContent = `# Project Instructions

Some existing content here.

<!-- PROJECTOR:START -->
Old Projector content
<!-- PROJECTOR:END -->

More content after.`;
    await fs.writeFile(claudePath, initialContent);

    const consoleSpy = vi.spyOn(console, 'log');

    await updateCommand.execute(testDir);

    const updatedContent = await fs.readFile(claudePath, 'utf-8');
    expect(updatedContent).toContain('<!-- PROJECTOR:START -->');
    expect(updatedContent).toContain('<!-- PROJECTOR:END -->');
    expect(updatedContent).toContain('@/.projector/AGENTS.md');
    expect(updatedContent).toContain('projector update');
    expect(updatedContent).toContain('Some existing content here');
    expect(updatedContent).toContain('More content after');

    const [logMessage] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain(
      'Updated Projector instructions (.projector/AGENTS.md'
    );
    expect(logMessage).toContain('AGENTS.md (created)');
    expect(logMessage).toContain('Updated AI tool files: CLAUDE.md');
    consoleSpy.mockRestore();
  });

  it('should refresh existing Claude slash command files', async () => {
    const proposalPath = path.join(
      testDir,
      '.claude/commands/projector/proposal.md'
    );
    await fs.mkdir(path.dirname(proposalPath), { recursive: true });
    const initialContent = `---
name: Projector: Proposal
description: Old description
category: Projector
tags: [projector, change]
---
<!-- PROJECTOR:START -->
Old slash content
<!-- PROJECTOR:END -->`;
    await fs.writeFile(proposalPath, initialContent);

    await updateCommand.execute(testDir);

    const updated = await fs.readFile(proposalPath, 'utf-8');
    expect(updated).toContain('name: Projector: Proposal');
    expect(updated).toContain('Use the Projector agent skill `projector-proposal`');
    expect(updated).not.toContain('Old slash content');
  });

  it('should refresh existing OpenCode slash command files', async () => {
    const researchPath = path.join(
      testDir,
      '.opencode/command/projector-research.md'
    );
    await fs.mkdir(path.dirname(researchPath), { recursive: true });
    const initialContent = `---
 description: Old description
 ---
<!-- PROJECTOR:START -->
Old slash content
<!-- PROJECTOR:END -->`;
    await fs.writeFile(researchPath, initialContent);

    await updateCommand.execute(testDir);

    const updated = await fs.readFile(researchPath, 'utf-8');
    expect(updated).toContain('Use the Projector agent skill `projector-research`');
    expect(updated).not.toContain('Old slash content');
  });

  it('should refresh existing Codex prompts', async () => {
    const applyPath = path.join(
      testDir,
      '.codex/prompts/projector-apply.md'
    );
    await fs.mkdir(path.dirname(applyPath), { recursive: true });
    const initialContent = `---
 description: Old description
 ---
<!-- PROJECTOR:START -->
Old body
<!-- PROJECTOR:END -->`;
    await fs.writeFile(applyPath, initialContent);

    await updateCommand.execute(testDir);

    const updated = await fs.readFile(applyPath, 'utf-8');
    expect(updated).toContain('Use the Projector agent skill `projector-apply`');
    expect(updated).not.toContain('Old body');
  });

  it('should refresh existing GitHub Copilot prompts', async () => {
    const reviewPath = path.join(
      testDir,
      '.github/prompts/projector-review.prompt.md'
    );
    await fs.mkdir(path.dirname(reviewPath), { recursive: true });
    const initialContent = `---
 description: Old description
 ---
<!-- PROJECTOR:START -->
Old content
<!-- PROJECTOR:END -->`;
    await fs.writeFile(reviewPath, initialContent);

    await updateCommand.execute(testDir);

    const updated = await fs.readFile(reviewPath, 'utf-8');
    expect(updated).toContain('Use the Projector agent skill `projector-review`');
    expect(updated).not.toContain('Old content');
  });

  it('should not create CLAUDE.md if it does not exist', async () => {
    const claudePath = path.join(testDir, 'CLAUDE.md');

    await updateCommand.execute(testDir);

    const exists = await FileSystemUtils.fileExists(claudePath);
    expect(exists).toBe(false);
  });

  it('should not create missing slash command files on update', async () => {
    await updateCommand.execute(testDir);

    const proposalPath = path.join(
      testDir,
      '.opencode/command/projector-proposal.md'
    );
    expect(await fileExists(proposalPath)).toBe(false);
  });
});
