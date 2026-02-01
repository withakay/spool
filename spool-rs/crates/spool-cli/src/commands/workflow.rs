use crate::cli_error::{CliError, CliResult, to_cli_error};
use crate::runtime::Runtime;
use spool_workflow::workflow as wf_workflow;

pub(crate) const WORKFLOW_HELP: &str = "Usage: spool workflow <command> [options]\n\nManage and run workflows\n\nCommands:\n  init                            Initialize workflow templates\n  list                            List available workflows\n  show <workflow-name>            Show workflow details\n\nOptions:\n  -h, --help                      display help for command";

pub(crate) fn handle_workflow(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{WORKFLOW_HELP}");
        return Ok(());
    }

    let sub = args.first().map(|s| s.as_str()).unwrap_or("");
    let wf_name = args.get(1).map(|s| s.as_str()).unwrap_or("");

    let spool_path = rt.spool_path();

    match sub {
        "init" => {
            wf_workflow::init_workflow_structure(spool_path).map_err(to_cli_error)?;
            println!("Created workflows directory with example workflows:");
            println!("  - research.yaml  (domain investigation)");
            println!("  - execute.yaml   (task execution)");
            println!("  - review.yaml    (adversarial review)");
            println!();
            println!("Prompt templates are installed via `spool init`.");
            Ok(())
        }
        "list" => {
            let workflows = wf_workflow::list_workflows(spool_path);
            if workflows.is_empty() {
                println!("No workflows found. Run `spool workflow init` to create examples.");
                return Ok(());
            }
            println!("Available workflows:");
            println!();
            for name in workflows {
                match wf_workflow::load_workflow(spool_path, &name) {
                    Ok(wf) => {
                        println!("  {name}");
                        println!("    {}", wf.description);
                        println!(
                            "    Waves: {}, Tasks: {}",
                            wf.waves.len(),
                            wf_workflow::count_tasks(&wf)
                        );
                        println!();
                    }
                    Err(e) => {
                        println!("  {name} (invalid: {e})");
                    }
                }
            }
            Ok(())
        }
        "show" => {
            if wf_name.is_empty() || wf_name.starts_with('-') {
                return Err(CliError::msg("Missing required argument <workflow-name>"));
            }
            let wf = wf_workflow::load_workflow(spool_path, wf_name)
                .map_err(|e| CliError::msg(format!("Invalid workflow: {e}")))?;

            fn agent_label(a: &spool_schemas::AgentType) -> &'static str {
                match a {
                    spool_schemas::AgentType::Research => "research",
                    spool_schemas::AgentType::Execution => "execution",
                    spool_schemas::AgentType::Review => "review",
                    spool_schemas::AgentType::Planning => "planning",
                }
            }

            println!("# Workflow: {}", wf.name);
            println!("ID: {}", wf.id);
            println!("Description: {}", wf.description);
            println!();
            if let Some(req) = &wf.requires {
                println!("## Requirements");
                if let Some(files) = &req.files {
                    println!("Files: {}", files.join(", "));
                }
                if let Some(vars) = &req.variables {
                    println!("Variables: {}", vars.join(", "));
                }
                println!();
            }
            println!("## Waves");
            println!();
            for (idx, wave) in wf.waves.iter().enumerate() {
                let cp = if wave.checkpoint.unwrap_or(false) {
                    " (checkpoint)"
                } else {
                    ""
                };
                println!("### Wave {}: {}{cp}", idx + 1, wave.id);
                println!();
                for task in &wave.tasks {
                    println!("  - [{}] {}", agent_label(&task.agent), task.name);
                    println!("    Prompt: {}", task.prompt);
                    if let Some(out) = &task.output {
                        println!("    Output: {out}");
                    }
                }
                println!();
            }
            Ok(())
        }
        _ => Err(CliError::msg(format!(
            "Unknown workflow subcommand '{sub}'"
        ))),
    }
}
