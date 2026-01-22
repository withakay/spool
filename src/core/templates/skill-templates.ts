/**
 * Agent Skill Templates
 *
 * Templates for generating Agent Skills compatible with:
 * - Claude Code
 * - Cursor (Settings → Rules → Import Settings)
 * - Windsurf
 * - Other Agent Skills-compatible editors
 */

import { replaceHardcodedDotSpoolPaths } from '../../utils/path-normalization.js';

export interface SkillTemplate {
  name: string;
  description: string;
  instructions: string;
}

/**
 * Template for spool-explore skill
 * Explore mode - adaptive thinking partner for exploring ideas and problems
 */
export function getExploreSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  const rawInstructions = `Enter explore mode. Think deeply. Visualize freely. Follow the conversation wherever it goes.

**This is a stance, not a workflow.** There are no fixed steps, no required sequence, no mandatory outputs. You're a thinking partner helping the user explore.

---

## The Stance

- **Curious, not prescriptive** - Ask questions that emerge naturally, don't follow a script
- **Visual** - Use ASCII diagrams liberally when they'd help clarify thinking
- **Adaptive** - Follow interesting threads, pivot when new information emerges
- **Patient** - Don't rush to conclusions, let the shape of the problem emerge
- **Grounded** - Explore the actual codebase when relevant, don't just theorize

---

## What You Might Do

Depending on what the user brings, you might:

**Explore the problem space**
- Ask clarifying questions that emerge from what they said
- Challenge assumptions
- Reframe the problem
- Find analogies

**Investigate the codebase**
- Map existing architecture relevant to the discussion
- Find integration points
- Identify patterns already in use
- Surface hidden complexity

**Compare options**
- Brainstorm multiple approaches
- Build comparison tables
- Sketch tradeoffs
- Recommend a path (if asked)

**Visualize**
\`\`\`
┌─────────────────────────────────────────┐
│     Use ASCII diagrams liberally        │
├─────────────────────────────────────────┤
│                                         │
│   ┌────────┐         ┌────────┐        │
│   │ State  │────────▶│ State  │        │
│   │   A    │         │   B    │        │
│   └────────┘         └────────┘        │
│                                         │
│   System diagrams, state machines,      │
│   data flows, architecture sketches,    │
│   dependency graphs, comparison tables  │
│                                         │
└─────────────────────────────────────────┘
\`\`\`

**Surface risks and unknowns**
- Identify what could go wrong
- Find gaps in understanding
- Suggest spikes or investigations

---

## Spool Awareness

You have full context of the Spool system. Use it naturally, don't force it.

### Check for context

At the start, quickly check what exists:
\`\`\`bash
spool list --json
\`\`\`

This tells you:
- If there are active changes
- Their names, schemas, and status
- What the user might be working on

### When no change exists

Think freely. When insights crystallize, you might offer:

- "This feels solid enough to start a change. Want me to create one?"
  → Can transition to \`/spool-new-change\` or \`/spool-ff-change\`
- Or keep exploring - no pressure to formalize

### When a change exists

If the user mentions a change or you detect one is relevant:

1. **Read existing artifacts for context**
   - \`${spoolDir}/changes/<name>/proposal.md\`
   - \`${spoolDir}/changes/<name>/design.md\`
   - \`${spoolDir}/changes/<name>/tasks.md\`

2. **Check the current status**
   \`\`\`bash
   spool show <name> --status
   \`\`\`

3. **Update the conversation accordingly**
   - If PROPOSED → "I can see this is still in proposal stage. Want to work through implementation?"
   - If IN_PROGRESS → "Looks like you're already working on this. Should we continue with tasks?"
   - If DONE → "This appears to be complete. Are we exploring extensions or new work?"

---

## When to Stop Exploring

The user decides when to stop. Common signals:

- **Natural conclusion**: "I think I understand this now"
- **Decision point**: "Ready to move forward"
- **Task switching**: "Let's work on something else"
- **Time constraint**: "That's enough for now"

---

## Optional: Capture Insights

If valuable insights emerged, you might offer:

> "This was useful. Want me to:
> - Create a change: /spool-new-change <name>
> - Fast-forward to tasks: /spool-ff-change <name>
> - Keep exploring: just keep talking"

But this summary is optional. Sometimes the thinking IS the value.

---

## Guardrails

- **Don't fake understanding** - If something is unclear, dig deeper
- **Don't rush** - Discovery is thinking time, not task time
- **Don't force structure** - Let patterns emerge naturally
- **Don't auto-capture** - Offer to save insights, don't just do it
- **Do visualize** - A good diagram is worth many paragraphs
- **Do explore the codebase** - Ground discussions in reality
- **Do question assumptions** - Including the user's and your own`;

  return {
    name: 'spool-explore',
    description: 'Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change.',
    instructions: replaceHardcodedDotSpoolPaths(rawInstructions, spoolDir)
  };
}

/**
 * Template for spool-new-change skill
 * Based on /spool-new-change command
 */
export function getNewChangeSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  const rawInstructions = `Start a new change using the experimental artifact-driven approach.

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → \`add-user-auth\`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

 2. **Determine the workflow schema**

   Use the default schema (omit \`--schema\`) unless the user explicitly requests a different workflow.

   **Use a different schema only if the user mentions:**
   - "tdd" or "test-driven" → use \`--schema tdd\`
   - A specific schema name → use \`--schema <name>\`
   - "show workflows" or "what workflows" → run \`spool schemas --json\` and let them choose

   **Otherwise**: Omit \`--schema\` to use the default.

 3. **Pick or create a module**
   \`\`\`bash
   spool module list --json
   \`\`\`
   - If the request maps to an existing module, use that module ID
   - If this is a small, ungrouped task, default to module \`000\`
   - If no module fits, create one:
     \`\`\`bash
     spool module new "<module-name>"
     \`\`\`
   - Capture the module ID for the new change

 4. **Create the change directory (module-first)**
   \`\`\`bash
   spool new change "<name>" --module <module-id>
   \`\`\`
   Add \`--schema <name>\` only if the user requested a specific workflow.
   This creates a scaffolded change at \`.spool/changes/<module-id>-NN_<name>/\` with the selected schema.

 5. **Show the artifact status**
   \`\`\`bash
   spool status --change "<change-id>"
   \`\`\`
   This shows which artifacts need to be created and which are ready (dependencies satisfied).

 6. **Get instructions for the first artifact**
   The first artifact depends on the schema (e.g., \`proposal\` for spec-driven, \`spec\` for tdd).
   Check the status output to find the first artifact with status "ready".
   \`\`\`bash
   spool instructions <first-artifact-id> --change "<change-id>"
   \`\`\`
   This outputs the template and context for creating the first artifact.

 7. **STOP and wait for user direction**


**Output**

After completing the steps, summarize:
- Change name and location
- Schema/workflow being used and its artifact sequence
- Current status (0/N artifacts complete)
- The template for the first artifact
- Prompt: "Ready to create the first artifact? Just describe what this change is about and I'll draft it, or ask me to continue."

**Guardrails**
- Do NOT create any artifacts yet - just show the instructions
- Do NOT advance beyond showing the first artifact template
- If the name is invalid (not kebab-case), ask for a valid name
- If a change with that name already exists, suggest continuing that change instead
- Pass --schema if using a non-default workflow`;

  return {
    name: 'spool-new-change',
    description: 'Start a new Spool change using the experimental artifact workflow. Use when the user wants to create a new feature, fix, or modification with a structured step-by-step approach.',
    instructions: replaceHardcodedDotSpoolPaths(rawInstructions, spoolDir)
  };
}

/**
 * Template for spool-continue-change skill
 * Based on /spool-continue-change command
 */
export function getContinueChangeSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-continue-change',
    description: 'Continue working on an Spool change by creating the next artifact. Use when the user wants to progress their change, create the next artifact, or continue their workflow.',
    instructions: `Continue working on a change by creating the next artifact.

**Input**: Optionally specify a change name. If omitted, MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run \`spool list --json\` to get available changes sorted by most recently modified. Then use the **AskUserQuestion tool** to let the user select which change to work on.

   Present the top 3-4 most recently modified changes as options, showing:
   - Change name
   - Schema (from \`schema\` field if present, otherwise "spec-driven")
   - Status (e.g., "0/5 tasks", "complete", "no tasks")
   - How recently it was modified (from \`lastModified\` field)

   Mark the most recently modified change as "(Recommended)" since it's likely what the user wants to continue.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check current status**
   \`\`\`bash
   spool status --change "<change-id>" --json
   \`\`\`
   Parse the JSON to understand current state. The response includes:
   - \`schemaName\`: The workflow schema being used (e.g., "spec-driven", "tdd")
   - \`artifacts\`: Array of artifacts with their status ("done", "ready", "blocked")
   - \`isComplete\`: Boolean indicating if all artifacts are complete

3. **Act based on status**:

   ---

   **If all artifacts are complete (\`isComplete: true\`)**:
   - Congratulate the user
   - Show final status including the schema used
   - Suggest: "All artifacts created! You can now implement this change or archive it."
   - STOP

   ---

   **If artifacts are ready to create** (status shows artifacts with \`status: "ready"\`):
   - Pick the FIRST artifact with \`status: "ready"\` from the status output
   - Get its instructions:
     \`\`\`bash
     spool instructions <artifact-id> --change "<change-id>" --json
     \`\`\`
   - Parse the JSON to get template, dependencies, and what it unlocks
   - **Create the artifact file** using the template as a starting point:
     - Read any completed dependency files for context
     - Fill in the template based on context and user's goals
     - Write to the output path specified in instructions
   - Show what was created and what's now unlocked
   - STOP after creating ONE artifact

   ---

   **If no artifacts are ready (all blocked)**:
   - This shouldn't happen with a valid schema
   - Show status and suggest checking for issues

4. **After creating an artifact, show progress**
   \`\`\`bash
   spool status --change "<change-id>"
   \`\`\`

**Output**

After each invocation, show:
- Which artifact was created
- Schema workflow being used
- Current progress (N/M complete)
- What artifacts are now unlocked
- Prompt: "Want to continue? Just ask me to continue or tell me what to do next."

**Artifact Creation Guidelines**

The artifact types and their purpose depend on the schema. Use the \`instruction\` field from the instructions output to understand what to create.

Common artifact patterns:

**spec-driven schema** (proposal → specs → design → tasks):
- **proposal.md**: Ask user about the change if not clear. Fill in Why, What Changes, Capabilities, Impact.
  - The Capabilities section is critical - each capability listed will need a spec file.
- **specs/*.md**: Create one spec per capability listed in the proposal.
- **design.md**: Document technical decisions, architecture, and implementation approach.
- **tasks.md**: Break down implementation into checkboxed tasks.

**tdd schema** (spec → tests → implementation → docs):
- **spec.md**: Feature specification defining what to build.
- **tests/*.test.ts**: Write tests BEFORE implementation (TDD red phase).
- **src/*.ts**: Implement to make tests pass (TDD green phase).
- **docs/*.md**: Document the implemented feature.

For other schemas, follow the \`instruction\` field from the CLI output.

**Guardrails**
- Create ONE artifact per invocation
- Always read dependency artifacts before creating a new one
- Never skip artifacts or create out of order
- If context is unclear, ask the user before creating
- Verify the artifact file exists after writing before marking progress
- Use the schema's artifact sequence, don't assume specific artifact names`
  };
}

/**
 * Template for spool-apply-change skill
 * For implementing tasks from a completed (or in-progress) change
 */
export function getApplyChangeSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-apply-change',
    description: 'Implement tasks from an Spool change. Use when the user wants to start implementing, continue implementation, or work through tasks.',
    instructions: `Implement tasks from an Spool change.

**Input**: Optionally specify a change name. If omitted, MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run \`spool list --json\` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show changes that are implementation-ready (have tasks artifact).
   Include the schema used for each change if available.
   Mark changes with incomplete tasks as "(In Progress)".

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check status to understand the schema**
   \`\`\`bash
   spool status --change "<change-id>" --json
   \`\`\`
   Parse the JSON to understand:
   - \`schemaName\`: The workflow being used (e.g., "spec-driven", "tdd")
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   \`\`\`bash
   spool instructions apply --change "<change-id>" --json
   \`\`\`

   This returns:
   - Context file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If \`state: "blocked"\` (missing artifacts): show message, suggest using spool-continue-change
   - If \`state: "all_done"\`: congratulate, suggest archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read the files listed in \`contextFiles\` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - **tdd**: spec, tests, implementation, docs
   - Other schemas: follow the contextFiles from CLI output

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

6. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - Mark task complete in the tasks file: \`- [ ]\` → \`- [x]\`
   - Continue to next task

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

7. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

\`\`\`
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
\`\`\`

**Output On Completion**

\`\`\`
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! Ready to archive this change.
\`\`\`

**Output On Pause (Issue Encountered)**

\`\`\`
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
\`\`\`

**Guardrails**
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly`
  };
}

/**
 * Template for spool-ff-change skill
 * Fast-forward through artifact creation
 */
export function getFfChangeSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-ff-change',
    description: 'Fast-forward through Spool artifact creation. Use when the user wants to quickly create all artifacts needed for implementation without stepping through each one individually.',
    instructions: `Fast-forward through artifact creation - generate everything needed to start implementation in one go.

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

 1. **If no clear input provided, ask what they want to build**
 
    Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
    > "What change do you want to work on? Describe what you want to build or fix."
 
    From their description, derive a kebab-case name (e.g., "add user authentication" → \`add-user-auth\`).
 
    **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.
 
 2. **Pick or create a module**
    \`\`\`bash
    spool module list --json
    \`\`\`
    - If the request maps to an existing module, use that module ID
    - If this is a small, ungrouped task, default to module \`000\`
    - If no module fits, create one:
      \`\`\`bash
      spool module new "<module-name>"
      \`\`\`
    - Capture the module ID for the new change
 
 3. **Create the change directory (module-first)**
    \`\`\`bash
    spool new change "<name>" --module <module-id>
    \`\`\`
    This creates a scaffolded change at \`.spool/changes/<module-id>-NN_<name>/\`.
 
  4. **Get the artifact build order**
    \`\`\`bash
    spool status --change "<change-id>" --json
    \`\`\`
 
    Parse the JSON to get:
    - \`applyRequires\`: array of artifact IDs needed before implementation (e.g., \`["tasks"]\`)
    - \`artifacts\`: list of all artifacts with their status and dependencies
 
  5. **Create artifacts in sequence until apply-ready**
 
    Use the **TodoWrite tool** to track progress through the artifacts.


   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

    a. **For each artifact that is \`ready\` (dependencies satisfied)**:
      - Get instructions:
        \`\`\`bash
        spool instructions <artifact-id> --change "<change-id>" --json
        \`\`\`

      - The instructions JSON includes:
        - \`template\`: The template content to use
        - \`instruction\`: Schema-specific guidance for this artifact type
        - \`outputPath\`: Where to write the artifact
        - \`dependencies\`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file following the schema's \`instruction\`
      - Show brief progress: "✓ Created <artifact-id>"

   b. **Continue until all \`applyRequires\` artifacts are complete**
      - After creating each artifact, re-run \`spool status --change "<change-id>" --json\`
      - Check if every artifact ID in \`applyRequires\` has \`status: "done"\` in the artifacts array
      - Stop when all \`applyRequires\` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

5. **Show final status**
   \`\`\`bash
   spool status --change "<change-id>"
   \`\`\`

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- What's ready: "All artifacts created! Ready for implementation."
- Prompt: "Run \`/spool-apply-change\` or ask me to implement to start working on the tasks."

**Artifact Creation Guidelines**

- Follow the \`instruction\` field from \`spool instructions\` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use the \`template\` as a starting point, filling in based on context

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's \`apply.requires\`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, suggest continuing that change instead
- Verify each artifact file exists after writing before proceeding to next`
  };
}

/**
 * Template for spool-sync-specs skill
 * For syncing delta specs from a change to main specs (agent-driven)
 */
export function getSyncSpecsSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-sync-specs',
    description: 'Sync delta specs from a change to main specs. Use when the user wants to update main specs with changes from a delta spec, without archiving the change.',
    instructions: `Sync delta specs from a change to main specs.

This is an **agent-driven** operation - you will read delta specs and directly edit main specs to apply the changes. This allows intelligent merging (e.g., adding a scenario without copying the entire requirement).

**Input**: Optionally specify a change name. If omitted, MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run \`spool list --json\` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show changes that have delta specs (under \`specs/\` directory).

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Find delta specs**

   Look for delta spec files in \`.spool/changes/<name>/specs/*/spec.md\`.

   Each delta spec file contains sections like:
   - \`## ADDED Requirements\` - New requirements to add
   - \`## MODIFIED Requirements\` - Changes to existing requirements
   - \`## REMOVED Requirements\` - Requirements to remove
   - \`## RENAMED Requirements\` - Requirements to rename (FROM:/TO: format)

   If no delta specs found, inform user and stop.

3. **For each delta spec, apply changes to main specs**

   For each capability with a delta spec at \`.spool/changes/<name>/specs/<capability>/spec.md\`:

   a. **Read the delta spec** to understand the intended changes

   b. **Read the main spec** at \`.spool/specs/<capability>/spec.md\` (may not exist yet)

   c. **Apply changes intelligently**:

      **ADDED Requirements:**
      - If requirement doesn't exist in main spec → add it
      - If requirement already exists → update it to match (treat as implicit MODIFIED)

      **MODIFIED Requirements:**
      - Find the requirement in main spec
      - Apply the changes - this can be:
        - Adding new scenarios (don't need to copy existing ones)
        - Modifying existing scenarios
        - Changing the requirement description
      - Preserve scenarios/content not mentioned in the delta

      **REMOVED Requirements:**
      - Remove the entire requirement block from main spec

      **RENAMED Requirements:**
      - Find the FROM requirement, rename to TO

   d. **Create new main spec** if capability doesn't exist yet:
      - Create \`.spool/specs/<capability>/spec.md\`
      - Add Purpose section (can be brief, mark as TBD)
      - Add Requirements section with the ADDED requirements

4. **Show summary**

   After applying all changes, summarize:
   - Which capabilities were updated
   - What changes were made (requirements added/modified/removed/renamed)

**Delta Spec Format Reference**

\`\`\`markdown
## ADDED Requirements

### Requirement: New Feature
The system SHALL do something new.

#### Scenario: Basic case
- **WHEN** user does X
- **THEN** system does Y

## MODIFIED Requirements

### Requirement: Existing Feature
#### Scenario: New scenario to add
- **WHEN** user does A
- **THEN** system does B

## REMOVED Requirements

### Requirement: Deprecated Feature

## RENAMED Requirements

- FROM: \`### Requirement: Old Name\`
- TO: \`### Requirement: New Name\`
\`\`\`

**Key Principle: Intelligent Merging**

Unlike programmatic merging, you can apply **partial updates**:
- To add a scenario, just include that scenario under MODIFIED - don't copy existing scenarios
- The delta represents *intent*, not a wholesale replacement
- Use your judgment to merge changes sensibly

**Output On Success**

\`\`\`
## Specs Synced: <change-name>

Updated main specs:

**<capability-1>**:
- Added requirement: "New Feature"
- Modified requirement: "Existing Feature" (added 1 scenario)

**<capability-2>**:
- Created new spec file
- Added requirement: "Another Feature"

Main specs are now updated. The change remains active - archive when implementation is complete.
\`\`\`

**Guardrails**
- Read both delta and main specs before making changes
- Preserve existing content not mentioned in delta
- If something is unclear, ask for clarification
- Show what you're changing as you go
- The operation should be idempotent - running twice should give same result`
  };
}

// -----------------------------------------------------------------------------
// Core Spool Workflow Skills
// -----------------------------------------------------------------------------

/**
 * Template for spool-commit skill
 * Helps create atomic commits aligned to Spool changes
 */
export function getCommitSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  const rawInstructions = `Create atomic git commits aligned to Spool changes.

This skill is intended to be installed by \`spool init\` so agents can commit work per Spool change in a consistent way.

**Concept:** In Spool-driven workflows, you typically make progress by creating/applying a change. After applying and verifying a change, you should usually create a git commit that corresponds to that change.

**Key behavior**
- Prefer 1 commit per applied Spool change (or a small number of commits if the change is large).
- Include the Spool change id in the commit message when practical (e.g. \`001-02_add-tasks\`).
- Use Spool inspection commands to anchor the commit to what was actually applied.

## Parameters to check

When invoking this skill, check for these parameters in context:

- **auto_mode**: boolean flag
  - \`true\`: create commits immediately without asking for confirmation
  - \`false\` or missing: ask for confirmation of each commit message
  - CRITICAL: this only applies to the current invocation and is reset afterwards

- **change_id**: optional, a Spool change id (recommended)
  - If missing, prompt the user to pick from \`spool list --json\`

- **stacked_mode**: optional boolean
  - If \`true\`, create stacked branches per commit (only if tooling exists)
  - If \`false\` or missing, commit on current branch

- **ticket_id**: optional identifier to include in commit messages

## Prerequisites

1. Verify repo has changes:
   - \`git status --short\`
   - If no changes, stop with: "No changes found to commit"

2. Identify Spool change context

   If \`change_id\` not provided:
   - Run \`spool list --json\`
   - Use AskUserQuestion to select a change (recommended: most recently modified)

   Then inspect the change:
   - \`spool status --change "<change-id>"\`
   - If available, prefer \`--json\` and parse it

3. Confirm the change is in a good commit state:
   - Ensure artifacts/tasks are complete enough that a commit makes sense
   - If the change is unfinished, ask user whether to commit "WIP" or wait

## Commit grouping strategy (Spool-first)

1. Default grouping: **one commit per change**
   - Use the change id + change name as the primary unit

2. If the change is too large:
   - Split into 2–3 commits based on task boundaries
   - Keep each commit independently buildable

## Generate commit message

Use conventional commit format:

- Format: \`type(scope): description\`
- Prefer scope = Spool module name or ticket id
- Description should mention the change goal
- Include Spool change id at end, in parentheses, when practical

Examples:
- \`feat(todo): add task model and parsing (001-02_add-task-core)\`
- \`fix(storage): persist tasks atomically (002-01_storage-save)\`

## Procedure

1. Read diffs
   - \`git diff\`
   - \`git status --short\`

2. Stage files for the selected change
   - Prefer staging only files touched by that change
   - If unsure which files belong, use Spool inspection output + git diff to decide

3. Decide commit messages

- If \`auto_mode\` is true:
  - Commit immediately: \`git commit -m "<message>"\`

- If \`auto_mode\` is false/missing:
  - Present 1 recommended message + 2 alternatives
  - Ask user to confirm or provide custom message

4. Verify after each commit
   - \`git status --short\`
   - Optionally run the smallest relevant verification (tests/build) if fast

## Output

After committing, show:
- Change committed: <change-id>
- Commit SHA + message (\`git log -1 --oneline\`)
- Remaining uncommitted changes (if any)

## Important: auto_mode reset

After this invocation finishes, auto commit behavior must be considered reset. Future operations require explicit \`--auto\` again.
`;

  return {
    name: 'spool-commit',
    description: 'Create atomic git commits aligned to Spool changes. Use when you want to commit work after applying a change, optionally with auto-mode.',
    instructions: replaceHardcodedDotSpoolPaths(rawInstructions, spoolDir),
  };
}


/**
 * Template for spool-proposal skill
 * Creates and manages Spool change proposals
 */
export function getProposalSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-proposal',
    description: 'Create and manage Spool change proposals. Use when the user wants to propose a new feature, fix, or modification that needs structured planning and review.',
    instructions: `Create and manage Spool change proposals using the spec-driven workflow.

**Input**: The user's request for a change they want to make to the project.

**Steps**

 1. **Understand the change request**
   - Listen to what the user wants to build or fix
   - Ask clarifying questions if the request is vague
   - Identify the scope and impact of the change

  2. **Check for existing changes**
    \`\`\`bash
    spool list --json
    \`\`\`
    - If a similar change exists, suggest continuing that instead
    - Otherwise, proceed with creating a new proposal

   3. **Pick or create a module**
     \`\`\`bash
     spool module list --json
     \`\`\`
     - If the request maps to an existing module, use that module ID
     - If this is a small, ungrouped task, default to module \`000\`
     - If no module fits, create one:
       \`\`\`bash
       spool module new "<module-name>"
       \`\`\`
     - Capture the module ID for the new change

   4. **Create the change directory (module-first)**
     \`\`\`bash
     spool new change "<name>" --module <module-id>
     \`\`\`
     - Use a kebab-case name derived from the user's request
     - This creates the scaffolded structure at \`.spool/changes/<module-id>-NN_<name>/\`

   5. **Create the proposal artifact**
     \`\`\`bash
     spool instructions proposal --change "<change-id>"
     \`\`\`

    - Get the template and context for creating the proposal.md
    - Read the template and fill it out based on the user's request:
      - **Why**: What problem does this solve? What's the business value?
      - **What Changes**: High-level description of what will change
      - **Capabilities**: List of new/modified capabilities (each becomes a spec)
      - **Impact**: How this affects existing functionality, performance, etc.

  6. **Show the proposal status**
    \`\`\`bash
    spool status --change "<change-id>"
    \`\`\`
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
- Ensure each capability listed could reasonably become a separate spec file`
  };
}

/**
 * Template for spool-apply skill
 * Implements tasks from completed change proposals
 */
export function getApplySkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  const rawInstructions = `Implement tasks from a completed Spool change proposal.

**Input**: Optionally specify a change name. If omitted, MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run \`spool list --json\` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show changes that are implementation-ready (have tasks artifact and all required artifacts).
   Mark recently modified changes as "(Recent)".

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check change is ready for implementation**
   \`\`\`bash
   spool status --change "<change-id>" --json
   \`\`\`
   - Verify all required artifacts are complete (proposal, specs, design, tasks)
   - If artifacts are missing, suggest using \`spool-continue-change\` first

3. **Get implementation context**
   \`\`\`bash
   spool instructions apply --change "<change-id>" --json
   \`\`\`
   - This returns context files, task list, and progress
   - Parse the JSON to understand the current state

4. **Read all context files**
   - proposal.md: Understand the high-level goals
   - specs/*/spec.md: Understand the detailed requirements
   - design.md: Understand the technical approach
   - tasks.md: Get the task list to implement

5. **Show current implementation plan**
   - Display the change summary and schema used
   - Show task progress: "N/M tasks complete"
   - List the remaining tasks to implement

6. **Implement tasks systematically**

   For each pending task in tasks.md:
   - **Start the task**: Mark as in-progress if the task format supports it
   - **Understand the task**: Read relevant specs and design sections
   - **Implement the changes**: Write code, tests, documentation as needed
   - **Verify the implementation**: Run tests, check functionality
   - **Mark the task complete**: Change \`- [ ]\` to \`- [x]\` in tasks.md
   - **Show progress**: Briefly report what was completed

   **Pause if:**
   - Task requirements are unclear → ask for clarification
   - Implementation reveals design issues → suggest updating artifacts
   - Tests are failing → debug and fix
   - User interrupts or wants to review progress

7. **After completing tasks, validate**
   \`\`\`bash
   spool validate --changes <name>
   \`\`\`
   - Run validation to ensure the change meets all requirements
   - Fix any issues found during validation

**Output During Implementation**

\`\`\`
## Implementing: <change-name>

Working on task 3/7: <task description>
[Implementation details...]
✓ Task complete: <summary of what was done>

Working on task 4/7: <task description>
[Implementation details...]
✓ Task complete: <summary of what was done>
\`\`\`

**Output On Completion**

\`\`\`
## Implementation Complete: <change-name>

**Progress:** 7/7 tasks complete ✓
**Validation:** All checks passed

### Summary
- [x] Task 1: <description>
- [x] Task 2: <description>
...
- [x] Task 7: <description>

Ready to archive this change with: \`spool archive <name>\`
\`\`\`

**Guardrails**
- Always read context files before starting implementation
- Follow the technical approach defined in design.md
- Implement tasks in order unless there's a good reason not to
- Mark tasks complete immediately after finishing each one
- If implementation reveals issues, pause and suggest artifact updates
- Run validation before considering the change complete`;

  return {
    name: 'spool-apply',
    description: 'Implement tasks from a completed Spool change proposal. Use when the user wants to start coding or implementing an approved change.',
    instructions: replaceHardcodedDotSpoolPaths(rawInstructions, spoolDir)
  };
}

/**
 * Template for spool-archive skill
 * Archives completed changes and updates main specs
 */
export function getArchiveSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-archive',
    description: 'Archive a completed change and update main specifications. Use when the user has finished implementing and wants to integrate the change into the main codebase.',
    instructions: `Archive a completed change and update main specifications.

**Input**: Optionally specify a change name. If omitted, MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run \`spool list --json\` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show completed changes (all artifacts done) that are ready for archiving.
   Mark recently completed changes as "(Recent)".

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Validate the change is ready**
   \`\`\`bash
   spool validate --changes <name>
   \`\`\`
   - Ensure all requirements are met
   - Check that implementation is complete
   - Verify tests are passing

3. **Show what will be archived**
   - Display the change summary from proposal.md
   - List the capabilities that will be integrated into main specs
   - Show any breaking changes or migration requirements

4. **Confirm with user**
   - Ask: "Ready to archive <name>? This will integrate the change into main specs."
   - Wait for explicit confirmation before proceeding

5. **Archive the change**
   \`\`\`bash
   spool archive <name>
   \`\`\`
   - This will:
     - Move change directory to \`.spool/changes/archive/\`
     - Update main specs with delta specs from the change
     - Update any relevant project documentation

6. **Verify the archive**
   - Check that the change is in the archive
   - Verify main specs were updated correctly
   - Confirm no artifacts were lost

**Output On Success**

\`\`\`
## Change Archived: <change-name>

**Summary:** <brief description of the change>

**Integrated Capabilities:**
- **<capability-1>**: Updated main spec with new requirements
- **<capability-2>**: Added new scenarios to existing requirements

**Archive Location:** .spool/changes/archive/<name>/

**Next Steps:**
- Commit the updated main specs
- Consider updating documentation
- Communicate changes to team

The change is now part of the main codebase specifications!
\`\`\`

**Output If Not Ready**

\`\`\`
## Change Not Ready to Archive

**Issues Found:**
- [ ] Some tasks are not complete
- [ ] Validation failed: <specific issues>
- [ ] Tests are not passing

**Recommended Actions:**
1. Complete remaining tasks with \`spool-apply\`
2. Fix validation issues
3. Run tests and ensure they pass
4. Try archiving again

Ready to fix these issues, or want to review the change first?
\`\`\`

**Guardrails**
- Always validate before archiving
- Get explicit user confirmation before proceeding
- Ensure all delta specs are properly integrated
- Verify the archive process completed successfully`
  };
}

/**
 * Template for spool-research skill
 * Conducts research for new features or investigations
 */
export function getResearchSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-research',
    description: 'Conduct structured research for feature development, technology evaluation, or problem investigation. Use when the user needs to explore options, analyze trade-offs, or investigate technical approaches.',
    instructions: `Conduct structured research using Spool's research framework.

**Input**: The research topic or question the user wants to investigate.

**Steps**

1. **Understand the research scope**
   - Clarify what the user wants to research
   - Identify the specific questions to answer
   - Determine the research depth needed (quick analysis vs. deep dive)

2. **Initialize research structure**
   \`\`\`bash
   # Create research directory if it doesn't exist
   mkdir -p .spool/research/investigations
   \`\`\`
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
   Create structured documentation in \`.spool/research/\`:
   - \`SUMMARY.md\`: Executive summary and recommendations
   - \`investigations/stack-analysis.md\`: Technology stack evaluation
   - \`investigations/feature-landscape.md\`: Solution survey
   - \`investigations/architecture.md\`: Architectural analysis
   - \`investigations/pitfalls.md\`: Risk assessment

6. **Synthesize recommendations**
   Based on all research, provide:
   - **Recommended approach**: What should be done and why
   - **Alternatives**: Other viable options with trade-offs
   - **Next steps**: How to proceed with implementation
   - **Open questions**: Remaining unknowns or uncertainties

**Output Format**

\`\`\`
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
\`\`\`

**Guardrails**
- Focus research on the specific questions asked
- Provide concrete, actionable recommendations
- Clearly distinguish between facts, analysis, and opinions
- Identify risks and uncertainties explicitly
- Keep research documentation structured and reusable`
  };
}

/**
 * Template for spool-review skill
 * Reviews and validates changes, specs, or implementations
 */
export function getReviewSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-review',
    description: 'Review and validate Spool changes, specs, or implementations. Use when the user wants a quality check, code review, or validation of project artifacts.',
    instructions: `Conduct comprehensive review of Spool artifacts, code changes, or specifications.

**Input**: What to review (change name, spec name, or specific code/files).

**Steps**

1. **Identify review scope**
   - Understand what the user wants reviewed (change, spec, implementation, etc.)
   - Determine the type of review needed (validation, quality check, security, etc.)
   - Clarify the review criteria and focus areas

2. **Select appropriate review method**

   **For Changes:**
   \`\`\`bash
   spool validate --changes <name> --strict --json
   \`\`\`
   - Run structured validation on the change
   - Check all artifacts are complete and consistent
   - Verify requirements are fully specified

   **For Specs:**
   \`\`\`bash
   spool validate --specs <name> --strict --json
   \`\`\`
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

\`\`\`
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

**Validation Command:** \`spool validate <type> <name>\`
\`\`\`

**Guardrails**
- Be constructive and specific in feedback
- Prioritize issues by impact on project success
- Provide actionable suggestions, not just criticism
- Acknowledge good work and strengths
- Focus review on stated criteria and scope`
  };
}

// -----------------------------------------------------------------------------
// Slash Command Templates
// -----------------------------------------------------------------------------

export interface CommandTemplate {
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
}

/**
 * Template for /spool-explore slash command
 * Explore mode - adaptive thinking partner
 */
export function getSpoolExploreCommandTemplate(): CommandTemplate {
  return {
    name: 'Spool Explore',
    description: 'Enter explore mode - think through ideas, investigate problems, clarify requirements',
    category: 'Workflow',
    tags: ['workflow', 'explore', 'experimental', 'thinking'],
    content: `Use the \`spool-explore\` skill.

Follow the skill instructions exactly.

If the skill is missing, install it first:
\`spool skills install spool-explore\``
  };
}


/**
 * Template for /spool-new-change slash command
 */
export function getSpoolNewChangeCommandTemplate(): CommandTemplate {
  return {
    name: 'Spool New Change',
    description: 'Start a new change using the experimental artifact workflow',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: `Use the \`spool-new-change\` skill.

Follow the skill instructions exactly (module-first + CLI driven).

If the skill is missing, install it first:
\`spool skills install spool-new-change\``
  };
}

/**
 * Template for /spool-continue-change slash command
 */
export function getSpoolContinueChangeCommandTemplate(): CommandTemplate {
  return {
    name: 'Spool Continue Change',
    description: 'Continue working on a change - create the next artifact (Experimental)',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: `Use the \`spool-continue-change\` skill.

Follow the skill instructions exactly.

If the skill is missing, install it first:
\`spool skills install spool-continue-change\``
  };
}


/**
 * Template for /spool-apply-change slash command
 */
export function getSpoolApplyChangeCommandTemplate(): CommandTemplate {
  return {
    name: 'Spool Apply Change',
    description: 'Implement tasks from an Spool change (Experimental)',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: `Use the \`spool-apply-change\` skill.

Follow the skill instructions exactly.

If the skill is missing, install it first:
\`spool skills install spool-apply-change\``
  };
}



/**
 * Template for /spool-ff-change slash command
 */
export function getSpoolFfChangeCommandTemplate(): CommandTemplate {
  return {
    name: 'Spool Fast Forward',
    description: 'Create a change and generate all artifacts needed for implementation in one go',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: `Use the \`spool-ff-change\` skill.

Follow the skill instructions exactly (module-first + CLI driven).

If the skill is missing, install it first:
\`spool skills install spool-ff-change\``
  };
}

/**
 * Template for spool-archive-change skill
 * For archiving completed changes in the experimental workflow
 */
export function getArchiveChangeSkillTemplate(spoolDir: string = '.spool'): SkillTemplate {
  return {
    name: 'spool-archive-change',
    description: 'Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.',
    instructions: `Archive a completed change in the experimental workflow.

**Input**: Optionally specify a change name. If omitted, MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run \`spool list --json\` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run \`spool status --change "<change-id>" --json\` to check artifact completion.

   Parse the JSON to understand:
   - \`schemaName\`: The workflow being used
   - \`artifacts\`: List of artifacts with their status (\`done\` or other)

   **If any artifacts are not \`done\`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically \`tasks.md\`) to check for incomplete tasks.

   Count tasks marked with \`- [ ]\` (incomplete) vs \`- [x]\` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Check if delta specs need syncing**

   Check if \`specs/\` directory exists in the change with spec files.

   **If delta specs exist, perform a quick sync check:**

   a. **For each delta spec** at \`.spool/changes/<name>/specs/<capability>/spec.md\`:
      - Extract requirement names (lines matching \`### Requirement: <name>\`)
      - Note which sections exist (ADDED, MODIFIED, REMOVED)

   b. **Check corresponding main spec** at \`.spool/specs/<capability>/spec.md\`:
      - If main spec doesn't exist → needs sync
      - If main spec exists, check if ADDED requirement names appear in it
      - If any ADDED requirements are missing from main spec → needs sync

   c. **Report findings:**

      **If sync needed:**
      \`\`\`
      ⚠️ Delta specs may not be synced:
      - specs/auth/spec.md → Main spec missing requirement "Token Refresh"
      - specs/api/spec.md → Main spec doesn't exist yet

      Would you like to sync now before archiving?
      \`\`\`
      - Use **AskUserQuestion tool** with options: "Sync now", "Archive without syncing"
      - If user chooses sync, use the \`spool-sync-specs\` skill

      **If already synced (all requirements found):**
      - Proceed without prompting (specs appear to be in sync)

   **If no delta specs exist:** Proceed without sync-related checks.

5. **Perform the archive**

   Create the archive directory if it doesn't exist:
   \`\`\`bash
   mkdir -p .spool/changes/archive
   \`\`\`

   Generate target name using current date: \`YYYY-MM-DD-<change-name>\`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move the change directory to archive

   \`\`\`bash
   mv .spool/changes/<name> .spool/changes/archive/YYYY-MM-DD-<name>
   \`\`\`

6. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Whether specs were synced (if applicable)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

\`\`\`
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** .spool/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs (or "No delta specs" or "⚠️ Not synced")

All artifacts complete. All tasks complete.
\`\`\`

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (spool status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .spool.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use spool-sync-specs approach (agent-driven)
- Quick sync check: look for requirement names in delta specs, verify they exist in main specs`
  };
}

/**
 * Template for /spool-sync-specs slash command
 */
export function getSpoolSyncSpecsCommandTemplate(): CommandTemplate {
  return {
    name: 'Spool Sync Specs',
    description: 'Sync delta specs from a change to main specs',
    category: 'Workflow',
    tags: ['workflow', 'specs', 'experimental'],
    content: `Use the \`spool-sync-specs\` skill.

Follow the skill instructions exactly.

If the skill is missing, install it first:
\`spool skills install spool-sync-specs\``
  };
}

/**
 * Template for /spool-archive-change slash command
 */
export function getSpoolArchiveChangeCommandTemplate(): CommandTemplate {
  return {
    name: 'Spool Archive Change',
    description: 'Archive a completed change in the experimental workflow',
    category: 'Workflow',
    tags: ['workflow', 'archive', 'experimental'],
    content: `Use the \`spool-archive-change\` skill.

Follow the skill instructions exactly.

If the skill is missing, install it first:
\`spool skills install spool-archive-change\``
  };
}
