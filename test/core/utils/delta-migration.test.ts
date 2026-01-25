import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { moveDeltaSpecs } from '../../../src/core/utils/delta-migration.js';
import fs from 'fs/promises';
import path from 'path';

vi.mock('fs/promises');

describe('Delta Migration Utility', () => {
  // Use an OS-normalized absolute path so Windows path resolution matches expectations.
  const mockProjectRoot = path.resolve('/mock/root');
  const mockSourceId = 'change-source';
  const mockDestId = 'change-dest';
  const mockSpecs = ['feature/spec.md'];

  beforeEach(() => {
    vi.resetAllMocks();
    (fs.access as any).mockImplementation((pathToCheck: string) => {
        // Destination spec should not exist (simulate no collision)
        if (pathToCheck.includes(mockDestId) && pathToCheck.includes('spec.md')) {
            return Promise.reject(new Error('File not found'));
        }
        // Everything else exists (source change, dest change, source spec)
        return Promise.resolve();
    });
    (fs.copyFile as any).mockResolvedValue(undefined);
    (fs.unlink as any).mockResolvedValue(undefined);
    (fs.rmdir as any).mockResolvedValue(undefined);
    (fs.readdir as any).mockResolvedValue([]);
    // Mock fs.readFile for tasks.md
    (fs.readFile as any).mockImplementation((filePath: string) => {
        if (filePath.includes('tasks.md')) {
            if (filePath.includes(mockSourceId)) {
                return Promise.resolve('# Tasks\n\n- [ ] Task 1 related to feature/spec.md\n- [ ] Task 2 unrelated\n');
            }
            return Promise.resolve('# Tasks\n\n'); // Dest tasks
        }
        return Promise.reject(new Error('File not found'));
    });
    (fs.writeFile as any).mockResolvedValue(undefined);
  });

  it('should move spec files correctly', async () => {
    const result = await moveDeltaSpecs(mockProjectRoot, mockSourceId, mockDestId, mockSpecs);

    expect(result.success).toBe(true);
    expect(result.movedSpecs).toEqual(mockSpecs);
    expect(fs.copyFile).toHaveBeenCalledWith(
      path.join(mockProjectRoot, '.spool/changes', mockSourceId, 'specs', 'feature/spec.md'),
      path.join(mockProjectRoot, '.spool/changes', mockDestId, 'specs', 'feature/spec.md')
    );
    expect(fs.unlink).toHaveBeenCalledWith(
      path.join(mockProjectRoot, '.spool/changes', mockSourceId, 'specs', 'feature/spec.md')
    );
  });

  it('should move associated tasks', async () => {
    await moveDeltaSpecs(mockProjectRoot, mockSourceId, mockDestId, mockSpecs);

    // Verify source tasks updated (removed moved task)
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join(mockSourceId, 'tasks.md')),
        expect.stringContaining('- [ ] Task 2 unrelated')
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join(mockSourceId, 'tasks.md')),
        expect.not.stringContaining('Task 1')
    );

    // Verify dest tasks updated (added moved task)
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join(mockDestId, 'tasks.md')),
        expect.stringContaining('- [ ] Task 1 related to feature/spec.md')
    );
  });
});
