/**
 * Command Prompt Templates
 *
 * Prompts for workflow agents - installed to projector/commands/
 * and registered as slash commands for AI tools.
 */

export interface CommandContext {
  topic?: string;
  changeId?: string;
}

// ============ Research Prompts ============

export const researchStackPrompt = (context: CommandContext = {}) => `# Stack Analysis Research

## Objective
Evaluate technology choices and stack options for: **${context.topic || '{{topic}}'}**

## Process
1. Identify the domain and key technical requirements
2. Research current best practices and industry standards
3. Evaluate library/framework ecosystem and maturity
4. Document trade-offs between options
5. Consider long-term maintenance and community support

## Output Format
Write your findings as markdown. Include:

### Requirements
- List key technical requirements for this domain

### Options Evaluated
| Option | Pros | Cons | Maturity | Community |
|--------|------|------|----------|-----------|
| ... | ... | ... | ... | ... |

### Recommendation
State your recommended choice with clear rationale.

### Alternatives
List alternatives and when they might be preferred.

### References
Include links to documentation, benchmarks, or comparisons consulted.
`;

export const researchFeaturesPrompt = (context: CommandContext = {}) => `# Feature Landscape Research

## Objective
Map the feature landscape for: **${context.topic || '{{topic}}'}**

## Process
1. Research what competitors/similar projects offer
2. Identify table-stakes features (must have)
3. Identify differentiators (competitive advantage)
4. Prioritize based on user value and effort

## Output Format

### Market Analysis
Brief overview of the competitive landscape.

### Table Stakes (Must Have)
Features users expect as baseline:
- [ ] Feature 1 - Why it's expected
- [ ] Feature 2 - Why it's expected

### Differentiators
Features that provide competitive advantage:
- [ ] Feature A - Value proposition
- [ ] Feature B - Value proposition

### Nice to Have
Lower priority features:
- [ ] Feature X
- [ ] Feature Y

### Feature Prioritization Matrix
| Feature | User Value | Effort | Priority |
|---------|-----------|--------|----------|
| ... | High/Med/Low | High/Med/Low | P0/P1/P2 |
`;

export const researchArchitecturePrompt = (context: CommandContext = {}) => `# Architecture Research

## Objective
Research architecture patterns and design considerations for: **${context.topic || '{{topic}}'}**

## Process
1. Identify architectural requirements (scale, latency, consistency)
2. Research relevant architecture patterns
3. Evaluate trade-offs for this specific use case
4. Document key design decisions

## Output Format

### Requirements
- Scale: Expected load and growth
- Latency: Response time requirements
- Consistency: Data consistency needs
- Other constraints

### Architecture Patterns Considered
For each relevant pattern:
- **Pattern Name**
  - Description
  - When to use
  - Trade-offs
  - Relevance to this project

### Recommended Architecture
Describe the recommended approach with diagram (ASCII or description).

### Key Design Decisions
| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| ... | ... | ... | ... |

### Integration Points
List external systems and how to integrate.
`;

export const researchPitfallsPrompt = (context: CommandContext = {}) => `# Pitfalls Research

## Objective
Identify common mistakes and pitfalls for: **${context.topic || '{{topic}}'}**

## Process
1. Research common failures in this domain
2. Look for post-mortems and lessons learned
3. Identify anti-patterns to avoid
4. Document mitigation strategies

## Output Format

### Common Pitfalls

For each pitfall:

#### Pitfall: [Name]
- **What goes wrong**: Description
- **Why it happens**: Root cause
- **Impact**: Consequences
- **Mitigation**: How to avoid
- **Detection**: How to know if you're falling into this

### Anti-Patterns to Avoid
- Anti-pattern 1: Why it's bad
- Anti-pattern 2: Why it's bad

### Success Patterns
Patterns that successful projects follow:
- Pattern 1: Description
- Pattern 2: Description

### Monitoring & Early Warning
Signs that something is going wrong:
- Signal 1
- Signal 2
`;

export const researchSynthesizePrompt = (context: CommandContext = {}) => `# Synthesize Research Findings

## Objective
Combine all research findings into actionable recommendations.

## Inputs
Read all investigation files and synthesize:
- Stack analysis
- Feature landscape
- Architecture patterns
- Pitfalls research

## Output Format

# Research Summary: ${context.topic || '{{topic}}'}

## Executive Summary
2-3 sentence overview of key findings and recommendations.

## Stack Recommendation
- **Recommended**: [Choice]
- **Rationale**: [Why]
- **Alternatives**: [When to choose differently]

## Feature Prioritization
### Phase 1 (MVP)
- Feature list for initial release

### Phase 2
- Features for next iteration

### Future
- Long-term features

## Architecture Decision
- Recommended pattern
- Key trade-offs accepted
- Critical integration points

## Risk Mitigation
Top pitfalls and how we'll avoid them:
1. Risk → Mitigation
2. Risk → Mitigation

## Implications for Roadmap
- Suggested phasing
- Dependencies to consider
- Skills/resources needed

## Open Questions
Questions requiring further investigation or stakeholder input.
`;

// ============ Review Prompts ============

export const reviewSecurityPrompt = (context: CommandContext = {}) => `# Security Review

## Objective
Find security vulnerabilities in the proposed changes for: **${context.changeId || '{{change_id}}'}**

## Perspective
You are a security researcher. Assume attackers are sophisticated and motivated.
Find ways to exploit, bypass, or abuse the proposed system.

## Process
1. Read the proposal and affected specs
2. Map the attack surface
3. Identify vulnerabilities by category:
   - Authentication/authorization bypasses
   - Injection points (SQL, XSS, command, template)
   - Data exposure risks
   - CSRF/SSRF vulnerabilities
   - Cryptographic weaknesses
   - Race conditions
   - Supply chain risks

## Output Format

# Security Review: ${context.changeId || '{{change_id}}'}

## Attack Surface
List entry points and trust boundaries.

## Findings

### [CRITICAL/HIGH/MEDIUM/LOW]: Finding Title
- **Location**: File/component affected
- **Attack Vector**: How an attacker could exploit this
- **Impact**: What damage could be done
- **Proof of Concept**: Example attack (if applicable)
- **Mitigation**: Required fix
- **Status**: [ ] Not addressed

## Recommendations
Proactive security improvements beyond specific findings.

## Verdict
- [ ] Approved for implementation
- [ ] Requires changes before implementation
- [ ] Needs significant redesign
`;

export const reviewScalePrompt = (context: CommandContext = {}) => `# Scale Review

## Objective
Identify performance bottlenecks and scaling issues in: **${context.changeId || '{{change_id}}'}**

## Perspective
What breaks at 10x, 100x, 1000x scale? Think about:
- Request volume
- Data volume
- User concurrency
- Geographic distribution

## Process
1. Review data access patterns
2. Identify N+1 query problems
3. Check for missing indexes
4. Find memory-intensive operations
5. Look for blocking calls in hot paths
6. Evaluate caching opportunities
7. Consider horizontal scaling implications

## Output Format

# Scale Review: ${context.changeId || '{{change_id}}'}

## Current Design Analysis
Brief summary of the proposed architecture from a scaling perspective.

## Findings

### [HIGH/MEDIUM/LOW]: Finding Title
- **Component**: What's affected
- **Current Behavior**: What happens now
- **At Scale**: What breaks and when
- **Impact**: Performance/cost/reliability effect
- **Mitigation**: Optimization strategy
- **Status**: [ ] Not addressed

## Scaling Recommendations
- Caching strategy
- Database optimization
- Async processing opportunities
- CDN/edge considerations

## Load Estimates
| Scenario | Requests/sec | Data Size | Expected Latency |
|----------|-------------|-----------|------------------|
| Current | ... | ... | ... |
| 10x | ... | ... | ... |
| 100x | ... | ... | ... |

## Verdict
- [ ] Scales adequately for expected load
- [ ] Needs optimization before launch
- [ ] Requires architectural changes
`;

export const reviewEdgePrompt = (context: CommandContext = {}) => `# Edge Case Review

## Objective
Find edge cases and unexpected behaviors in: **${context.changeId || '{{change_id}}'}**

## Perspective
Think like a chaos monkey. What happens when:
- Inputs are at boundaries (empty, null, huge, unicode)
- Operations fail partway through
- Timing is unexpected (slow, fast, concurrent)
- Users do unexpected things

## Process
1. Map all inputs and their valid ranges
2. Test boundary conditions
3. Consider partial failures
4. Think about concurrency
5. Check error handling paths

## Output Format

# Edge Case Review: ${context.changeId || '{{change_id}}'}

## Input Boundaries
| Input | Valid Range | Edge Cases to Test |
|-------|-------------|-------------------|
| ... | ... | empty, max, special chars |

## Findings

### [HIGH/MEDIUM/LOW]: Edge Case Title
- **Trigger**: How to reproduce
- **Current Behavior**: What happens
- **Expected Behavior**: What should happen
- **Impact**: User experience / data integrity effect
- **Fix**: How to handle properly
- **Status**: [ ] Not addressed

## Concurrency Scenarios
- Race condition 1: Description and mitigation
- Race condition 2: Description and mitigation

## Failure Modes
| Operation | Failure Mode | Current Handling | Recommended |
|-----------|-------------|------------------|-------------|
| ... | ... | ... | ... |

## Verdict
- [ ] Edge cases adequately handled
- [ ] Minor edge case improvements needed
- [ ] Significant gaps in error handling
`;

// ============ Template Collection ============

export type CommandPromptId =
  | 'research-stack'
  | 'research-features'
  | 'research-architecture'
  | 'research-pitfalls'
  | 'research-synthesize'
  | 'review-security'
  | 'review-scale'
  | 'review-edge';

export const commandPrompts: Record<CommandPromptId, (context: CommandContext) => string> = {
  'research-stack': researchStackPrompt,
  'research-features': researchFeaturesPrompt,
  'research-architecture': researchArchitecturePrompt,
  'research-pitfalls': researchPitfallsPrompt,
  'research-synthesize': researchSynthesizePrompt,
  'review-security': reviewSecurityPrompt,
  'review-scale': reviewScalePrompt,
  'review-edge': reviewEdgePrompt,
};

export const commandPromptDescriptions: Record<CommandPromptId, string> = {
  'research-stack': 'Research technology stack options and make recommendations',
  'research-features': 'Map feature landscape and prioritize capabilities',
  'research-architecture': 'Research architecture patterns and design decisions',
  'research-pitfalls': 'Identify common pitfalls and mitigation strategies',
  'research-synthesize': 'Synthesize research findings into actionable summary',
  'review-security': 'Security review - find vulnerabilities and attack vectors',
  'review-scale': 'Scale review - identify performance bottlenecks',
  'review-edge': 'Edge case review - find boundary conditions and failure modes',
};
