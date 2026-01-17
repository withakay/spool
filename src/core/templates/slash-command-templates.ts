// Core commands that all tools support
export type CoreSlashCommandId = 'proposal' | 'apply' | 'archive';

// All available slash commands
export type SlashCommandId =
  | CoreSlashCommandId
  | 'research'
  | 'research-stack'
  | 'research-features'
  | 'research-architecture'
  | 'research-pitfalls'
  | 'review'
  | 'review-security'
  | 'review-scale'
  | 'review-edge';

const baseGuardrails = `**Guardrails**
- Favor straightforward, minimal implementations first and add complexity only when it is requested or clearly required.
- Keep changes tightly scoped to the requested outcome.
- Refer to \`openspec/AGENTS.md\` (located inside the \`openspec/\` directory—run \`ls openspec\` or \`openspec update\` if you don't see it) if you need additional OpenSpec conventions or clarifications.`;

const proposalGuardrails = `${baseGuardrails}\n- Identify any vague or ambiguous details and ask the necessary follow-up questions before editing files.
- Do not write any code during the proposal stage. Only create design documents (proposal.md, tasks.md, design.md, and spec deltas). Implementation happens in the apply stage after approval.`;

const proposalSteps = `**Steps**
1. Review \`openspec/project.md\`, run \`openspec list\` and \`openspec list --specs\`, and inspect related code or docs (e.g., via \`rg\`/\`ls\`) to ground the proposal in current behaviour; note any gaps that require clarification.
2. Choose a unique verb-led \`change-id\` and scaffold \`proposal.md\`, \`tasks.md\`, and \`design.md\` (when needed) under \`openspec/changes/<id>/\`.
3. Map the change into concrete capabilities or requirements, breaking multi-scope efforts into distinct spec deltas with clear relationships and sequencing.
4. Capture architectural reasoning in \`design.md\` when the solution spans multiple systems, introduces new patterns, or demands trade-off discussion before committing to specs.
5. Draft spec deltas in \`changes/<id>/specs/<capability>/spec.md\` (one folder per capability) using \`## ADDED|MODIFIED|REMOVED Requirements\` with at least one \`#### Scenario:\` per requirement and cross-reference related capabilities when relevant.
6. Draft \`tasks.md\` as an ordered list of small, verifiable work items that deliver user-visible progress, include validation (tests, tooling), and highlight dependencies or parallelizable work.
7. Validate with \`openspec validate <id> --strict\` and resolve every issue before sharing the proposal.`;


const proposalReferences = `**Reference**
- Use \`openspec show <id> --json --deltas-only\` or \`openspec show <spec> --type spec\` to inspect details when validation fails.
- Search existing requirements with \`rg -n "Requirement:|Scenario:" openspec/specs\` before writing new ones.
- Explore the codebase with \`rg <keyword>\`, \`ls\`, or direct file reads so proposals align with current implementation realities.`;

const applySteps = `**Steps**
Track these steps as TODOs and complete them one by one.
1. Read \`changes/<id>/proposal.md\`, \`design.md\` (if present), and \`tasks.md\` to confirm scope and acceptance criteria.
2. Work through tasks sequentially, keeping edits minimal and focused on the requested change.
3. Confirm completion before updating statuses—make sure every item in \`tasks.md\` is finished.
4. Update the checklist after all work is done so each task is marked \`- [x]\` and reflects reality.
5. Reference \`openspec list\` or \`openspec show <item>\` when additional context is required.`;

const applyReferences = `**Reference**
- Use \`openspec show <id> --json --deltas-only\` if you need additional context from the proposal while implementing.`;

const archiveSteps = `**Steps**
1. Determine the change ID to archive:
   - If this prompt already includes a specific change ID (for example inside a \`<ChangeId>\` block populated by slash-command arguments), use that value after trimming whitespace.
   - If the conversation references a change loosely (for example by title or summary), run \`openspec list\` to surface likely IDs, share the relevant candidates, and confirm which one the user intends.
   - Otherwise, review the conversation, run \`openspec list\`, and ask the user which change to archive; wait for a confirmed change ID before proceeding.
   - If you still cannot identify a single change ID, stop and tell the user you cannot archive anything yet.
2. Validate the change ID by running \`openspec list\` (or \`openspec show <id>\`) and stop if the change is missing, already archived, or otherwise not ready to archive.
3. Run \`openspec archive <id> --yes\` so the CLI moves the change and applies spec updates without prompts (use \`--skip-specs\` only for tooling-only work).
4. Review the command output to confirm the target specs were updated and the change landed in \`changes/archive/\`.
5. Validate with \`openspec validate --strict\` and inspect with \`openspec show <id>\` if anything looks off.`;

const archiveReferences = `**Reference**
- Use \`openspec list\` to confirm change IDs before archiving.
- Inspect refreshed specs with \`openspec list --specs\` and address any validation issues before handing off.`;

// Research command bodies - load from openspec/commands/ or use inline
const researchGuardrails = `${baseGuardrails}
- Focus on investigation and documentation, not implementation.
- Use web search to gather current information about best practices.
- Write findings to the appropriate file in openspec/research/investigations/.`;

const researchStackBody = `${researchGuardrails}

**Objective**
Evaluate technology stack options for the requested topic.

**Steps**
1. Identify domain and key technical requirements
2. Research current best practices (use web search)
3. Evaluate library ecosystem and maturity
4. Document trade-offs between options
5. Write findings to \`openspec/research/investigations/stack-analysis.md\`

**Output Format**
Include: Requirements, Options Evaluated (table), Recommendation, Alternatives, References`;

const researchFeaturesBody = `${researchGuardrails}

**Objective**
Map the feature landscape and prioritize capabilities.

**Steps**
1. Research what competitors/similar projects offer
2. Identify table-stakes features (must have)
3. Identify differentiators (competitive advantage)
4. Prioritize based on user value and effort
5. Write findings to \`openspec/research/investigations/feature-landscape.md\`

**Output Format**
Include: Market Analysis, Table Stakes, Differentiators, Nice to Have, Feature Prioritization Matrix`;

const researchArchitectureBody = `${researchGuardrails}

**Objective**
Research architecture patterns and design considerations.

**Steps**
1. Identify architectural requirements (scale, latency, consistency)
2. Research relevant architecture patterns
3. Evaluate trade-offs for this specific use case
4. Document key design decisions
5. Write findings to \`openspec/research/investigations/architecture.md\`

**Output Format**
Include: Requirements, Architecture Patterns Considered, Recommended Architecture, Key Design Decisions, Integration Points`;

const researchPitfallsBody = `${researchGuardrails}

**Objective**
Identify common mistakes and pitfalls to avoid.

**Steps**
1. Research common failures in this domain
2. Look for post-mortems and lessons learned
3. Identify anti-patterns to avoid
4. Document mitigation strategies
5. Write findings to \`openspec/research/investigations/pitfalls.md\`

**Output Format**
Include: Common Pitfalls (with mitigation), Anti-Patterns, Success Patterns, Monitoring & Early Warning`;

// Review command bodies
const reviewGuardrails = `${baseGuardrails}
- Be thorough and adversarial - find real issues.
- Rate findings by severity: CRITICAL, HIGH, MEDIUM, LOW.
- Provide actionable mitigations for each finding.`;

const reviewSecurityBody = `${reviewGuardrails}

**Objective**
Find security vulnerabilities in the proposed changes.

**Perspective**
You are a security researcher. Assume attackers are sophisticated.

**Steps**
1. Read the proposal and affected specs
2. Map the attack surface
3. Check for: auth bypasses, injection, data exposure, CSRF/SSRF, crypto weaknesses, race conditions
4. Write findings to \`openspec/changes/<id>/reviews/security.md\`

**Output Format**
Include: Attack Surface, Findings (with severity, vector, impact, mitigation), Recommendations, Verdict`;

const reviewScaleBody = `${reviewGuardrails}

**Objective**
Identify performance bottlenecks and scaling issues.

**Perspective**
What breaks at 10x, 100x, 1000x scale?

**Steps**
1. Review data access patterns
2. Identify N+1 queries, missing indexes
3. Find memory-intensive operations
4. Evaluate caching opportunities
5. Write findings to \`openspec/changes/<id>/reviews/scale.md\`

**Output Format**
Include: Design Analysis, Findings (with component, behavior at scale, mitigation), Load Estimates, Verdict`;

const reviewEdgeBody = `${reviewGuardrails}

**Objective**
Find edge cases and unexpected behaviors.

**Perspective**
What happens with: empty inputs, huge inputs, concurrent access, partial failures?

**Steps**
1. Map all inputs and valid ranges
2. Test boundary conditions mentally
3. Consider partial failures
4. Check error handling paths
5. Write findings to \`openspec/changes/<id>/reviews/edge-cases.md\`

**Output Format**
Include: Input Boundaries, Findings (with trigger, behavior, fix), Concurrency Scenarios, Failure Modes, Verdict`;

// Unified research command - runs all research in parallel then synthesizes
const researchBody = `${researchGuardrails}

**Objective**
Conduct comprehensive domain research before creating a proposal.

**Process**
Run these 4 investigations in parallel (spawn agents if your tool supports it):

1. **Stack Analysis** → \`openspec/research/investigations/stack-analysis.md\`
   - Evaluate technology options, libraries, frameworks
   - Document trade-offs and recommendations

2. **Feature Landscape** → \`openspec/research/investigations/feature-landscape.md\`
   - Map competitor features, table stakes, differentiators
   - Prioritize by user value and effort

3. **Architecture** → \`openspec/research/investigations/architecture.md\`
   - Research relevant patterns and design decisions
   - Document scale, latency, consistency requirements

4. **Pitfalls** → \`openspec/research/investigations/pitfalls.md\`
   - Identify common mistakes and anti-patterns
   - Document mitigation strategies

**After all investigations complete:**
5. **Synthesize** → \`openspec/research/SUMMARY.md\`
   - Combine findings into executive summary
   - Provide actionable recommendations for roadmap

**Reference**
- Read \`openspec/planning/PROJECT.md\` for project context
- Use web search to gather current best practices
- Update \`openspec/planning/STATE.md\` with research session notes`;

// Unified review command - runs all reviews in parallel
const reviewBody = `${reviewGuardrails}

**Objective**
Conduct adversarial review of a change proposal from multiple perspectives.

**Process**
Run these 3 reviews in parallel (spawn agents if your tool supports it):

1. **Security Review** → \`openspec/changes/<id>/reviews/security.md\`
   - Find auth bypasses, injection, data exposure
   - Map attack surface and vulnerabilities

2. **Scale Review** → \`openspec/changes/<id>/reviews/scale.md\`
   - Identify N+1 queries, missing indexes
   - What breaks at 10x, 100x, 1000x?

3. **Edge Case Review** → \`openspec/changes/<id>/reviews/edge-cases.md\`
   - Boundary conditions, partial failures
   - Concurrency and error handling gaps

**After all reviews complete:**
4. **Compile** → \`openspec/changes/<id>/REVIEW.md\`
   - Summarize critical findings
   - Provide approval/rejection recommendation

**Reference**
- Read the change's \`proposal.md\` and \`spec.md\` files
- Rate findings: CRITICAL > HIGH > MEDIUM > LOW
- Block implementation for CRITICAL/HIGH findings`;

export const slashCommandBodies: Record<SlashCommandId, string> = {
  proposal: [proposalGuardrails, proposalSteps, proposalReferences].join('\n\n'),
  apply: [baseGuardrails, applySteps, applyReferences].join('\n\n'),
  archive: [baseGuardrails, archiveSteps, archiveReferences].join('\n\n'),
  'research': researchBody,
  'research-stack': researchStackBody,
  'research-features': researchFeaturesBody,
  'research-architecture': researchArchitectureBody,
  'research-pitfalls': researchPitfallsBody,
  'review': reviewBody,
  'review-security': reviewSecurityBody,
  'review-scale': reviewScaleBody,
  'review-edge': reviewEdgeBody,
};

export function getSlashCommandBody(id: SlashCommandId): string {
  return slashCommandBodies[id];
}
