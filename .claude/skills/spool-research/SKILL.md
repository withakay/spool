---
name: spool-research
description: Conduct structured research for feature development, technology evaluation, or problem investigation. Use when the user needs to explore options, analyze trade-offs, or investigate technical approaches.
---

Conduct structured research using Spool's research framework.

**Input**: The research topic or question the user wants to investigate.

**Steps**

1. **Understand the research scope**
   - Clarify what the user wants to research
   - Identify the specific questions to answer
   - Determine the research depth needed (quick analysis vs. deep dive)

2. **Initialize research structure**
   ```bash
   # Create research directory if it doesn't exist
   mkdir -p .spool/research/investigations
   ```
   - Create a research directory structure
   - Set up files for different research aspects

3. **Plan the research approach**
   Based on the topic, identify which research artifacts are needed:
   - **Stack Analysis**: Analyze current technology stack vs. requirements
   - **Feature Landscape**: Survey existing solutions and approaches
   - **Architecture**: Evaluate architectural patterns and options
   - **Pitfalls**: Identify risks and potential issues

4. **Conduct research systematically**

   **For Stack Analysis:**
   - Analyze current project dependencies and architecture
   - Evaluate compatibility with new requirements
   - Identify gaps or needed upgrades

   **For Feature Landscape:**
   - Research existing implementations in other projects
   - Survey open-source solutions and libraries
   - Compare different approaches and patterns

   **For Architecture:**
   - Design and evaluate architectural options
   - Consider performance, scalability, and maintainability
   - Document trade-offs between approaches

   **For Pitfalls:**
   - Identify common failure modes and risks
   - Research edge cases and error conditions
   - Plan mitigation strategies

5. **Document findings**
   Create structured documentation in `.spool/research/`:
   - `SUMMARY.md`: Executive summary and recommendations
   - `investigations/stack-analysis.md`: Technology stack evaluation
   - `investigations/feature-landscape.md`: Solution survey
   - `investigations/architecture.md`: Architectural analysis
   - `investigations/pitfalls.md`: Risk assessment

6. **Synthesize recommendations**
   Based on all research, provide:
   - **Recommended approach**: What should be done and why
   - **Alternatives**: Other viable options with trade-offs
   - **Next steps**: How to proceed with implementation
   - **Open questions**: Remaining unknowns or uncertainties

**Output Format**

```
## Research Complete: <topic>

**Executive Summary:**
<brief overview of findings and recommendation>

**Key Findings:**
- **Stack Compatibility**: <analysis results>
- **Solution Options**: <evaluated approaches>
- **Recommended Architecture**: <chosen approach with rationale>
- **Risks and Mitigations**: <identified risks and how to address them>

**Recommendation:**
<clear recommendation with justification>

**Next Steps:**
1. <first step to take>
2. <second step to take>
3. <third step to take>

**Research Files Created:**
- .spool/research/SUMMARY.md
- .spool/research/investigations/stack-analysis.md
- .spool/research/investigations/feature-landscape.md
- .spool/research/investigations/architecture.md
- .spool/research/investigations/pitfalls.md
```

**Guardrails**
- Focus research on the specific questions asked
- Provide concrete, actionable recommendations
- Clearly distinguish between facts, analysis, and opinions
- Identify risks and uncertainties explicitly
- Keep research documentation structured and reusable
