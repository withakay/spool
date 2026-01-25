import * as fs from 'fs/promises';
import * as path from 'path';
import { getChangesPath } from '../../core/project-config.js';

export interface DeltaMigrationResult {
  success: boolean;
  movedSpecs: string[];
  error?: string;
}

/**
 * Moves spec files from one change to another.
 *
 * @param projectRoot The root directory of the project
 * @param sourceChangeId The ID of the source change
 * @param destChangeId The ID of the destination change
 * @param specPaths List of spec paths relative to the change's specs directory (e.g., "feature/spec.md")
 */
export async function moveDeltaSpecs(
  projectRoot: string,
  sourceChangeId: string,
  destChangeId: string,
  specPaths: string[]
): Promise<DeltaMigrationResult> {
  const changesPath = getChangesPath(projectRoot);
  const sourcePath = path.join(changesPath, sourceChangeId);
  const destPath = path.join(changesPath, destChangeId);

  // Validate source and destination exist
  try {
    await fs.access(sourcePath);
  } catch {
    return { success: false, movedSpecs: [], error: `Source change ${sourceChangeId} not found` };
  }

  try {
    await fs.access(destPath);
  } catch {
    return {
      success: false,
      movedSpecs: [],
      error: `Destination change ${destChangeId} not found`,
    };
  }

  const movedSpecs: string[] = [];

  for (const specPath of specPaths) {
    const sourceSpecPath = path.join(sourcePath, 'specs', specPath);
    const destSpecPath = path.join(destPath, 'specs', specPath);
    const destDir = path.dirname(destSpecPath);

    try {
      // Check if source exists
      await fs.access(sourceSpecPath);

      // Check if destination already exists (collision)
      try {
        await fs.access(destSpecPath);
        return {
          success: false,
          movedSpecs,
          error: `Spec ${specPath} already exists in destination change`,
        };
      } catch {
        // Destination doesn't exist, which is good
      }

      // Create destination directory
      await fs.mkdir(destDir, { recursive: true });

      // Copy file
      await fs.copyFile(sourceSpecPath, destSpecPath);

      // Delete source file
      await fs.unlink(sourceSpecPath);

      movedSpecs.push(specPath);

      // Attempt to clean up empty source directories
      try {
        const sourceDir = path.dirname(sourceSpecPath);
        const files = await fs.readdir(sourceDir);
        if (files.length === 0) {
          await fs.rmdir(sourceDir);
        }
      } catch {
        // Ignore errors during cleanup
      }
    } catch (err: any) {
      return {
        success: false,
        movedSpecs,
        error: `Failed to move spec ${specPath}: ${err.message}`,
      };
    }
  }

  // Move associated tasks
  try {
    await moveAssociatedTasks(sourcePath, destPath, movedSpecs);
  } catch (err) {
    // Non-fatal error, just log it or include in result?
    // For now we'll just ignore it as it's "best effort"
  }

  return { success: true, movedSpecs };
}

async function moveAssociatedTasks(sourcePath: string, destPath: string, movedSpecs: string[]) {
  const sourceTasksPath = path.join(sourcePath, 'tasks.md');
  const destTasksPath = path.join(destPath, 'tasks.md');

  // Read source tasks
  let sourceTasksContent = '';
  try {
    sourceTasksContent = await fs.readFile(sourceTasksPath, 'utf-8');
  } catch {
    return; // No source tasks, nothing to move
  }

  const sourceLines = sourceTasksContent.split('\n');
  const remainingLines: string[] = [];
  const movedLines: string[] = [];

  for (const line of sourceLines) {
    // Check if line is a task and refers to any of the moved specs
    const isTask = line.trim().match(/^-\s+\[[ x]\]/);
    if (isTask) {
      const refersToMovedSpec = movedSpecs.some((spec) => {
        // Simple heuristic: check if the spec path (or parts of it) is in the line
        // We check for the full relative path, or just the filename if it's unique enough?
        // Let's stick to the relative path as provided in specPaths (e.g. "feature/spec.md")
        return line.includes(spec);
      });

      if (refersToMovedSpec) {
        movedLines.push(line);
      } else {
        remainingLines.push(line);
      }
    } else {
      remainingLines.push(line);
    }
  }

  // If nothing moved, we're done
  if (movedLines.length === 0) {
    return;
  }

  // Update source tasks
  await fs.writeFile(sourceTasksPath, remainingLines.join('\n'));

  // Append to destination tasks
  let destTasksContent = '';
  try {
    destTasksContent = await fs.readFile(destTasksPath, 'utf-8');
  } catch {
    // Destination tasks file might not exist, create it with header
    destTasksContent = '# Tasks\n\n';
  }

  // Ensure there's a newline at the end before appending
  if (destTasksContent && !destTasksContent.endsWith('\n')) {
    destTasksContent += '\n';
  }

  const newDestContent = destTasksContent + movedLines.join('\n') + '\n';
  await fs.writeFile(destTasksPath, newDestContent);
}
