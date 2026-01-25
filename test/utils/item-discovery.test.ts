import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  getActiveChangeIds,
  getChangesForModule,
  getModuleInfo,
  resolveModuleId,
  resolveChangeId,
} from '../../src/utils/item-discovery.js';
import { getChangesPath, getModulesPath } from '../../src/core/project-config.js';

describe('item-discovery utilities for ralph command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(os.tmpdir(), `spool-discovery-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Save original cwd and change to temp directory
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Create Spool structure
    await fs.mkdir(getChangesPath(tempDir), { recursive: true });
    await fs.mkdir(getModulesPath(tempDir), { recursive: true });
  });

  afterEach(async () => {
    // Restore original cwd
    process.chdir(originalCwd);
    
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('getActiveChangeIds', () => {
    it('should return empty array when no changes exist', async () => {
      const changes = await getActiveChangeIds(tempDir);
      expect(changes).toEqual([]);
    });

    it('should return active change IDs', async () => {
      // Create change directories with proposals
      await fs.mkdir(path.join(getChangesPath(tempDir), '001-01_add-auth'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-01_add-auth', 'proposal.md'),
        '# Change: Add Auth\n\n## Why\nNeed auth.',
        'utf-8'
      );

      await fs.mkdir(path.join(getChangesPath(tempDir), '002-01_refactor-ui'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '002-01_refactor-ui', 'proposal.md'),
        '# Change: Refactor UI\n\n## Why\nClean up.',
        'utf-8'
      );

      // Create a directory without proposal.md (should be ignored)
      await fs.mkdir(path.join(getChangesPath(tempDir), '003-01_incomplete'), { recursive: true });

      const changes = await getActiveChangeIds(tempDir);
      expect(changes).toEqual(['001-01_add-auth', '002-01_refactor-ui']);
    });

    it('should ignore archive directory', async () => {
      await fs.mkdir(path.join(getChangesPath(tempDir), 'archive'), { recursive: true });
      await fs.mkdir(path.join(getChangesPath(tempDir), 'archive', '001-01_old-change'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), 'archive', '001-01_old-change', 'proposal.md'),
        '# Old Change\n\n## Why\nAncient.',
        'utf-8'
      );

      const changes = await getActiveChangeIds(tempDir);
      expect(changes).toEqual([]);
    });

    it('should ignore hidden directories', async () => {
      await fs.mkdir(path.join(getChangesPath(tempDir), '.hidden'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '.hidden', 'proposal.md'),
        '# Hidden Change\n\n## Why\nSecret.',
        'utf-8'
      );

      const changes = await getActiveChangeIds(tempDir);
      expect(changes).toEqual([]);
    });
  });

  describe('getChangesForModule', () => {
    beforeEach(async () => {
      // Create changes for different modules
      await fs.mkdir(path.join(getChangesPath(tempDir), '001-01_add-auth'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-01_add-auth', 'proposal.md'),
        '# Change: Add Auth\n\n## Why\nNeed auth.',
        'utf-8'
      );

      await fs.mkdir(path.join(getChangesPath(tempDir), '001-02_improve-login'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-02_improve-login', 'proposal.md'),
        '# Change: Improve Login\n\n## Why\nBetter UX.',
        'utf-8'
      );

      await fs.mkdir(path.join(getChangesPath(tempDir), '002-01_update-ui'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '002-01_update-ui', 'proposal.md'),
        '# Change: Update UI\n\n## Why\nModern design.',
        'utf-8'
      );
    });

    it('should return changes for specific module', async () => {
      const moduleChanges = await getChangesForModule('001', tempDir);
      expect(moduleChanges).toEqual(['001-01_add-auth', '001-02_improve-login']);
    });

    it('should return empty array for module with no changes', async () => {
      const moduleChanges = await getChangesForModule('003', tempDir);
      expect(moduleChanges).toEqual([]);
    });
  });

  describe('getModuleInfo', () => {
    it('should return empty array when no modules exist', async () => {
      const modules = await getModuleInfo(tempDir);
      expect(modules).toEqual([]);
    });

    it('should return module information', async () => {
      // Create modules
      await fs.mkdir(path.join(getModulesPath(tempDir), '001_auth'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '001_auth', 'module.md'),
        '# Module: Authentication',
        'utf-8'
      );

      await fs.mkdir(path.join(getModulesPath(tempDir), '002_ui'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '002_ui', 'module.md'),
        '# Module: User Interface',
        'utf-8'
      );

      // Create directory without module.md (should be ignored)
      await fs.mkdir(path.join(getModulesPath(tempDir), '003_incomplete'), { recursive: true });

      const modules = await getModuleInfo(tempDir);
      expect(modules).toHaveLength(2);
      expect(modules[0]).toEqual({
        id: '001',
        name: 'auth',
        fullName: '001_auth',
        path: path.join(getModulesPath(tempDir), '001_auth'),
      });
      expect(modules[1]).toEqual({
        id: '002',
        name: 'ui',
        fullName: '002_ui',
        path: path.join(getModulesPath(tempDir), '002_ui'),
      });
    });

    it('should ignore hidden directories', async () => {
      await fs.mkdir(path.join(getModulesPath(tempDir), '.hidden'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '.hidden', 'module.md'),
        '# Hidden Module',
        'utf-8'
      );

      const modules = await getModuleInfo(tempDir);
      expect(modules).toEqual([]);
    });

    it('should ignore directories without module.md', async () => {
      await fs.mkdir(path.join(getModulesPath(tempDir), '001_no-module'), { recursive: true });

      const modules = await getModuleInfo(tempDir);
      expect(modules).toEqual([]);
    });
  });

  describe('resolveModuleId', () => {
    beforeEach(async () => {
      // Create modules for resolution tests
      await fs.mkdir(path.join(getModulesPath(tempDir), '001_auth'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '001_auth', 'module.md'),
        '# Module: Authentication',
        'utf-8'
      );

      await fs.mkdir(path.join(getModulesPath(tempDir), '010_advanced-features'), { recursive: true });
      await fs.writeFile(
        path.join(getModulesPath(tempDir), '010_advanced-features', 'module.md'),
        '# Module: Advanced Features',
        'utf-8'
      );
    });

    it('should resolve single digit module ID', async () => {
      const resolved = await resolveModuleId('1', tempDir);
      expect(resolved).toBe('001_auth');
    });

    it('should resolve padded module ID', async () => {
      const resolved = await resolveModuleId('001', tempDir);
      expect(resolved).toBe('001_auth');
    });

    it('should resolve module ID with name', async () => {
      const resolved = await resolveModuleId('001_auth', tempDir);
      expect(resolved).toBe('001_auth');
    });

    it('should resolve two digit module ID', async () => {
      const resolved = await resolveModuleId('10', tempDir);
      expect(resolved).toBe('010_advanced-features');
    });

    it('should return null for non-existent module', async () => {
      const resolved = await resolveModuleId('999', tempDir);
      expect(resolved).toBeNull();
    });

    it('should return null for invalid ID', async () => {
      const resolved = await resolveModuleId('invalid', tempDir);
      expect(resolved).toBeNull();
    });
  });

  describe('resolveChangeId', () => {
    beforeEach(async () => {
      // Create changes for resolution tests
      await fs.mkdir(path.join(getChangesPath(tempDir), '001-01_add-auth'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '001-01_add-auth', 'proposal.md'),
        '# Change: Add Auth\n\n## Why\nNeed auth.',
        'utf-8'
      );

      await fs.mkdir(path.join(getChangesPath(tempDir), '010-05_major-refactor'), { recursive: true });
      await fs.writeFile(
        path.join(getChangesPath(tempDir), '010-05_major-refactor', 'proposal.md'),
        '# Change: Major Refactor\n\n## Why\nClean architecture.',
        'utf-8'
      );
    });

    it('should resolve minimal change ID', async () => {
      const resolved = await resolveChangeId('1-1_add-auth', tempDir);
      expect(resolved).toBe('001-01_add-auth');
    });

    it('should resolve canonical change ID', async () => {
      const resolved = await resolveChangeId('001-01_add-auth', tempDir);
      expect(resolved).toBe('001-01_add-auth');
    });

    it('should resolve change with different padding', async () => {
      const resolved = await resolveChangeId('10-5_major-refactor', tempDir);
      expect(resolved).toBe('010-05_major-refactor');
    });

    it('should return null for non-existent change', async () => {
      const resolved = await resolveChangeId('999-99_nonexistent', tempDir);
      expect(resolved).toBeNull();
    });

    it('should return null for invalid ID', async () => {
      const resolved = await resolveChangeId('invalid', tempDir);
      expect(resolved).toBeNull();
    });
  });
});