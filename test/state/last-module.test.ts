import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getLastModuleId,
  setLastModuleId,
  getLastChangeName,
  setLastChangeName,
  clearState,
} from '../../src/state/last-module.js';

describe('last-module state tracking', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spool-test-'));
    // Create .spool/.state directory (the state file location)
    fs.mkdirSync(path.join(tempDir, '.spool', '.state'), { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getLastModuleId', () => {
    it('should return null when no state exists', () => {
      const result = getLastModuleId(tempDir);
      expect(result).toBeNull();
    });

    it('should return the last module ID when set', () => {
      setLastModuleId('001', tempDir);
      const result = getLastModuleId(tempDir);
      expect(result).toBe('001');
    });
  });

  describe('setLastModuleId', () => {
    it('should persist the module ID', () => {
      setLastModuleId('042', tempDir);
      
      // Read the file directly to verify
      const stateFile = path.join(tempDir, '.spool', '.state', 'session.json');
      const content = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      expect(content.lastModuleId).toBe('042');
    });

    it('should update existing state', () => {
      setLastModuleId('001', tempDir);
      setLastModuleId('002', tempDir);
      
      const result = getLastModuleId(tempDir);
      expect(result).toBe('002');
    });

    it('should create state directory if it does not exist', () => {
      const newTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spool-test-'));
      try {
        setLastModuleId('001', newTempDir);
        
        const stateFile = path.join(newTempDir, '.spool', '.state', 'session.json');
        expect(fs.existsSync(stateFile)).toBe(true);
      } finally {
        fs.rmSync(newTempDir, { recursive: true, force: true });
      }
    });
  });

  describe('getLastChangeName', () => {
    it('should return null when no state exists', () => {
      const result = getLastChangeName(tempDir);
      expect(result).toBeNull();
    });

    it('should return the last change name when set', () => {
      setLastChangeName('001-02_my-change', tempDir);
      const result = getLastChangeName(tempDir);
      expect(result).toBe('001-02_my-change');
    });
  });

  describe('setLastChangeName', () => {
    it('should persist the change name', () => {
      setLastChangeName('001-02_my-feature', tempDir);
      
      const stateFile = path.join(tempDir, '.spool', '.state', 'session.json');
      const content = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      expect(content.lastChangeName).toBe('001-02_my-feature');
    });

    it('should also extract and set the module ID from change name', () => {
      setLastChangeName('042-05_some-change', tempDir);
      
      const moduleId = getLastModuleId(tempDir);
      expect(moduleId).toBe('042');
    });

    it('should update existing state', () => {
      setLastChangeName('001-01_first', tempDir);
      setLastChangeName('002-03_second', tempDir);
      
      const result = getLastChangeName(tempDir);
      expect(result).toBe('002-03_second');
    });
  });

  describe('clearState', () => {
    it('should remove the state file', () => {
      setLastModuleId('001', tempDir);
      
      const stateFile = path.join(tempDir, '.spool', '.state', 'session.json');
      expect(fs.existsSync(stateFile)).toBe(true);
      
      clearState(tempDir);
      expect(fs.existsSync(stateFile)).toBe(false);
    });

    it('should not throw when state file does not exist', () => {
      expect(() => clearState(tempDir)).not.toThrow();
    });
  });

  describe('state persistence', () => {
    it('should include updatedAt timestamp', () => {
      setLastModuleId('001', tempDir);
      
      const stateFile = path.join(tempDir, '.spool', '.state', 'session.json');
      const content = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      expect(content.updatedAt).toBeDefined();
      expect(new Date(content.updatedAt).getTime()).toBeGreaterThan(0);
    });

    it('should preserve other state fields when updating', () => {
      setLastModuleId('001', tempDir);
      setLastChangeName('001-02_my-change', tempDir);
      
      // Both should be preserved
      expect(getLastModuleId(tempDir)).toBe('001');
      expect(getLastChangeName(tempDir)).toBe('001-02_my-change');
    });
  });
});
