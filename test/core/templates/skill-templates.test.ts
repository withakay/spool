import { describe, it, expect } from 'vitest';
import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getApplySkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

describe('skill templates with spoolDir', () => {
  describe('getExploreSkillTemplate', () => {
    it('should use default .spool when no spoolDir is specified', () => {
      const template = getExploreSkillTemplate();

      expect(template.instructions).toContain('.spool/changes/<name>/proposal.md');
      expect(template.instructions).toContain('.spool/changes/<name>/design.md');
      expect(template.instructions).toContain('.spool/changes/<name>/tasks.md');
    });

    it('should use custom spoolDir when specified', () => {
      const template = getExploreSkillTemplate('.my-spool');

      expect(template.instructions).toContain('.my-spool/changes/<name>/proposal.md');
      expect(template.instructions).toContain('.my-spool/changes/<name>/design.md');
      expect(template.instructions).toContain('.my-spool/changes/<name>/tasks.md');
    });

    it('should add dot prefix if spoolDir lacks it', () => {
      const template = getExploreSkillTemplate('customspool');

      expect(template.instructions).toContain('customspool/changes/<name>/proposal.md');
      expect(template.instructions).toContain('customspool/changes/<name>/design.md');
      expect(template.instructions).toContain('customspool/changes/<name>/tasks.md');
    });
  });

  describe('getNewChangeSkillTemplate', () => {
    it('should use default .spool when no spoolDir is specified', () => {
      const template = getNewChangeSkillTemplate();

      // Check for path references in the template
      expect(template.instructions).toContain('.spool/');
    });

    it('should use custom spoolDir when specified', () => {
      const template = getNewChangeSkillTemplate('.test-spool');

      expect(template.instructions).toContain('.test-spool/');
    });
  });

  describe('getApplySkillTemplate', () => {
    it('should return the correct template structure', () => {
      const template = getApplySkillTemplate();

      expect(template.name).toBe('spool-apply');
      expect(template.description).toContain(
        'Implement tasks from a completed Spool change proposal'
      );
      expect(template.instructions).toContain(
        'Implement tasks from a completed Spool change proposal'
      );
    });

    it('should handle custom spoolDir when specified', () => {
      const template = getApplySkillTemplate('.another-spool');

      expect(template.name).toBe('spool-apply');
      expect(template.description).toContain(
        'Implement tasks from a completed Spool change proposal'
      );
      expect(template.instructions).toContain(
        'Implement tasks from a completed Spool change proposal'
      );
    });
  });
});
