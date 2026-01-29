import { describe, it, expect } from 'vitest';
import { OpenCodeSlashCommandConfigurator } from '../../../../spool-bun/src/core/configurators/slash/opencode.js';
import { TemplateManager } from '../../../../spool-bun/src/core/templates/index.js';

describe('slash command templates with spoolDir', () => {
  describe('skill-driven templates', () => {
    it('should delegate to spool-research skill', () => {
      const body = TemplateManager.getSlashCommandBody('research');

      expect(body).toContain('Use the Spool agent skill `spool-research`');
      expect(body).toContain('spool-research');
    });

    it('should delegate to spool-review skill', () => {
      const body = TemplateManager.getSlashCommandBody('review');

      expect(body).toContain('Use the Spool agent skill `spool-review`');
    });

    it('should delegate to spool-proposal skill', () => {
      const body = TemplateManager.getSlashCommandBody('proposal');

      expect(body).toContain('Use the Spool agent skill `spool-proposal`');
    });

    it('should delegate to spool-apply skill', () => {
      const body = TemplateManager.getSlashCommandBody('apply');

      expect(body).toContain('Use the Spool agent skill `spool-apply`');
    });

    it('should delegate to spool-archive skill', () => {
      const body = TemplateManager.getSlashCommandBody('archive');

      expect(body).toContain('Use the Spool agent skill `spool-archive`');
    });
  });

  describe('OpenCode frontmatter', () => {
    it('should generate frontmatter for research command', () => {
      const configurator = new OpenCodeSlashCommandConfigurator();
      const frontmatter = (configurator as any).getFrontmatter('research', '.my-spool');

      expect(frontmatter).toContain('description:');
    });

    it('should generate valid yaml fences without indentation', () => {
      const configurator = new OpenCodeSlashCommandConfigurator();

      const ids = ['proposal', 'apply', 'archive', 'research', 'review'] as const;

      for (const id of ids) {
        const frontmatter = (configurator as any).getFrontmatter(id, '.spool');

        expect(frontmatter).toMatch(/^---\n/);
        expect(frontmatter).toContain('\ndescription: ');
        expect(frontmatter).toMatch(/\n---\n/);
        expect(frontmatter).not.toMatch(/\n\s+description:/);
        expect(frontmatter).not.toMatch(/\n\s+---\n/);

        // Update behavior should rewrite the full file, including frontmatter fences.
        // This catches regressions where only the managed block is updated.
        const updated = (configurator as any).buildFullFileContent(id, 'body', '.spool');
        expect(updated).toMatch(/^---\n/);
        expect(updated).toContain('\ndescription: ');
        expect(updated).toMatch(/\n---\n/);
        expect(updated).not.toMatch(/\n\s+description:/);
        expect(updated).not.toMatch(/\n\s+---\n/);
        expect(updated).toContain('<!-- SPOOL:START -->');
        expect(updated).toContain('<!-- SPOOL:END -->');
      }
    });
  });
});
