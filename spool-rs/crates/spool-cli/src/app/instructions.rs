use crate::cli_error::{CliResult, fail, to_cli_error};
use crate::runtime::Runtime;
use crate::util::parse_string_flag;
use spool_core::workflow as core_workflow;

pub(crate) fn handle_instructions(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{}", super::INSTRUCTIONS_HELP);
        return Ok(());
    }

    eprintln!(
        "Warning: \"spool instructions\" is deprecated. Use \"spool x-instructions\" instead."
    );

    let want_json = args.iter().any(|a| a == "--json");
    let artifact = args.first().and_then(|a| {
        if a.starts_with('-') {
            None
        } else {
            Some(a.as_str())
        }
    });
    let change = parse_string_flag(args, "--change");
    if change.as_deref().unwrap_or("").is_empty() {
        return fail("Missing required option --change");
    }
    let change = change.expect("checked above");
    let schema = parse_string_flag(args, "--schema");

    let ctx = rt.ctx();
    let spool_path = rt.spool_path();

    let user_guidance = match core_workflow::load_user_guidance(spool_path) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Warning: failed to read .spool/user-guidance.md: {e}");
            None
        }
    };

    let Some(artifact) = artifact else {
        let schema_name = schema
            .clone()
            .unwrap_or_else(|| core_workflow::default_schema_name().to_string());
        let mut msg = "Missing required argument <artifact>".to_string();
        if let Ok(r) = core_workflow::resolve_schema(Some(&schema_name), ctx) {
            let list = r
                .schema
                .artifacts
                .into_iter()
                .map(|a| a.id)
                .collect::<Vec<_>>();
            if !list.is_empty() {
                msg.push_str(&format!("\n\nValid artifacts:\n  {}", list.join("\n  ")));
            }
        }
        return fail(msg);
    };

    if artifact == "apply" {
        // Match TS/ora: spinner output is written to stderr.
        eprintln!("- Generating apply instructions...");
        let apply = match core_workflow::compute_apply_instructions(
            spool_path,
            &change,
            schema.as_deref(),
            ctx,
        ) {
            Ok(r) => r,
            Err(core_workflow::WorkflowError::InvalidChangeName) => {
                return fail("Invalid change name");
            }
            Err(core_workflow::WorkflowError::ChangeNotFound(name)) => {
                return fail(format!("Change '{name}' not found"));
            }
            Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
                return fail(super::common::schema_not_found_message(ctx, &name));
            }
            Err(e) => return Err(to_cli_error(e)),
        };

        if want_json {
            let rendered = serde_json::to_string_pretty(&apply).expect("json should serialize");
            println!("{rendered}");
            return Ok(());
        }

        print_apply_instructions_text(&apply);
        print_user_guidance_markdown(user_guidance.as_deref());
        return Ok(());
    }

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Generating instructions...");

    let resolved = match core_workflow::resolve_instructions(
        spool_path,
        &change,
        schema.as_deref(),
        artifact,
        ctx,
    ) {
        Ok(r) => r,
        Err(core_workflow::WorkflowError::ArtifactNotFound(name)) => {
            let schema_name = schema
                .clone()
                .unwrap_or_else(|| core_workflow::read_change_schema(spool_path, &change));
            let mut msg = format!("Artifact '{name}' not found in schema '{schema_name}'.");
            if let Ok(r) = core_workflow::resolve_schema(Some(&schema_name), ctx) {
                let list = r
                    .schema
                    .artifacts
                    .into_iter()
                    .map(|a| a.id)
                    .collect::<Vec<_>>();
                if !list.is_empty() {
                    msg.push_str(&format!("\n\nValid artifacts:\n  {}", list.join("\n  ")));
                }
            }
            return fail(msg);
        }
        Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
            return fail(super::common::schema_not_found_message(ctx, &name));
        }
        Err(e) => return Err(to_cli_error(e)),
    };

    if want_json {
        let rendered = serde_json::to_string_pretty(&resolved).expect("json should serialize");
        println!("{rendered}");
        return Ok(());
    }

    print_artifact_instructions_text(&resolved, user_guidance.as_deref());

    Ok(())
}

pub(crate) fn handle_x_instructions(rt: &Runtime, args: &[String]) -> CliResult<()> {
    eprintln!(
        "Warning: \"spool x-instructions\" is deprecated. Use \"spool agent instruction\" instead."
    );
    handle_agent_instruction(rt, args)
}

pub(crate) fn handle_agent(rt: &Runtime, args: &[String]) -> CliResult<()> {
    // Check for subcommand first - subcommand handlers have their own help checks
    match args.first().map(|s| s.as_str()) {
        Some("instruction") => handle_agent_instruction(rt, &args[1..]),
        // Show parent help only if no valid subcommand or explicit help request
        _ if args.is_empty() || args.iter().any(|a| a == "--help" || a == "-h") => {
            println!("{}", super::AGENT_HELP);
            Ok(())
        }
        _ => {
            println!("{}", super::AGENT_HELP);
            Ok(())
        }
    }
}

pub(crate) fn handle_agent_instruction(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.is_empty() || args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{}", super::AGENT_INSTRUCTION_HELP);
        return Ok(());
    }
    let want_json = args.iter().any(|a| a == "--json");
    let artifact = args.first().map(|s| s.as_str()).unwrap_or("");
    if artifact.is_empty() || artifact.starts_with('-') {
        return fail("Missing required argument <artifact>");
    }

    if artifact == "bootstrap" {
        let tool = parse_string_flag(args, "--tool");
        if tool.as_deref().unwrap_or("").is_empty() {
            return fail("Missing required option --tool for bootstrap artifact");
        }
        let tool = tool.expect("checked above");
        let valid_tools = ["opencode", "claude", "codex"];
        if !valid_tools.contains(&tool.as_str()) {
            return fail(format!(
                "Invalid tool '{}'. Valid tools: {}",
                tool,
                valid_tools.join(", ")
            ));
        }

        let instruction = generate_bootstrap_instruction(&tool);
        if want_json {
            let response = core_workflow::AgentInstructionResponse {
                artifact_id: "bootstrap".to_string(),
                instruction,
            };
            let rendered = serde_json::to_string_pretty(&response).expect("json should serialize");
            println!("{rendered}");
            return Ok(());
        }

        print!("{instruction}");
        return Ok(());
    }

    let change = parse_string_flag(args, "--change");
    if change.as_deref().unwrap_or("").is_empty() {
        return fail("Missing required option --change");
    }
    let change = change.expect("checked above");
    let schema = parse_string_flag(args, "--schema");

    let ctx = rt.ctx();
    let spool_path = rt.spool_path();

    let user_guidance = match core_workflow::load_user_guidance(spool_path) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Warning: failed to read .spool/user-guidance.md: {e}");
            None
        }
    };

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Generating instructions...");

    if artifact == "apply" {
        // Match TS/ora: spinner output is written to stderr.
        eprintln!("- Generating apply instructions...");

        let apply = match core_workflow::compute_apply_instructions(
            spool_path,
            &change,
            schema.as_deref(),
            ctx,
        ) {
            Ok(r) => r,
            Err(core_workflow::WorkflowError::InvalidChangeName) => {
                return fail("Invalid change name");
            }
            Err(core_workflow::WorkflowError::ChangeNotFound(name)) => {
                return fail(format!("Change '{name}' not found"));
            }
            Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
                return fail(super::common::schema_not_found_message(ctx, &name));
            }
            Err(e) => return Err(to_cli_error(e)),
        };

        if want_json {
            let rendered = serde_json::to_string_pretty(&apply).expect("json should serialize");
            println!("{rendered}");
            return Ok(());
        }

        print_apply_instructions_text(&apply);
        print_user_guidance_markdown(user_guidance.as_deref());
        return Ok(());
    }

    let resolved = match core_workflow::resolve_instructions(
        spool_path,
        &change,
        schema.as_deref(),
        artifact,
        ctx,
    ) {
        Ok(r) => r,
        Err(e) => return Err(to_cli_error(e)),
    };

    if want_json {
        let rendered = serde_json::to_string_pretty(&resolved).expect("json should serialize");
        println!("{rendered}");
        return Ok(());
    }
    print_artifact_instructions_text(&resolved, user_guidance.as_deref());

    Ok(())
}

fn generate_bootstrap_instruction(tool: &str) -> String {
    let tool_notes = match tool {
        "opencode" => {
            r#"## Tool-Specific Notes: OpenCode

OpenCode provides MCP (Model Context Protocol) tools for file operations and task delegation:

- **File Operations**: Use Read, Write, Edit, Glob, Grep tools for file manipulation
- **Shell Commands**: Use Bash tool for git, npm, docker, etc.
- **Task Delegation**: Use Task tool to launch specialized agents for complex subtasks
- **Parallel Invocation**: You can call multiple independent tools in a single response for optimal performance

When working with Spool changes, always prefer the dedicated tools over shell commands for file operations."#
        }
        "claude" => {
            r#"## Tool-Specific Notes: Claude Code

Claude Code provides a comprehensive toolkit for development workflows:

- **File Operations**: Use Read, Write, Edit tools for file manipulation
- **Search**: Use Glob (file patterns) and Grep (content search) instead of shell commands
- **Task Delegation**: Use Task tool to launch specialized agents for complex, multi-step work
- **Shell Commands**: Use Bash tool for git, npm, docker, and other CLI operations
- **Tool Routing**: Prefer specialized tools (Read/Write/Edit/Grep/Glob) over generic shell commands

When implementing Spool changes, use the Task tool for independent subtasks and the dedicated file tools for code modifications."#
        }
        "codex" => {
            r#"## Tool-Specific Notes: Codex

Codex is a shell-first environment with command execution as the primary interface:

- **Shell Commands**: All operations are performed via shell commands
- **File Operations**: Use standard Unix tools (cat, grep, find, sed, awk)
- **Git Operations**: Direct git commands for version control
- **Available Commands**: Standard Unix utilities, git, npm, make, and project-specific tools
- **Bootstrap**: This bootstrap snippet is always included in your system prompt

When working with Spool changes, use shell commands and standard Unix tools for all operations."#
        }
        _ => "",
    };

    format!(
        r#"# Spool Bootstrap Instructions

This is a minimal bootstrap preamble for {tool}. For complete workflow instructions, use the artifact-specific commands below.

{tool_notes}

## Retrieving Workflow Instructions

To get detailed instructions for working with a Spool change, use these commands:

### View Change Proposal
```bash
spool agent instruction proposal --change <change-id>
```
Shows the change proposal (why, what, impact).

### View Specifications
```bash
spool agent instruction specs --change <change-id>
```
Shows the specification deltas for the change.

### View Tasks
```bash
spool agent instruction tasks --change <change-id>
```
Shows the implementation task list.

### Apply Instructions
```bash
spool agent instruction apply --change <change-id>
```
Shows comprehensive instructions for implementing the change, including:
- Context files to read
- Task progress tracking
- Implementation guidance
- Completion criteria

### Review Instructions
```bash
spool agent instruction review --change <change-id>
```
Shows instructions for reviewing a completed change.

### Archive Instructions
```bash
spool agent instruction archive --change <change-id>
```
Shows instructions for archiving a completed change and updating main specs.

## Workflow Overview

1. **Proposal Phase**: Read proposal.md to understand the change
2. **Planning Phase**: Review specs/ deltas and tasks.md
3. **Implementation Phase**: Use `apply` instructions to execute tasks
4. **Review Phase**: Validate implementation against specs
5. **Archive Phase**: Integrate changes into main specs

All workflow content is centralized in the Spool CLI. Adapters should remain thin and delegate to these instruction artifacts.
"#,
        tool = tool
    )
}

fn print_artifact_instructions_text(
    instructions: &core_workflow::InstructionsResponse,
    user_guidance: Option<&str>,
) {
    let missing: Vec<String> = instructions
        .dependencies
        .iter()
        .filter(|d| !d.done)
        .map(|d| d.id.clone())
        .collect();

    println!(
        "<artifact id=\"{}\" change=\"{}\" schema=\"{}\">",
        instructions.artifact_id, instructions.change_name, instructions.schema_name
    );
    println!();

    if !missing.is_empty() {
        println!("<warning>");
        println!(
            "This artifact has unmet dependencies. Complete them first or proceed with caution."
        );
        println!("Missing: {}", missing.join(", "));
        println!("</warning>");
        println!();
    }

    println!("<task>");
    println!(
        "Create the {} artifact for change \"{}\".",
        instructions.artifact_id, instructions.change_name
    );
    println!("{}", instructions.description);
    println!("</task>");
    println!();

    if !instructions.dependencies.is_empty() {
        println!("<context>");
        println!("Read these files for context before creating this artifact:");
        println!();
        for dep in &instructions.dependencies {
            println!(
                "<dependency id=\"{}\" status=\"{}\">",
                dep.id,
                if dep.done { "done" } else { "missing" }
            );
            let p = std::path::Path::new(&instructions.change_dir).join(&dep.path);
            println!("  <path>{}</path>", p.to_string_lossy());
            println!("  <description>{}</description>", dep.description);
            println!("</dependency>");
        }
        println!("</context>");
        println!();
    }

    if let Some(user_guidance) = user_guidance {
        let t = user_guidance.trim();
        if !t.is_empty() {
            println!("<user_guidance>");
            println!("{t}");
            println!("</user_guidance>");
            println!();
        }
    }

    println!("<output>");
    let out_path = std::path::Path::new(&instructions.change_dir).join(&instructions.output_path);
    println!("Write to: {}", out_path.to_string_lossy());
    println!("</output>");
    println!();

    if let Some(instr) = &instructions.instruction {
        let t = instr.trim();
        if !t.is_empty() {
            println!("<instruction>");
            println!("{t}");
            println!("</instruction>");
            println!();
        }
    }

    println!("<template>");
    println!("{}", instructions.template.trim());
    println!("</template>");
    println!();

    println!("<success_criteria>");
    println!("<!-- To be defined in schema validation rules -->");
    println!("</success_criteria>");
    println!();

    if !instructions.unlocks.is_empty() {
        println!("<unlocks>");
        println!(
            "Completing this artifact enables: {}",
            instructions.unlocks.join(", ")
        );
        println!("</unlocks>");
        println!();
    }

    println!("</artifact>");
}

fn print_user_guidance_markdown(user_guidance: Option<&str>) {
    let Some(user_guidance) = user_guidance else {
        return;
    };
    let t = user_guidance.trim();
    if t.is_empty() {
        return;
    }

    println!("### User Guidance");
    println!();
    println!("{t}");
    println!();
}

fn print_apply_instructions_text(instructions: &core_workflow::ApplyInstructionsResponse) {
    println!("## Apply: {}", instructions.change_name);
    println!("Schema: {}", instructions.schema_name);
    println!();

    if instructions.state == "blocked"
        && let Some(missing) = &instructions.missing_artifacts
    {
        println!("### ⚠️ Blocked");
        println!();
        println!("Missing artifacts: {}", missing.join(", "));
        println!("Use the spool-continue-change skill to create these first.");
        println!();
    }

    let entries: Vec<(&String, &String)> = instructions.context_files.iter().collect();
    if !entries.is_empty() {
        println!("### Context Files");
        for (id, path) in entries {
            println!("- {id}: {path}");
        }
        println!();
    }

    if let (Some(tracks_file), Some(tracks_path)) =
        (&instructions.tracks_file, &instructions.tracks_path)
    {
        println!("### Task Tracking");
        println!("- file: {tracks_file}");
        if let Some(fmt) = &instructions.tracks_format {
            println!("- format: {fmt}");
        }
        println!("- path: {tracks_path}");
        if let Some(diags) = &instructions.tracks_diagnostics
            && !diags.is_empty()
        {
            let errors = diags.iter().filter(|d| d.level == "error").count();
            let warnings = diags.iter().filter(|d| d.level == "warning").count();
            if errors > 0 {
                println!("- errors: {errors}");
            }
            if warnings > 0 {
                println!("- warnings: {warnings}");
            }
        }
        println!();
    }

    if instructions.progress.total > 0 || !instructions.tasks.is_empty() {
        println!("### Progress");
        if instructions.state == "all_done" {
            println!(
                "{}/{} complete ✓",
                instructions.progress.complete, instructions.progress.total
            );
        } else {
            println!(
                "{}/{} complete",
                instructions.progress.complete, instructions.progress.total
            );
        }
        println!();
    }

    if !instructions.tasks.is_empty() {
        println!("### Tasks");
        for task in &instructions.tasks {
            let checkbox = if task.done { "[x]" } else { "[ ]" };
            println!("- {checkbox} {}", task.description);
        }
        println!();
    }

    println!("### Instruction");
    println!("{}", instructions.instruction);
}
