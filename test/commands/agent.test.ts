import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { runCLI } from '../helpers/run-cli.js';
import { getChangesPath } from '../../src/core/project-config.js';

describe('agent CLI commands', () => {
  let tempDir: string;
  let changesDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spool-agent-'));
    changesDir = getChangesPath(tempDir);
    await fs.mkdir(changesDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  async function createTestChange(changeName: string): Promise<string> {
    const changeDir = path.join(changesDir, changeName);
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      '## Why\nTest proposal.\n\n## What Changes\n- **test:** Something'
    );
    return changeDir;
  }

  describe('agent command group', () => {
    it('shows help for agent command', async () => {
      const result = await runCLI(['agent', '--help'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Commands that generate machine-readable output for AI agents');
      expect(result.stdout).toContain('instruction');
    });

    it('shows instruction subcommand in help', async () => {
      const result = await runCLI(['agent', 'instruction', '--help'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Generate enriched instructions');
    });
  });

  describe('agent instruction command', () => {
    it('generates instructions for proposal artifact', async () => {
      await createTestChange('test-change');
      const result = await runCLI(
        ['agent', 'instruction', 'proposal', '--change', 'test-change'],
        { cwd: tempDir }
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('artifact');
      expect(result.stdout).toContain('proposal');
    });

    it('outputs valid JSON with --json flag', async () => {
      await createTestChange('test-change');
      const result = await runCLI(
        ['agent', 'instruction', 'proposal', '--change', 'test-change', '--json'],
        { cwd: tempDir }
      );
      expect(result.exitCode).toBe(0);
      
      // Parse JSON to verify it's valid
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty('artifactId');
      expect(parsed.artifactId).toBe('proposal');
      expect(parsed).toHaveProperty('instruction');
    });

    it('errors on invalid artifact name', async () => {
      await createTestChange('test-change');
      const result = await runCLI(
        ['agent', 'instruction', 'invalid-artifact', '--change', 'test-change'],
        { cwd: tempDir }
      );
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('x-instructions deprecation', () => {
    it('shows deprecation warning for x-instructions', async () => {
      await createTestChange('test-change');
      const result = await runCLI(
        ['x-instructions', 'proposal', '--change', 'test-change'],
        { cwd: tempDir }
      );
      expect(result.stderr).toContain('deprecated');
      expect(result.stderr).toContain('spool agent instruction');
    });

    it('deprecation warning does not break JSON output', async () => {
      await createTestChange('test-change');
      const result = await runCLI(
        ['x-instructions', 'proposal', '--change', 'test-change', '--json'],
        { cwd: tempDir }
      );
      
      // stderr should have warning
      expect(result.stderr).toContain('deprecated');
      
      // stdout should still be valid JSON
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty('artifactId');
      expect(parsed.artifactId).toBe('proposal');
    });
  });
});
