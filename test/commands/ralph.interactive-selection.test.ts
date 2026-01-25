import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { runCLI } from '../helpers/run-cli.js';
import { getChangesPath, getModulesPath, getSpoolPath } from '../../src/core/project-config.js';

// Mock @inquirer/prompts to avoid actual interactive prompts
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  confirm: vi.fn(),
  input: vi.fn(),
}));

// Mock the ralph runner to avoid actual AI execution
vi.mock('../../src/core/ralph/runner.js', () => ({
  runRalphLoop: vi.fn(),
}));

describe('ralph command - interactive selection and module inference', () => {
  let tempDir: string;
  let originalCwd: string;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(os.tmpdir(), `spool-ralph-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Save original cwd and change to temp directory
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Create Spool structure
    const spoolDir = getSpoolPath(tempDir);
    await fs.mkdir(getChangesPath(tempDir), { recursive: true });
    await fs.mkdir(getModulesPath(tempDir), { recursive: true });
    
    // Suppress console output during tests
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(async () => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Restore original cwd
    process.chdir(originalCwd);
    
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('when --change is omitted and interactive', () => {
    it('should prompt for change selection when multiple changes exist', async () => {
      // Create multiple changes
      await fs.mkdir(path.join(getChangesPath(tempDir), '001-01_add-auth'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-01_add-auth', 'proposal.md'),
        '# Change: Add Authentication\n\n## Why\nNeed auth.\n\n## What Changes\n- **auth:** Add login',
        'utf-8'
      );

      await fs.mkdir(path.join(getChangesPath(tempDir), '002-01_refactor-ui'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '002-01_refactor-ui', 'proposal.md'),
        '# Change: Refactor UI\n\n## Why\nClean up.\n\n## What Changes\n- **ui:** Update components',
        'utf-8'
      );

      // Mock inquirer select to choose the first change
      const { select } = await import('@inquirer/prompts');
      vi.mocked(select).mockResolvedValueOnce('001-01_add-auth');

      // Mock ralph runner to avoid actual execution
      const { runRalphLoop } = await import('../../src/core/ralph/runner.js');
      vi.mocked(runRalphLoop).mockResolvedValueOnce(undefined);

      const result = await runCLI(['ralph', 'implement auth'], {
        cwd: tempDir,
        env: { SPOOL_INTERACTIVE: '1', SPOOL_RUN_CLI_IN_PROCESS: '1' }, // Force interactive mode
      });

      expect(result.exitCode).toBe(0);
      expect(select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a change to run Ralph against',
          choices: [
            { name: '001-01_add-auth', value: '001-01_add-auth' },
            { name: '002-01_refactor-ui', value: '002-01_refactor-ui' },
          ],
        })
      );
      expect(runRalphLoop).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'implement auth',
          changeId: '001-01_add-auth',
        })
      );
    });

    it('should auto-select single change when only one exists', async () => {
      // Create only one change
      await fs.mkdir(path.join(getChangesPath(tempDir), '001-01_add-auth'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-01_add-auth', 'proposal.md'),
        '# Change: Add Authentication\n\n## Why\nNeed auth.\n\n## What Changes\n- **auth:** Add login',
        'utf-8'
      );

      // Mock ralph runner
      const { runRalphLoop } = await import('../../src/core/ralph/runner.js');
      vi.mocked(runRalphLoop).mockResolvedValueOnce(undefined);

      const result = await runCLI(['ralph', 'implement auth'], {
        cwd: tempDir,
        env: { SPOOL_INTERACTIVE: '1', SPOOL_RUN_CLI_IN_PROCESS: '1' },
      });

      expect(result.exitCode).toBe(0);
      
      // Should not prompt when only one change exists
      const { select } = await import('@inquirer/prompts');
      expect(select).not.toHaveBeenCalled();
      
      expect(runRalphLoop).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'implement auth',
          changeId: '001-01_add-auth',
        })
      );
    });

    it('should show error when no changes exist and interactive', async () => {
      const result = await runCLI(['ralph', 'implement something'], {
        cwd: tempDir,
        env: { SPOOL_INTERACTIVE: '1', SPOOL_RUN_CLI_IN_PROCESS: '1' },
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No changes found');
    });
  });

  describe('when --module is provided but --change is omitted', () => {
    beforeEach(async () => {
      // Create a module
      await fs.mkdir(path.join(getModulesPath(tempDir), '001_auth'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '001_auth', 'module.md'),
        '# Module: Authentication\n\n## Changes\n- 001-01_add-auth\n- 001-02_improve-login',
        'utf-8'
      );

      // Create changes for the module
      await fs.mkdir(path.join(getChangesPath(tempDir), '001-01_add-auth'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-01_add-auth', 'proposal.md'),
        '# Change: Add Authentication\n\n## Why\nNeed auth.\n\n## What Changes\n- **auth:** Add login',
        'utf-8'
      );

      await fs.mkdir(path.join(getChangesPath(tempDir), '001-02_improve-login'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-02_improve-login', 'proposal.md'),
        '# Change: Improve Login\n\n## Why\nBetter UX.\n\n## What Changes\n- **auth:** Update login flow',
        'utf-8'
      );
    });

    it('should filter changes by module and prompt when multiple module changes exist', async () => {
      // Add a change from another module
      await fs.mkdir(path.join(getModulesPath(tempDir), '002_ui'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '002_ui', 'module.md'),
        '# Module: UI\n\n## Changes\n- 002-01_update-buttons',
        'utf-8'
      );

      await fs.mkdir(path.join(getChangesPath(tempDir), '002-01_update-buttons'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '002-01_update-buttons', 'proposal.md'),
        '# Change: Update Buttons\n\n## Why\nModern design.\n\n## What Changes\n- **ui:** Update button components',
        'utf-8'
      );

      // Mock inquirer select to choose from module changes
      const { select } = await import('@inquirer/prompts');
      vi.mocked(select).mockResolvedValueOnce('001-01_add-auth');

      // Mock ralph runner
      const { runRalphLoop } = await import('../../src/core/ralph/runner.js');
      vi.mocked(runRalphLoop).mockResolvedValueOnce(undefined);

      const result = await runCLI(['ralph', '--module', '001', 'work on auth'], {
        cwd: tempDir,
        env: { SPOOL_INTERACTIVE: '1', SPOOL_RUN_CLI_IN_PROCESS: '1' },
      });

      expect(result.exitCode).toBe(0);
      expect(select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a change from module 001',
          choices: [
            { name: '001-01_add-auth', value: '001-01_add-auth' },
            { name: '001-02_improve-login', value: '001-02_improve-login' },
          ],
        })
      );
      expect(runRalphLoop).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'work on auth',
          changeId: '001-01_add-auth',
          moduleId: '001',
        })
      );
    });

    it('should auto-select when only one change exists in module', async () => {
      // Remove one of the module changes so only a single candidate remains
      await fs.rm(path.join(getChangesPath(tempDir), '001-02_improve-login'), { recursive: true, force: true });

      // Mock ralph runner
      const { runRalphLoop } = await import('../../src/core/ralph/runner.js');
      vi.mocked(runRalphLoop).mockResolvedValueOnce(undefined);

      const result = await runCLI(['ralph', '--module', '001', 'improve auth'], {
        cwd: tempDir,
        env: { SPOOL_INTERACTIVE: '1', SPOOL_RUN_CLI_IN_PROCESS: '1' },
      });

      expect(result.exitCode).toBe(0);
      
      // Should not prompt when only one change exists in module
      const { select } = await import('@inquirer/prompts');
      expect(select).not.toHaveBeenCalled();
      
      expect(runRalphLoop).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'improve auth',
          changeId: expect.any(String), // Should be one of the module changes
          moduleId: '001',
        })
      );
    });

    it('should show error when no changes exist for module', async () => {
      // Create empty module
      await fs.mkdir(path.join(getModulesPath(tempDir), '003_empty'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '003_empty', 'module.md'),
        '# Module: Empty\n\n## Changes\n(None)',
        'utf-8'
      );

      const result = await runCLI(['ralph', '--module', '003', 'work on empty'], {
        cwd: tempDir,
        env: { SPOOL_INTERACTIVE: '1', SPOOL_RUN_CLI_IN_PROCESS: '1' },
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No changes found for module');
    });
  });

  describe('when non-interactive mode', () => {
    it('should show error when --change omitted in non-interactive mode', async () => {
      const result = await runCLI(['ralph', 'implement something'], {
        cwd: tempDir,
        env: { SPOOL_INTERACTIVE: '0', SPOOL_RUN_CLI_IN_PROCESS: '1' }, // Force non-interactive
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Either --change, --module, --status, --add-context, or --clear-context must be specified');
    });

    it('should show error when --change omitted in CI environment', async () => {
      const result = await runCLI(['ralph', 'implement something'], {
        cwd: tempDir,
        env: { CI: 'true', SPOOL_RUN_CLI_IN_PROCESS: '1' }, // CI environment forces non-interactive
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Either --change, --module, --status, --add-context, or --clear-context must be specified');
    });
  });

  describe('module inference functionality', () => {
    it('should infer module from selected change', async () => {
      // Create module and change
      await fs.mkdir(path.join(getModulesPath(tempDir), '001_auth'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '001_auth', 'module.md'),
        '# Module: Authentication\n\n## Changes\n- 001-01_add-auth',
        'utf-8'
      );

      await fs.mkdir(path.join(getChangesPath(tempDir), '001-01_add-auth'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-01_add-auth', 'proposal.md'),
        '# Change: Add Authentication\n\n## Why\nNeed auth.\n\n## What Changes\n- **auth:** Add login',
        'utf-8'
      );

      // Mock inquirer select
      const { select } = await import('@inquirer/prompts');
      vi.mocked(select).mockResolvedValueOnce('001-01_add-auth');

      // Mock ralph runner
      const { runRalphLoop } = await import('../../src/core/ralph/runner.js');
      vi.mocked(runRalphLoop).mockResolvedValueOnce(undefined);

      const result = await runCLI(['ralph', 'add auth system'], {
        cwd: tempDir,
        env: { SPOOL_INTERACTIVE: '1', SPOOL_RUN_CLI_IN_PROCESS: '1' },
      });

      expect(result.exitCode).toBe(0);
      expect(runRalphLoop).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'add auth system',
          changeId: '001-01_add-auth',
          moduleId: '001', // Should be inferred from the change
        })
      );
    });
  });
});
