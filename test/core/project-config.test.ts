import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadProjectConfig,
  saveProjectConfig,
  getProjectorDirName,
  getProjectorPath,
  getChangesPath,
  getSpecsPath,
  getModulesPath,
  getArchivePath,
  clearProjectConfigCache,
  PROJECT_CONFIG_FILE_NAME,
} from '../../src/core/project-config.js';
import { PROJECTOR_DIR_NAME } from '../../src/core/config.js';

describe('project-config', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projector-test-'));
    clearProjectConfigCache();
  });

  afterEach(() => {
    // Clean up
    fs.rmSync(testDir, { recursive: true, force: true });
    clearProjectConfigCache();
  });

  describe('loadProjectConfig', () => {
    it('should return null if no config file exists', () => {
      const config = loadProjectConfig(testDir);
      expect(config).toBeNull();
    });

    it('should load valid config file', () => {
      const configPath = path.join(testDir, PROJECT_CONFIG_FILE_NAME);
      fs.writeFileSync(configPath, JSON.stringify({ projectPath: 'custom-specs' }));

      const config = loadProjectConfig(testDir);
      expect(config).toEqual({ projectPath: 'custom-specs' });
    });

    it('should return null for invalid JSON', () => {
      const configPath = path.join(testDir, PROJECT_CONFIG_FILE_NAME);
      fs.writeFileSync(configPath, 'invalid json');

      const config = loadProjectConfig(testDir);
      expect(config).toBeNull();
    });

    it('should cache config results', () => {
      const configPath = path.join(testDir, PROJECT_CONFIG_FILE_NAME);
      fs.writeFileSync(configPath, JSON.stringify({ projectPath: 'cached' }));

      // First load
      const config1 = loadProjectConfig(testDir);
      expect(config1?.projectPath).toBe('cached');

      // Change the file
      fs.writeFileSync(configPath, JSON.stringify({ projectPath: 'changed' }));

      // Should still return cached value
      const config2 = loadProjectConfig(testDir);
      expect(config2?.projectPath).toBe('cached');
    });
  });

  describe('saveProjectConfig', () => {
    it('should save config file', () => {
      saveProjectConfig(testDir, { projectPath: 'saved-path' });

      const configPath = path.join(testDir, PROJECT_CONFIG_FILE_NAME);
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.projectPath).toBe('saved-path');
    });

    it('should update cache after save', () => {
      saveProjectConfig(testDir, { projectPath: 'saved-path' });

      const config = loadProjectConfig(testDir);
      expect(config?.projectPath).toBe('saved-path');
    });
  });

  describe('getProjectorDirName', () => {
    it('should return default if no config', () => {
      const dirName = getProjectorDirName(testDir);
      expect(dirName).toBe(PROJECTOR_DIR_NAME);
    });

    it('should return projectPath from repo config', () => {
      const configPath = path.join(testDir, PROJECT_CONFIG_FILE_NAME);
      fs.writeFileSync(configPath, JSON.stringify({ projectPath: 'custom-projector' }));

      const dirName = getProjectorDirName(testDir);
      expect(dirName).toBe('custom-projector');
    });
  });

  describe('getProjectorPath', () => {
    it('should return absolute path with default dir name', () => {
      const specPath = getProjectorPath(testDir);
      expect(specPath).toBe(path.join(testDir, PROJECTOR_DIR_NAME));
    });

    it('should return absolute path with custom dir name', () => {
      const configPath = path.join(testDir, PROJECT_CONFIG_FILE_NAME);
      fs.writeFileSync(configPath, JSON.stringify({ projectPath: 'my-specs' }));

      const specPath = getProjectorPath(testDir);
      expect(specPath).toBe(path.join(testDir, 'my-specs'));
    });
  });

  describe('getChangesPath', () => {
    it('should return changes path under projector dir', () => {
      const changesPath = getChangesPath(testDir);
      expect(changesPath).toBe(path.join(testDir, PROJECTOR_DIR_NAME, 'changes'));
    });
  });

  describe('getSpecsPath', () => {
    it('should return specs path under projector dir', () => {
      const specsPath = getSpecsPath(testDir);
      expect(specsPath).toBe(path.join(testDir, PROJECTOR_DIR_NAME, 'specs'));
    });
  });

  describe('getModulesPath', () => {
    it('should return modules path under projector dir', () => {
      const modulesPath = getModulesPath(testDir);
      expect(modulesPath).toBe(path.join(testDir, PROJECTOR_DIR_NAME, 'modules'));
    });
  });

  describe('getArchivePath', () => {
    it('should return archive path under changes dir', () => {
      const archivePath = getArchivePath(testDir);
      expect(archivePath).toBe(path.join(testDir, PROJECTOR_DIR_NAME, 'changes', 'archive'));
    });
  });
});
