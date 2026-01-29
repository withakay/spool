import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  getGlobalConfigDir,
  getGlobalConfigPath,
  getGlobalConfig,
  saveGlobalConfig,
  GLOBAL_CONFIG_DIR_NAME,
  GLOBAL_CONFIG_FILE_NAME,
} from '../../spool-bun/src/core/global-config.js';

describe('global-config', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create temp directory for tests
    tempDir = path.join(os.tmpdir(), `spool-global-config-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Save original env
    originalEnv = { ...process.env };

    // Spy on console.error for warning tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe('constants', () => {
    it('should export correct directory name', () => {
      expect(GLOBAL_CONFIG_DIR_NAME).toBe('spool');
    });

    it('should export correct file name', () => {
      expect(GLOBAL_CONFIG_FILE_NAME).toBe('config.json');
    });
  });

  describe('getGlobalConfigDir', () => {
    it('should use XDG_CONFIG_HOME when set', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      const result = getGlobalConfigDir();

      expect(result).toBe(path.join(tempDir, 'spool'));
    });

    it('should fall back to ~/.config on Unix/macOS without XDG_CONFIG_HOME', () => {
      delete process.env.XDG_CONFIG_HOME;

      const result = getGlobalConfigDir();

      // On non-Windows, should use ~/.config/spool
      if (os.platform() !== 'win32') {
        expect(result).toBe(path.join(os.homedir(), '.config', 'spool'));
      }
    });

    it('should use APPDATA on Windows when XDG_CONFIG_HOME is not set', () => {
      // This test only makes sense conceptually - we can't change os.platform()
      // But we can verify the APPDATA logic by checking the code path
      if (os.platform() === 'win32') {
        delete process.env.XDG_CONFIG_HOME;
        const appData = process.env.APPDATA;
        if (appData) {
          const result = getGlobalConfigDir();
          expect(result).toBe(path.join(appData, 'spool'));
        }
      }
    });
  });

  describe('getGlobalConfigPath', () => {
    it('should return path to config.json in config directory', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      const result = getGlobalConfigPath();

      expect(result).toBe(path.join(tempDir, 'spool', 'config.json'));
    });
  });

  describe('getGlobalConfig', () => {
    it('should return defaults when config file does not exist', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      const config = getGlobalConfig();

      expect(config).toEqual({ featureFlags: {} });
    });

    it('should not create directory when reading non-existent config', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      getGlobalConfig();

      expect(fs.existsSync(getGlobalConfigDir())).toBe(false);
    });

    it('should load valid config from file', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      fs.mkdirSync(getGlobalConfigDir(), { recursive: true });
      fs.writeFileSync(
        getGlobalConfigPath(),
        JSON.stringify({
          featureFlags: { testFlag: true, anotherFlag: false },
        })
      );

      const config = getGlobalConfig();

      expect(config.featureFlags).toEqual({ testFlag: true, anotherFlag: false });
    });

    it('should return defaults for invalid JSON', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      fs.mkdirSync(getGlobalConfigDir(), { recursive: true });
      fs.writeFileSync(getGlobalConfigPath(), '{ invalid json }');

      const config = getGlobalConfig();

      expect(config).toEqual({ featureFlags: {} });
    });

    it('should log warning for invalid JSON', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      fs.mkdirSync(getGlobalConfigDir(), { recursive: true });
      fs.writeFileSync(getGlobalConfigPath(), '{ invalid json }');

      getGlobalConfig();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON'));
    });

    it('should preserve unknown fields from config file', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      fs.mkdirSync(getGlobalConfigDir(), { recursive: true });
      fs.writeFileSync(
        getGlobalConfigPath(),
        JSON.stringify({
          featureFlags: { x: true },
          unknownField: 'preserved',
          futureOption: 123,
        })
      );

      const config = getGlobalConfig();

      expect((config as any).unknownField).toBe('preserved');
      expect((config as any).futureOption).toBe(123);
    });

    it('should merge loaded config with defaults', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      fs.mkdirSync(getGlobalConfigDir(), { recursive: true });
      fs.writeFileSync(
        getGlobalConfigPath(),
        JSON.stringify({
          featureFlags: { customFlag: true },
        })
      );

      const config = getGlobalConfig();

      expect(config.featureFlags?.customFlag).toBe(true);
    });
  });

  describe('saveGlobalConfig', () => {
    it('should create directory if it does not exist', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      saveGlobalConfig({ featureFlags: { test: true } });

      expect(fs.existsSync(getGlobalConfigDir())).toBe(true);
    });

    it('should write config to file', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      saveGlobalConfig({ featureFlags: { myFlag: true } });

      const content = fs.readFileSync(getGlobalConfigPath(), 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.featureFlags.myFlag).toBe(true);
    });

    it('should overwrite existing config file', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      fs.mkdirSync(getGlobalConfigDir(), { recursive: true });
      fs.writeFileSync(getGlobalConfigPath(), JSON.stringify({ featureFlags: { old: true } }));

      saveGlobalConfig({ featureFlags: { new: true } });

      const content = fs.readFileSync(getGlobalConfigPath(), 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.featureFlags.new).toBe(true);
      expect(parsed.featureFlags.old).toBeUndefined();
    });

    it('should write formatted JSON with trailing newline', () => {
      process.env.XDG_CONFIG_HOME = tempDir;

      saveGlobalConfig({ featureFlags: {} });

      const content = fs.readFileSync(getGlobalConfigPath(), 'utf-8');
      expect(content).toContain('\n');
      expect(content.endsWith('\n')).toBe(true);
    });

    it('should round-trip config correctly', () => {
      process.env.XDG_CONFIG_HOME = tempDir;
      const originalConfig = {
        featureFlags: { flag1: true, flag2: false },
      };

      saveGlobalConfig(originalConfig);
      const loadedConfig = getGlobalConfig();

      expect(loadedConfig.featureFlags).toEqual(originalConfig.featureFlags);
    });
  });
});
