import { describe, it, expect } from 'vitest';
import {
  parseModuleId,
  parseChangeId,
  normalizeModuleId,
  normalizeChangeId,
  looksLikeChangeId,
  looksLikeModuleId,
} from '../../src/utils/id-parser.js';

describe('parseModuleId', () => {
  describe('valid module IDs', () => {
    it('should parse single digit module ID', () => {
      const result = parseModuleId('1');
      expect(result).toEqual({ success: true, moduleId: '001' });
    });

    it('should parse two digit module ID', () => {
      const result = parseModuleId('01');
      expect(result).toEqual({ success: true, moduleId: '001' });
    });

    it('should parse three digit module ID (canonical)', () => {
      const result = parseModuleId('001');
      expect(result).toEqual({ success: true, moduleId: '001' });
    });

    it('should parse module ID with excessive padding', () => {
      const result = parseModuleId('0001');
      expect(result).toEqual({ success: true, moduleId: '001' });
    });

    it('should parse zero module ID', () => {
      const result = parseModuleId('0');
      expect(result).toEqual({ success: true, moduleId: '000' });
    });

    it('should parse module ID 000', () => {
      const result = parseModuleId('000');
      expect(result).toEqual({ success: true, moduleId: '000' });
    });

    it('should parse module ID with name suffix (lowercase)', () => {
      const result = parseModuleId('1_foo');
      expect(result).toEqual({ success: true, moduleId: '001', moduleName: 'foo' });
    });

    it('should parse module ID with name suffix (canonical)', () => {
      const result = parseModuleId('001_foo');
      expect(result).toEqual({ success: true, moduleId: '001', moduleName: 'foo' });
    });

    it('should parse module ID with hyphenated name', () => {
      const result = parseModuleId('001_my-module');
      expect(result).toEqual({ success: true, moduleId: '001', moduleName: 'my-module' });
    });

    it('should parse module ID with alphanumeric name', () => {
      const result = parseModuleId('001_feature2');
      expect(result).toEqual({ success: true, moduleId: '001', moduleName: 'feature2' });
    });

    it('should normalize uppercase name to lowercase', () => {
      const result = parseModuleId('001_MyModule');
      expect(result).toEqual({ success: true, moduleId: '001', moduleName: 'mymodule' });
    });

    it('should handle whitespace around input', () => {
      const result = parseModuleId('  001  ');
      expect(result).toEqual({ success: true, moduleId: '001' });
    });

    it('should parse high module number', () => {
      const result = parseModuleId('999');
      expect(result).toEqual({ success: true, moduleId: '999' });
    });

    it('should parse module number 42', () => {
      const result = parseModuleId('42');
      expect(result).toEqual({ success: true, moduleId: '042' });
    });
  });

  describe('invalid module IDs', () => {
    it('should reject empty string', () => {
      const result = parseModuleId('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('required');
      }
    });

    it('should reject null/undefined', () => {
      const result = parseModuleId(null as unknown as string);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('required');
      }
    });

    it('should reject whitespace-only string', () => {
      const result = parseModuleId('   ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('empty');
      }
    });

    it('should reject non-numeric module ID', () => {
      const result = parseModuleId('abc');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid module ID format');
        expect(result.hint).toBeDefined();
      }
    });

    it('should reject module ID starting with name', () => {
      const result = parseModuleId('foo_001');
      expect(result.success).toBe(false);
    });

    it('should reject module ID with invalid name (starts with number)', () => {
      const result = parseModuleId('001_2foo');
      expect(result.success).toBe(false);
    });

    it('should reject module ID exceeding maximum (1000)', () => {
      const result = parseModuleId('1000');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('exceeds maximum');
      }
    });

    it('should reject module ID with special characters', () => {
      const result = parseModuleId('001@foo');
      expect(result.success).toBe(false);
    });
  });
});

describe('parseChangeId', () => {
  describe('valid change IDs', () => {
    it('should parse minimal change ID', () => {
      const result = parseChangeId('1-2_bar');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '02',
        name: 'bar',
        canonical: '001-02_bar',
      });
    });

    it('should parse canonical change ID', () => {
      const result = parseChangeId('001-02_bar');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '02',
        name: 'bar',
        canonical: '001-02_bar',
      });
    });

    it('should parse mixed padding change ID', () => {
      const result = parseChangeId('1-00003_bar');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '03',
        name: 'bar',
        canonical: '001-03_bar',
      });
    });

    it('should parse excessive padding change ID', () => {
      const result = parseChangeId('0001-00002_baz');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '02',
        name: 'baz',
        canonical: '001-02_baz',
      });
    });

    it('should parse change ID with hyphenated name', () => {
      const result = parseChangeId('001-01_my-feature');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '01',
        name: 'my-feature',
        canonical: '001-01_my-feature',
      });
    });

    it('should parse change ID with alphanumeric name', () => {
      const result = parseChangeId('001-01_feature2');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '01',
        name: 'feature2',
        canonical: '001-01_feature2',
      });
    });

    it('should normalize uppercase name to lowercase', () => {
      const result = parseChangeId('001-01_MyFeature');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '01',
        name: 'myfeature',
        canonical: '001-01_myfeature',
      });
    });

    it('should handle whitespace around input', () => {
      const result = parseChangeId('  001-01_foo  ');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '01',
        name: 'foo',
        canonical: '001-01_foo',
      });
    });

    it('should parse zero module and change ID', () => {
      const result = parseChangeId('0-0_foo');
      expect(result).toEqual({
        success: true,
        moduleId: '000',
        changeNum: '00',
        name: 'foo',
        canonical: '000-00_foo',
      });
    });

    it('should parse high module and change numbers', () => {
      const result = parseChangeId('999-99_foo');
      expect(result).toEqual({
        success: true,
        moduleId: '999',
        changeNum: '99',
        name: 'foo',
        canonical: '999-99_foo',
      });
    });

    it('should handle real-world change ID', () => {
      const result = parseChangeId('1-1_flexible-id-parsing');
      expect(result).toEqual({
        success: true,
        moduleId: '001',
        changeNum: '01',
        name: 'flexible-id-parsing',
        canonical: '001-01_flexible-id-parsing',
      });
    });
  });

  describe('invalid change IDs', () => {
    it('should reject empty string', () => {
      const result = parseChangeId('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('required');
      }
    });

    it('should reject null/undefined', () => {
      const result = parseChangeId(null as unknown as string);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('required');
      }
    });

    it('should reject whitespace-only string', () => {
      const result = parseChangeId('   ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('empty');
      }
    });

    it('should reject change ID missing name', () => {
      const result = parseChangeId('001-02');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing name');
        expect(result.hint).toContain('name suffix');
      }
    });

    it('should reject change ID with wrong separator', () => {
      const result = parseChangeId('001_02_bar');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.hint).toContain('-');
      }
    });

    it('should reject non-numeric module part', () => {
      const result = parseChangeId('abc-02_bar');
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric change part', () => {
      const result = parseChangeId('001-ab_bar');
      expect(result.success).toBe(false);
    });

    it('should reject module number exceeding maximum (1000)', () => {
      const result = parseChangeId('1000-01_bar');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('exceeds maximum');
      }
    });

    it('should reject change number exceeding maximum (100)', () => {
      const result = parseChangeId('001-100_bar');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('exceeds maximum');
      }
    });

    it('should reject name starting with number', () => {
      const result = parseChangeId('001-01_2foo');
      expect(result.success).toBe(false);
    });

    it('should reject name with special characters', () => {
      const result = parseChangeId('001-01_foo@bar');
      expect(result.success).toBe(false);
    });

    it('should reject plain text (not a change ID)', () => {
      const result = parseChangeId('foo-bar');
      expect(result.success).toBe(false);
    });
  });
});

describe('normalizeModuleId', () => {
  it('should return canonical module ID for valid input', () => {
    expect(normalizeModuleId('1')).toBe('001');
    expect(normalizeModuleId('01')).toBe('001');
    expect(normalizeModuleId('001')).toBe('001');
  });

  it('should throw error for invalid input', () => {
    expect(() => normalizeModuleId('abc')).toThrow(/Invalid module ID format/);
    expect(() => normalizeModuleId('')).toThrow(/required/);
  });
});

describe('normalizeChangeId', () => {
  it('should return canonical change ID for valid input', () => {
    expect(normalizeChangeId('1-2_bar')).toBe('001-02_bar');
    expect(normalizeChangeId('001-02_bar')).toBe('001-02_bar');
    expect(normalizeChangeId('1-00003_bar')).toBe('001-03_bar');
  });

  it('should throw error for invalid input', () => {
    expect(() => normalizeChangeId('001-02')).toThrow(/missing name/);
    expect(() => normalizeChangeId('')).toThrow(/required/);
  });
});

describe('looksLikeChangeId', () => {
  it('should return true for change-like patterns', () => {
    expect(looksLikeChangeId('1-2_foo')).toBe(true);
    expect(looksLikeChangeId('001-02_foo')).toBe(true);
    expect(looksLikeChangeId('123-45_bar')).toBe(true);
  });

  it('should return false for non-change patterns', () => {
    expect(looksLikeChangeId('foo')).toBe(false);
    expect(looksLikeChangeId('001')).toBe(false);
    expect(looksLikeChangeId('001_foo')).toBe(false);
  });
});

describe('looksLikeModuleId', () => {
  it('should return true for module-like patterns', () => {
    expect(looksLikeModuleId('1')).toBe(true);
    expect(looksLikeModuleId('001')).toBe(true);
    expect(looksLikeModuleId('001_foo')).toBe(true);
  });

  it('should return false for non-module patterns', () => {
    expect(looksLikeModuleId('foo')).toBe(false);
    expect(looksLikeModuleId('_foo')).toBe(false);
  });
});
