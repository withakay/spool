export interface PlanningContext {
  projectName?: string;
  description?: string;
  currentDate?: string;
}

const getCurrentDate = () => new Date().toISOString().split('T')[0];

export const projectPlanningTemplate = (context: PlanningContext = {}) => `# Project: ${context.projectName || '[Project Name]'}

## Vision
${context.description || '[1-2 sentence description of what we\'re building and why]'}

## Core Value Proposition
[What makes this valuable to users]

## Constraints
- Technical: [stack, compatibility requirements]
- Resources: [team size, expertise gaps]

## Stakeholders
- [Role]: [Concerns and success criteria]

## Out of Scope
- [Explicitly excluded features/concerns]

## AI Assistant Notes
[Special instructions for AI tools working on this project]
- Preferred patterns: [...]
- Avoid: [...]
- Always check: [...]
`;

export const roadmapTemplate = (context: PlanningContext = {}) => `# Roadmap

## Current Milestone: v1-core
- Status: Not Started
- Phase: 0 of 0

## Milestones

### v1-core
Target: [Define the goal for this milestone]

| Phase | Name | Status | Changes |
|-------|------|--------|---------|
| 1 | [Phase Name] | Pending | - |

## Completed Milestones
[None yet]
`;

export const stateTemplate = (context: PlanningContext = {}) => `# Project State

Last Updated: ${context.currentDate || getCurrentDate()}

## Current Focus
[What we're working on right now]

## Recent Decisions
- ${context.currentDate || getCurrentDate()}: Project initialized

## Open Questions
- [ ] [Question needing resolution]

## Blockers
[None currently]

## Session Notes
### ${context.currentDate || getCurrentDate()} - Initial Setup
- Completed: Project planning structure initialized
- Next: Define project vision and first milestone

---
## For AI Assistants
When resuming work on this project:
1. Read this STATE.md first
2. Check ROADMAP.md for current phase
3. Review any in-progress changes in \`openspec/changes/\`
4. Continue from "Current Focus" above
`;

export const planningTemplates = {
  project: projectPlanningTemplate,
  roadmap: roadmapTemplate,
  state: stateTemplate,
};
