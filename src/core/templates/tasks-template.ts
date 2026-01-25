export interface TasksContext {
  changeId?: string;
  currentDate?: string;
}

export const enhancedTasksTemplate = (
  context: TasksContext = {}
) => `# Tasks for: ${context.changeId || '[change-id]'}

## Execution Notes
- **Tool**: Any (OpenCode, Codex, Claude Code)
- **Mode**: Sequential (or parallel if tool supports)
- **Created**: ${context.currentDate || new Date().toISOString().split('T')[0]}

---

## Wave 1

### Task 1.1: [Task Name]
- **Files**: \`path/to/file.ts\`
- **Dependencies**: None
- **Action**:
  [Describe what needs to be done]
- **Verify**: \`[command to verify, e.g., npm test]\`
- **Done When**: [Success criteria]
- **Status**: [ ] pending

---

## Checkpoints

### Checkpoint: Review Implementation
- **Type**: checkpoint (requires human approval)
- **Dependencies**: All Wave 1 tasks
- **Action**: Review the implementation before proceeding
- **Done When**: User confirms implementation is correct
- **Status**: [ ] pending
`;

export const taskItemTemplate = (taskNumber: string, taskName: string) => `
### Task ${taskNumber}: ${taskName}
- **Files**: \`[target files]\`
- **Dependencies**: [None or Task X.X]
- **Action**:
  [Describe what needs to be done]
- **Verify**: \`[verification command]\`
- **Done When**: [Success criteria]
- **Status**: [ ] pending
`;
