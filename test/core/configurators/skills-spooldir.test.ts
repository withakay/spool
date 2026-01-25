import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillsConfigurator } from '../../../src/core/configurators/skills.js';
import { FileSystemUtils } from '../../../src/utils/file-system.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

let tempDir: string;

beforeEach(async () => {
  tempDir = fs.mkdtempSync('spool-test-');
});

afterEach(async () => {
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('SkillsConfigurator with spoolDir', () => {
  let skillsConfigurator: SkillsConfigurator;

  beforeEach(async () => {
    skillsConfigurator = new SkillsConfigurator();
  });

  describe('getAvailableSkills with custom spoolDir', () => {
    it('should apply spoolDir to skill templates', () => {
      const customSpoolDir = '.my-spool';
      const skills = skillsConfigurator.getAvailableSkills(customSpoolDir);

      // Check that skills have the custom spool directory in their instructions
      const exploreSkill = skills.find((skill) => skill.id === 'spool-explore');
      expect(exploreSkill).toBeDefined();
      expect(exploreSkill!.template.instructions).toContain('.my-spool/changes/<name>/proposal.md');

      const proposalSkill = skills.find((skill) => skill.id === 'spool-proposal');
      expect(proposalSkill).toBeDefined();
      expect(proposalSkill!.template.instructions).toContain('.my-spool/');
    });

    it('should use default .spool when no spoolDir specified', () => {
      const skills = skillsConfigurator.getAvailableSkills();

      const exploreSkill = skills.find((skill) => skill.id === 'spool-explore');
      expect(exploreSkill).toBeDefined();
      expect(exploreSkill!.template.instructions).toContain('.spool/changes/<name>/proposal.md');
    });
  });

  describe('installSkills with custom spoolDir', () => {
    it('should create skill files with custom spool directory', async () => {
      const customSpoolDir = '.test-spool';
      const projectPath = tempDir;

      await skillsConfigurator.installSkills(projectPath, customSpoolDir, ['spool-explore']);

      const skillsDir = path.join(projectPath, '.claude', 'skills', 'spool-explore');
      const skillFile = path.join(skillsDir, 'SKILL.md');

      expect(await FileSystemUtils.fileExists(skillFile)).toBe(true);

      const content = await FileSystemUtils.readFile(skillFile);
      expect(content).toContain('.test-spool/changes/<name>/proposal.md');
      expect(content).toContain('name: spool-explore');
    });
  });
});
