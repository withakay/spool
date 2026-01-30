---
name: spool-proposal
description: Create complete Spool change proposals with all artifacts (proposal, specs, design, tasks). Use when the user wants to propose a new feature, fix, or modification that needs structured planning and review.
---

Create complete Spool change proposals using the spec-driven workflow.

**Input**: The user's request for a change they want to make to the project.

**Steps**

 1. **Understand the change request**
   - Listen to what the user wants to build or fix
   - Ask clarifying questions if the request is vague
   - Identify the scope and impact of the change

  2. **Check for existing changes**
    ```bash
    spool list --json
    ```
    - If a similar change exists, suggest continuing that instead
    - Otherwise, proceed with creating a new proposal

   3. **Pick or create a module**
     ```bash
      spool list --modules --json
     ```
     - If the request maps to an existing module, use that module ID
     - If this is a small, ungrouped task, default to module `000`
     - If no module fits, create one:
       ```bash
        spool create module "<module-name>"
       ```
     - Capture the module ID for the new change

   4. **Create the change directory (module-first)**
     ```bash
      spool create change "<name>" --module <module-id>
     ```
     - Use a kebab-case name derived from the user's request
     - This creates the scaffolded structure at `.spool/changes/<module-id>-NN_<name>/`

   5. **Create the proposal artifact**
     ```bash
     spool agent instruction proposal --change "<change-id>"
     ```

    - Get the template and context for creating the proposal.md
    - Read the template and fill it out based on the user's request:
      - **Why**: What problem does this solve? What's the business value?
      - **What Changes**: High-level description of what will change
      - **Capabilities**: List of new/modified capabilities (each becomes a spec)
      - **Impact**: How this affects existing functionality, performance, etc.

  6. **Create spec files for each capability**
     - Read the proposal.md to extract the **Capabilities** list
     - For each capability in the list:
       1. Create directory: `mkdir -p .spool/changes/<change-id>/specs/<capability-name>`
       2. Get spec template:
          ```bash
          spool agent instruction spec --change "<change-id>"
          ```
       3. Create `specs/<capability-name>/spec.md`:
          - **Purpose**: What is this capability? What problem does it solve?
          - **Requirements**: List of requirements with scenarios (Given/When/Then format)
          - Each requirement MUST include at least one `#### Scenario:` block

  7. **Create the design artifact**
     ```bash
     spool agent instruction design --change "<change-id>"
     ```
    - Get the template and context for creating the design.md
    - Read the template and fill it out based on the proposal and specs:
      - **Overview**: High-level summary of the change
      - **Architecture**: System components and their interactions
      - **Implementation Strategy**: How to implement (step-by-step)
      - **What NOT to Change**: Explicit list of what to avoid modifying
      - **Testing Strategy**: How to verify the implementation

  8. **Create the tasks artifact**
     ```bash
     spool agent instruction tasks --change "<change-id>"
     ```
    - Get the template and context for creating the tasks.md
    - Read the template and break down into actionable tasks:
      - Organize by phases (Phase 1, Phase 2, etc.)
      - Each task should be a checkbox item: `- [ ] <task description>`
      - Include tasks for: implementation, testing, validation, documentation
      - Reference specific files where applicable

  9. **Show final status**
    ```bash
    spool status --change "<change-id>"
    ```
    - Show that all artifacts are complete
    - Indicate the change is ready for implementation or review



**Output**

After completing all artifacts, summarize:
- Change name and location
- Proposal summary (Why, What Changes, Capabilities, Impact)
- Created artifacts: proposal.md, N spec files, design.md, tasks.md
- Next steps: "All artifacts created! Ready to implement with `spool apply` or request review/iteration"
- Prompt: "Ready to implement, or want to review and iterate on the artifacts?"

**Guidelines for Good Proposals**

- **Why** should be compelling: What problem? Who benefits? Why now?
- **What Changes** should be concrete: What parts of the system? What APIs? What data?
- **Capabilities** should be specific: Each capability should be independently testable
- **Impact** should be realistic: Performance impact? Breaking changes? Migration needed?

**Spec Creation Guidelines**

- Each capability MUST have a corresponding spec file in `specs/<capability-name>/spec.md`
- Specs MUST include **Purpose** and **Requirements** sections
- Each requirement MUST include at least one `#### Scenario:` block with Given/When/Then format
- Specs should be detailed enough for independent testing

**Design Creation Guidelines**

- Design should reference specific files that will be modified
- Include clear step-by-step implementation phases
- Identify risks and mitigation strategies
- Document what NOT to change to avoid scope creep

**Tasks Creation Guidelines**

- Tasks should be actionable and checkable (each item is a checkbox)
- Break down work into logical phases
- Include validation tasks (run tests, verify implementation)
- Reference specific files and line numbers where possible

**Guardrails**
- Create ALL artifacts in one workflow (proposal, specs, design, tasks)
- If the request is too vague, ask for clarification before creating
- If similar work exists, suggest collaborating or continuing existing work
- Ensure each capability listed has a corresponding spec file
- Don't skip any artifact - all four are required for a complete proposal
- After creating all artifacts, offer to iterate based on user feedback
