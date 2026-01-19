import { describe, it, expect } from 'vitest';
import { getExploreSkillTemplate, getNewChangeSkillTemplate, getApplySkillTemplate } from '../../../src/core/templates/skill-templates.js';

describe('skill templates with projectorDir', () => {
  describe('getExploreSkillTemplate', () => {
    it('should use default .projector when no projectorDir is specified', () => {
      const template = getExploreSkillTemplate();
      
      expect(template.instructions).toContain('.projector/changes/<name>/proposal.md');
      expect(template.instructions).toContain('.projector/changes/<name>/design.md');
      expect(template.instructions).toContain('.projector/changes/<name>/tasks.md');
    });

    it('should use custom projectorDir when specified', () => {
      const template = getExploreSkillTemplate('.my-projector');
      
      expect(template.instructions).toContain('.my-projector/changes/<name>/proposal.md');
      expect(template.instructions).toContain('.my-projector/changes/<name>/design.md');
      expect(template.instructions).toContain('.my-projector/changes/<name>/tasks.md');
    });

    it('should add dot prefix if projectorDir lacks it', () => {
      const template = getExploreSkillTemplate('customprojector');
      
      expect(template.instructions).toContain('customprojector/changes/<name>/proposal.md');
      expect(template.instructions).toContain('customprojector/changes/<name>/design.md');
      expect(template.instructions).toContain('customprojector/changes/<name>/tasks.md');
    });
  });

  describe('getNewChangeSkillTemplate', () => {
    it('should use default .projector when no projectorDir is specified', () => {
      const template = getNewChangeSkillTemplate();
      
      // Check for path references in the template
      expect(template.instructions).toContain('.projector/');
    });

    it('should use custom projectorDir when specified', () => {
      const template = getNewChangeSkillTemplate('.test-projector');
      
      expect(template.instructions).toContain('.test-projector/');
    });
  });

  describe('getApplySkillTemplate', () => {
    it('should return the correct template structure', () => {
      const template = getApplySkillTemplate();
      
      expect(template.name).toBe('projector-apply');
      expect(template.description).toContain('Implement tasks from a completed Projector change proposal');
      expect(template.instructions).toContain('Implement tasks from a completed Projector change proposal');
    });

    it('should handle custom projectorDir when specified', () => {
      const template = getApplySkillTemplate('.another-projector');
      
      expect(template.name).toBe('projector-apply');
      expect(template.description).toContain('Implement tasks from a completed Projector change proposal');
      expect(template.instructions).toContain('Implement tasks from a completed Projector change proposal');
    });
  });
});