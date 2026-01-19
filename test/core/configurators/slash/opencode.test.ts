import { describe, it, expect } from 'vitest';
import { OpenCodeSlashCommandConfigurator } from '/Users/jack/Code/withakay/spool/src/core/configurators/slash/opencode.js';
import { TemplateManager } from '/Users/jack/Code/withakay/spool/src/core/templates/index.js';

describe('slash command templates with spoolDir', () => {
  describe('default spoolDir (.spool)', () => {
    it('should use .spool when no spoolDir is specified', () => {
      const body = TemplateManager.getSlashCommandBody('research');

      expect(body).toContain('.spool/research/investigations/');
      expect(body).toMatch(/`[^`]*\.spool\/research\/investigations\/[^`]*`/);
    });

    it('should work with explicit .spool parameter', () => {
      const body = TemplateManager.getSlashCommandBody('research', '.spool');

      expect(body).toContain('.spool/research/investigations/');
      expect(body).toMatch(/`[^`]*\.spool\/research\/investigations\/[^`]*`/);
    });
  });

  describe('custom spoolDir', () => {
    it('should use custom spoolDir when specified', () => {
      const body = TemplateManager.getSlashCommandBody('research', '.my-spool');

      expect(body).toContain('.my-spool/research/investigations/');
      expect(body).toMatch(/`[^`]*\.my-spool\/research\/investigations\/[^`]*`/);
    });

    it('should add dot prefix if not provided', () => {
      const body = TemplateManager.getSlashCommandBody('research', 'myspool');

      expect(body).toContain('.myspool/research/investigations/');
      expect(body).toMatch(/`[^`]*\.myspool\/research\/investigations\/[^`]*`/);
    });

    it('should keep review command body stable', () => {
      const body = TemplateManager.getSlashCommandBody('review', '.test');
      expect(body).toContain('Use the Spool agent skill `spool-review`');
    });
  });

  describe('OpenCode frontmatter with spoolDir', () => {
    it('should use custom spoolDir in frontmatter', () => {
      const configurator = new OpenCodeSlashCommandConfigurator();
      const frontmatter = (configurator as any).getFrontmatter('research', '.my-spool');

      expect(frontmatter).toContain('.my-spool/research/investigations/');
    });
  });
});