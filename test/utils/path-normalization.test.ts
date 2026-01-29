import { describe, it, expect } from 'vitest';
import {
  normalizeSpoolDir,
  replaceHardcodedSpoolPaths,
  replaceHardcodedDotSpoolPaths,
} from '../../spool-bun/src/utils/path-normalization.js';

describe('path normalization utilities', () => {
  describe('normalizeSpoolDir', () => {
    it('should leave directories starting with dot unchanged', () => {
      expect(normalizeSpoolDir('.spool')).toBe('.spool');
      expect(normalizeSpoolDir('.my-spool')).toBe('.my-spool');
    });

    it('should add dot prefix to directories without it', () => {
      expect(normalizeSpoolDir('spool')).toBe('.spool');
      expect(normalizeSpoolDir('my-spool')).toBe('.my-spool');
      expect(normalizeSpoolDir('custom')).toBe('.custom');
    });
  });

  describe('replaceHardcodedSpoolPaths', () => {
    it('should replace spool/ paths with default .spool', () => {
      const text = 'Write to spool/research/investigations/stack-analysis.md';
      expect(replaceHardcodedSpoolPaths(text)).toBe(
        'Write to .spool/research/investigations/stack-analysis.md'
      );
    });

    it('should replace spool/ paths with custom directory', () => {
      const text = 'Write to spool/research/investigations/stack-analysis.md';
      expect(replaceHardcodedSpoolPaths(text, '.my-spool')).toBe(
        'Write to .my-spool/research/investigations/stack-analysis.md'
      );
    });

    it('should add dot prefix if custom directory lacks it', () => {
      const text = 'Write to spool/research/investigations/stack-analysis.md';
      expect(replaceHardcodedSpoolPaths(text, 'my-spool')).toBe(
        'Write to .my-spool/research/investigations/stack-analysis.md'
      );
    });

    it('should handle multiple replacements', () => {
      const text = 'spool/changes and spool/specs';
      expect(replaceHardcodedSpoolPaths(text, '.custom')).toBe('.custom/changes and .custom/specs');
    });

    it('should not affect other text', () => {
      const text = 'This is just regular text with no paths';
      expect(replaceHardcodedSpoolPaths(text)).toBe(text);
    });
  });

  describe('replaceHardcodedDotSpoolPaths', () => {
    it('should replace .spool/ paths with custom directory', () => {
      const text = 'Write to .spool/research/investigations/stack-analysis.md';
      expect(replaceHardcodedDotSpoolPaths(text, '.my-spool')).toBe(
        'Write to .my-spool/research/investigations/stack-analysis.md'
      );
    });

    it('should add dot prefix if custom directory lacks it', () => {
      const text = 'Write to .spool/research/investigations/stack-analysis.md';
      expect(replaceHardcodedDotSpoolPaths(text, 'my-spool')).toBe(
        'Write to .my-spool/research/investigations/stack-analysis.md'
      );
    });

    it('should handle multiple replacements', () => {
      const text = '.spool/changes and .spool/specs';
      expect(replaceHardcodedDotSpoolPaths(text, '.custom')).toBe(
        '.custom/changes and .custom/specs'
      );
    });

    it('should not affect other text', () => {
      const text = 'This is just regular text with no paths';
      expect(replaceHardcodedDotSpoolPaths(text)).toBe(text);
    });
  });
});
