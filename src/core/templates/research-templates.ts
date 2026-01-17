export interface ResearchContext {
  topic?: string;
  currentDate?: string;
}

const getCurrentDate = () => new Date().toISOString().split('T')[0];

export const researchSummaryTemplate = (context: ResearchContext = {}) => `# Research Summary: ${context.topic || '[Topic]'}

Generated: ${context.currentDate || getCurrentDate()}

## Key Findings
- [Critical discoveries affecting the approach]

## Stack Recommendations
- **Recommended**: [Choice] - [Rationale]
- **Alternatives**: [Options with trade-offs]

## Feature Prioritization
### Table Stakes (Must Have)
- [Expected baseline features]

### Differentiators (Competitive Advantage)
- [Features that set the project apart]

## Architecture Considerations
- [Key design decisions and implications]

## Pitfalls to Avoid
- [Risk] → [Mitigation strategy]

## Implications for Roadmap
- Phase 1 should focus on: [...]
- Ordering considerations: [...]
- Requires investigation before: [...]

## References
- [Links to documentation, articles, etc.]
`;

export const stackAnalysisTemplate = (context: ResearchContext = {}) => `# Stack Analysis: ${context.topic || '[Domain]'}

Generated: ${context.currentDate || getCurrentDate()}

## Requirements
- [Key technical requirements derived from project]

## Options Evaluated

| Option | Pros | Cons | Maturity | Recommendation |
|--------|------|------|----------|----------------|
| [Option 1] | | | High/Med/Low | Primary / Alternative / Avoid |
| [Option 2] | | | | |
| [Option 3] | | | | |

## Primary Recommendation
**[Choice]**

Rationale: [Why this is the best fit]

## Alternatives
- **[Option 2]**: Use if [specific constraint]
- **[Option 3]**: Use if [different constraint]

## Risks
- [Risk]: [Mitigation]

## References
- [Links to documentation, benchmarks, etc.]
`;

export const featureLandscapeTemplate = (context: ResearchContext = {}) => `# Feature Landscape: ${context.topic || '[Domain]'}

Generated: ${context.currentDate || getCurrentDate()}

## Market Analysis
[Brief overview of the competitive landscape]

## Table Stakes Features
Features that users expect as baseline:

| Feature | Why Essential | Competitor Coverage |
|---------|---------------|---------------------|
| [Feature 1] | | All competitors |
| [Feature 2] | | Most competitors |

## Differentiator Opportunities
Features that could set the project apart:

| Feature | Value Proposition | Difficulty | Priority |
|---------|-------------------|------------|----------|
| [Feature 1] | | Low/Med/High | P1/P2/P3 |
| [Feature 2] | | | |

## Out of Scope (for v1)
- [Feature]: [Why deferring]

## Competitor Analysis

### [Competitor 1]
- Strengths: [...]
- Weaknesses: [...]
- Key differentiator: [...]

### [Competitor 2]
- Strengths: [...]
- Weaknesses: [...]
- Key differentiator: [...]

## Recommendations
- Must include: [...]
- Should include: [...]
- Consider for v2: [...]
`;

export const architectureTemplate = (context: ResearchContext = {}) => `# Architecture Analysis: ${context.topic || '[Domain]'}

Generated: ${context.currentDate || getCurrentDate()}

## System Overview
[High-level description of the system architecture]

## Component Boundaries

| Component | Responsibility | Interfaces |
|-----------|---------------|------------|
| [Component 1] | | |
| [Component 2] | | |

## Data Flow
\`\`\`
[User] → [Component A] → [Component B] → [Database]
                      ↓
               [External API]
\`\`\`

## Key Design Decisions

### Decision 1: [Title]
- **Choice**: [What was decided]
- **Rationale**: [Why]
- **Alternatives considered**: [Options rejected]
- **Trade-offs**: [What we give up]

### Decision 2: [Title]
- **Choice**: [...]
- **Rationale**: [...]

## Integration Points
- [External System 1]: [How we integrate]
- [External System 2]: [How we integrate]

## Scalability Considerations
- [Bottleneck 1]: [Mitigation strategy]
- [Bottleneck 2]: [Mitigation strategy]

## Security Boundaries
- [Trust boundary 1]: [Protection mechanism]
- [Trust boundary 2]: [Protection mechanism]
`;

export const pitfallsTemplate = (context: ResearchContext = {}) => `# Pitfalls Analysis: ${context.topic || '[Domain]'}

Generated: ${context.currentDate || getCurrentDate()}

## Common Mistakes

### Pitfall 1: [Title]
- **Description**: [What goes wrong]
- **Why it happens**: [Root cause]
- **Impact**: [Consequences]
- **Mitigation**: [How to avoid]
- **Detection**: [How to know if you've fallen into it]

### Pitfall 2: [Title]
- **Description**: [...]
- **Why it happens**: [...]
- **Impact**: [...]
- **Mitigation**: [...]

## Security Concerns

| Vulnerability | Risk Level | Mitigation |
|---------------|------------|------------|
| [Vulnerability 1] | High/Med/Low | [Prevention] |
| [Vulnerability 2] | | |

## Performance Traps

| Issue | Trigger | Solution |
|-------|---------|----------|
| [N+1 queries] | [When fetching related data] | [Use eager loading] |
| [Memory leak] | [...] | [...] |

## Dependency Risks
- [Dependency 1]: [Risk and mitigation]
- [Dependency 2]: [Risk and mitigation]

## Anti-Patterns to Avoid
- [Anti-pattern 1]: [Why bad] → [Better approach]
- [Anti-pattern 2]: [Why bad] → [Better approach]

## Lessons from Similar Projects
- [Project/Article 1]: [Key lesson]
- [Project/Article 2]: [Key lesson]
`;

export const researchTemplates = {
  summary: researchSummaryTemplate,
  stack: stackAnalysisTemplate,
  features: featureLandscapeTemplate,
  architecture: architectureTemplate,
  pitfalls: pitfallsTemplate,
};
