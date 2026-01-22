---
name: spool-review
description: Review and validate Spool changes, specs, or implementations. Use when the user wants a quality check, code review, or validation of project artifacts.
---

Conduct comprehensive review of Spool artifacts, code changes, or specifications.

**Input**: What to review (change name, spec name, or specific code/files).

**Steps**

1. **Identify review scope**
   - Understand what the user wants reviewed (change, spec, implementation, etc.)
   - Determine the type of review needed (validation, quality check, security, etc.)
   - Clarify the review criteria and focus areas

2. **Select appropriate review method**

   **For Changes:**
   ```bash
   spool validate --changes <name> --strict --json
   ```
   - Run structured validation on the change
   - Check all artifacts are complete and consistent
   - Verify requirements are fully specified

   **For Specs:**
   ```bash
   spool validate --specs <name> --strict --json
   ```
   - Validate spec format and completeness
   - Check requirements are properly structured
   - Verify scenarios are testable and complete

   **For Implementation:**
   - Review code against design and requirements
   - Check test coverage and quality
   - Verify adherence to project standards

3. **Conduct systematic review**

   **Structure Review:**
   - Check all required sections are present
   - Verify format follows Spool conventions
   - Ensure cross-references are correct

   **Content Review:**
   - Verify requirements are clear and unambiguous
   - Check scenarios are comprehensive and testable
   - Ensure design decisions are justified

   **Consistency Review:**
   - Check alignment between proposal, specs, and design
   - Verify tasks cover all requirements
   - Ensure terminology is consistent

   **Quality Review:**
   - Assess clarity and completeness
   - Check for missing edge cases
   - Identify potential ambiguities or conflicts

4. **Document review findings**
   Structure findings by severity:

   **Critical Issues:** Must be fixed before proceeding
   - Missing required sections or artifacts
   - Contradictions between artifacts
   - Untestable or ambiguous requirements

   **Important Issues:** Should be addressed
   - Incomplete scenarios or edge cases
   - Unclear design decisions
   - Missing error handling

   **Minor Issues:** Nice to have improvements
   - Formatting inconsistencies
   - Typographical errors
   - Minor clarity improvements

5. **Provide actionable feedback**
   For each issue:
   - Clearly state the problem
   - Explain why it's an issue
   - Suggest specific corrective action
   - Reference relevant sections or guidelines

**Output Format**

```
## Review Complete: <item-name>

**Overall Assessment:** <summary of quality state>
**Critical Issues:** <number> | **Important Issues:** <number> | **Minor Issues:** <number>

### Critical Issues (Must Fix)
<list of critical issues with specific fixes needed>

### Important Issues (Should Fix)
<list of important issues with suggested improvements>

### Minor Issues (Nice to Have)
<list of minor issues and polish suggestions>

### Strengths
<positive aspects worth noting or preserving>

### Recommendations
1. <priority recommendation>
2. <secondary recommendation>
3. <suggestion for next steps>

**Validation Command:** `spool validate <type> <name>`
```

**Guardrails**
- Be constructive and specific in feedback
- Prioritize issues by impact on project success
- Provide actionable suggestions, not just criticism
- Acknowledge good work and strengths
- Focus review on stated criteria and scope
