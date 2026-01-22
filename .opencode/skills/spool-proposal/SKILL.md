---
name: spool-proposal
description: Create and manage Spool change proposals. Use when the user wants to propose a new feature, fix, or modification that needs structured planning and review.
---

Create and manage Spool change proposals using the spec-driven workflow.

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
     spool module list --json
     ```
     - If the request maps to an existing module, use that module ID
     - If this is a small, ungrouped task, default to module `000`
     - If no module fits, create one:
       ```bash
       spool module new "<module-name>"
       ```
     - Capture the module ID for the new change

   4. **Create the change directory (module-first)**
     ```bash
     spool new change "<name>" --module <module-id>
     ```
     - Use a kebab-case name derived from the user's request
     - This creates the scaffolded structure at `.spool/changes/<module-id>-NN_<name>/`

   5. **Create the proposal artifact**
     ```bash
     spool instructions proposal --change "<change-id>"
     ```

    - Get the template and context for creating the proposal.md
    - Read the template and fill it out based on the user's request:
      - **Why**: What problem does this solve? What's the business value?
      - **What Changes**: High-level description of what will change
      - **Capabilities**: List of new/modified capabilities (each becomes a spec)
      - **Impact**: How this affects existing functionality, performance, etc.

  6. **Show the proposal status**
    ```bash
    spool status --change "<change-id>"
    ```
    - Show that proposal is complete
    - Indicate what's next (specs need to be created)



**Output**

After completing the proposal, summarize:
- Change name and location
- Proposal summary (Why, What Changes, Capabilities, Impact)
- Next steps: "Ready to create specs for each capability"
- Prompt: "Continue with specs, or want to review the proposal first?"

**Guidelines for Good Proposals**

- **Why** should be compelling: What problem? Who benefits? Why now?
- **What Changes** should be concrete: What parts of the system? What APIs? What data?
- **Capabilities** should be specific: Each capability should be independently testable
- **Impact** should be realistic: Performance impact? Breaking changes? Migration needed?

**Guardrails**
- Don't create specs yet - just the proposal
- If the request is too vague, ask for clarification before creating
- If similar work exists, suggest collaborating or continuing existing work
- Ensure each capability listed could reasonably become a separate spec file
