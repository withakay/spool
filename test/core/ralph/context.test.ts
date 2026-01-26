import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';

import { clearProjectConfigCache } from '../../../src/core/project-config.js';
import { buildPromptPreamble, buildRalphPrompt } from '../../../src/core/ralph/context.js';

describe('ralph prompt building', () => {
  describe('buildPromptPreamble', () => {
    it('includes iteration header, instructions, autonomy rules, and completion promise', () => {
      const prompt = buildPromptPreamble({
        iteration: 1,
        maxIterations: 3,
        minIterations: 1,
        completionPromise: 'COMPLETE',
        contextContent: null,
        task: 'Do the thing',
      });

      expect(prompt).toContain('# Ralph Wiggum Loop - Iteration 1');
      expect(prompt).toContain('## Your Task');
      expect(prompt).toContain('Do the thing');
      expect(prompt).toContain('## Instructions');
      expect(prompt).toContain('## AUTONOMY REQUIREMENTS (CRITICAL)');
      expect(prompt).toContain('**DO NOT ASK QUESTIONS**');
      expect(prompt).toContain('<promise>COMPLETE</promise>');
      expect(prompt).toContain('## Current Iteration: 1 / 3 (min: 1)');
      expect(prompt).not.toContain('## Additional Context (added by user mid-loop)');
    });

    it('includes labeled context section when context exists', () => {
      const prompt = buildPromptPreamble({
        iteration: 5,
        maxIterations: undefined,
        minIterations: 2,
        completionPromise: 'DONE',
        contextContent: 'Some extra context',
        task: 'Work',
      });

      expect(prompt).toContain('## Additional Context (added by user mid-loop)');
      expect(prompt).toContain('Some extra context');
      expect(prompt).toContain('## Current Iteration: 5 (unlimited) (min: 2)');
    });
  });

  describe('buildRalphPrompt', () => {
    let tmpDir: string;
    let previousCwd: string;
    let previousXdgConfigHome: string | undefined;

    beforeEach(async () => {
      previousCwd = process.cwd();
      previousXdgConfigHome = process.env.XDG_CONFIG_HOME;

      tmpDir = await mkdtemp(path.join(os.tmpdir(), 'spool-ralph-'));
      process.env.XDG_CONFIG_HOME = path.join(tmpDir, 'xdg');
      await mkdir(process.env.XDG_CONFIG_HOME, { recursive: true });

      process.chdir(tmpDir);
      clearProjectConfigCache();

      await mkdir(path.join(tmpDir, '.spool', 'changes', '001-01_test'), { recursive: true });
      await writeFile(
        path.join(tmpDir, '.spool', 'changes', '001-01_test', 'proposal.md'),
        'Test proposal content\n'
      );
    });

    afterEach(() => {
      process.chdir(previousCwd);
      process.env.XDG_CONFIG_HOME = previousXdgConfigHome;
      clearProjectConfigCache();
    });

    it('wraps task with preamble when iteration options provided', async () => {
      const prompt = await buildRalphPrompt('Do the work', {
        changeId: '001-01_test',
        iteration: 1,
        maxIterations: 3,
        minIterations: 1,
        completionPromise: 'COMPLETE',
        contextContent: 'Extra info',
      });

      expect(prompt).toContain('# Ralph Wiggum Loop - Iteration 1');
      expect(prompt).toContain('## Additional Context (added by user mid-loop)');
      expect(prompt).toContain('Extra info');
      expect(prompt).toContain('## Your Task');
      expect(prompt).toContain('## Change Proposal (001-01_test)');
      expect(prompt).toContain('Test proposal content');
      expect(prompt).toContain('Do the work');
    });

    it('preserves legacy behavior when iteration options are not provided', async () => {
      const prompt = await buildRalphPrompt('Do the work', {
        changeId: '001-01_test',
      });

      expect(prompt).not.toContain('Ralph Wiggum Loop');
      expect(prompt).toContain('## Change Proposal (001-01_test)');
      expect(prompt).toContain('Test proposal content');
      expect(prompt).toContain('Do the work');
    });
  });
});
