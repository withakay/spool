import { promises as fs } from 'fs';
import path from 'path';

const CHECKBOX_TASK_PATTERN = /^[-*]\s+\[[\sx]\]/i;
const CHECKBOX_COMPLETED_TASK_PATTERN = /^[-*]\s+\[x\]/i;

// Enhanced tasks.md format used in many Spool changes:
// - **Status**: [ ] pending
// - **Status**: [x] complete
const STATUS_TASK_PATTERN = /^-\s+\*\*Status\*\*:\s*\[[\sx]\]/i;
const STATUS_COMPLETED_TASK_PATTERN = /^-\s+\*\*Status\*\*:\s*\[x\]/i;

export interface TaskProgress {
  total: number;
  completed: number;
}

export function countTasksFromContent(content: string): TaskProgress {
  const lines = content.split('\n');
  let total = 0;
  let completed = 0;

  // Prefer standard markdown checkboxes when present.
  for (const line of lines) {
    if (line.match(CHECKBOX_TASK_PATTERN)) {
      total++;
      if (line.match(CHECKBOX_COMPLETED_TASK_PATTERN)) {
        completed++;
      }
    }
  }

  if (total > 0) return { total, completed };

  // Fall back to enhanced "Status" lines.
  for (const line of lines) {
    if (line.match(STATUS_TASK_PATTERN)) {
      total++;
      if (line.match(STATUS_COMPLETED_TASK_PATTERN)) {
        completed++;
      }
    }
  }

  return { total, completed };
}

export async function getTaskProgressForChange(
  changesDir: string,
  changeName: string
): Promise<TaskProgress> {
  const tasksPath = path.join(changesDir, changeName, 'tasks.md');
  try {
    const content = await fs.readFile(tasksPath, 'utf-8');
    return countTasksFromContent(content);
  } catch {
    return { total: 0, completed: 0 };
  }
}

export function formatTaskStatus(progress: TaskProgress): string {
  if (progress.total === 0) return 'No tasks';
  if (progress.completed === progress.total) return '✓ Complete';
  return `${progress.completed}/${progress.total} tasks`;
}
