import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildUpdatedSpec } from '../../src/core/specs-apply.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('buildUpdatedSpec', () => {
    let tempDir: string;
    let sourcePath: string;
    let specPath: string;
    let existingSpecPath: string;

    beforeEach(async () => {
        // Create a unique temp dir for each test
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spool-test-'));
        sourcePath = path.join(tempDir, 'dummy-source.md');
        specPath = path.join(tempDir, 'new-spec.md');
        existingSpecPath = path.join(tempDir, 'existing-spec.md');
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should throw error for RENAMED on new spec', async () => {
        // Write content with RENAMED section
        const content = `## RENAMED Requirements

- FROM: ### Requirement: Old
- TO: ### Requirement: New
`;
        await fs.writeFile(sourcePath, content);

        const update = {
            specPath: 'new-spec.md',
            source: sourcePath,
            target: specPath,
            exists: false
        };

        await expect(buildUpdatedSpec(update as any, 'test-change')).rejects.toThrow(/RENAMED operations require an existing spec/);
    });

    it('should throw error for MODIFIED on new spec', async () => {
        // Write content with MODIFIED section
        const content = `## MODIFIED Requirements

### Requirement: My Req

Content
`;
        await fs.writeFile(sourcePath, content);

        const update = {
            specPath: 'new-spec.md',
            source: sourcePath,
            target: specPath,
            exists: false
        };

        await expect(buildUpdatedSpec(update as any, 'test-change')).rejects.toThrow(
            /only ADDED requirements are allowed for new specs/i
        );
    });

    it('should still throw for MODIFIED on existing spec if req missing', async () => {
        // Write content with MODIFIED section
        const content = `## MODIFIED Requirements

### Requirement: Missing Req

Content
`;
        await fs.writeFile(sourcePath, content);
        
        // Create existing spec (empty or with other content)
        await fs.writeFile(existingSpecPath, '# Existing Spec\n');

        const update = {
            specPath: 'existing-spec.md',
            source: sourcePath,
            target: existingSpecPath,
            exists: true
        };

        await expect(buildUpdatedSpec(update as any, 'test-change')).rejects.toThrow(/MODIFIED failed for header.*not found/);
    });
});
