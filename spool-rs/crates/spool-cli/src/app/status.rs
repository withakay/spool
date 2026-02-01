use crate::cli_error::{CliResult, fail, to_cli_error};
use crate::runtime::Runtime;
use crate::util::parse_string_flag;
use spool_core::workflow as core_workflow;

pub(crate) fn handle_status(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{}", super::STATUS_HELP);
        return Ok(());
    }

    let want_json = args.iter().any(|a| a == "--json");
    let change = parse_string_flag(args, "--change");
    if change.as_deref().unwrap_or("").is_empty() {
        let changes = core_workflow::list_available_changes(rt.spool_path());
        let mut msg = "Missing required option --change".to_string();
        if !changes.is_empty() {
            msg.push_str("\n\nAvailable changes:\n");
            for c in changes {
                msg.push_str(&format!("  {c}\n"));
            }
        }
        return fail(msg);
    }

    let schema = parse_string_flag(args, "--schema");
    let ctx = rt.ctx();
    let spool_path = rt.spool_path();

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Loading change status...");

    let change = change.expect("checked above");
    let status =
        match core_workflow::compute_change_status(spool_path, &change, schema.as_deref(), ctx) {
            Ok(s) => s,
            Err(core_workflow::WorkflowError::InvalidChangeName) => {
                return fail("Invalid change name");
            }
            Err(core_workflow::WorkflowError::ChangeNotFound(name)) => {
                let changes = core_workflow::list_available_changes(spool_path);
                let mut msg = format!("Change '{name}' not found");
                if !changes.is_empty() {
                    msg.push_str("\n\nAvailable changes:\n");
                    for c in changes {
                        msg.push_str(&format!("  {c}\n"));
                    }
                }
                return fail(msg);
            }
            Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
                return fail(super::common::schema_not_found_message(ctx, &name));
            }
            Err(e) => {
                return Err(to_cli_error(e));
            }
        };

    if want_json {
        let rendered = serde_json::to_string_pretty(&status).expect("json should serialize");
        println!("{rendered}");
        return Ok(());
    }

    let total = status.artifacts.len();
    let done = status
        .artifacts
        .iter()
        .filter(|a| a.status == "done")
        .count();

    println!("Change: {}", status.change_name);
    println!("Schema: {}", status.schema_name);
    println!("Progress: {done}/{total} artifacts complete\n");
    for a in &status.artifacts {
        let mark = if a.status == "done" {
            "[x]"
        } else if a.status == "blocked" {
            "[-]"
        } else {
            "[ ]"
        };

        if a.status == "blocked" && !a.missing_deps.is_empty() {
            println!(
                "{mark} {} (blocked by: {})",
                a.id,
                a.missing_deps.join(", ")
            );
        } else {
            println!("{mark} {}", a.id);
        }
    }
    if status.is_complete {
        println!("\nAll artifacts complete!");
    }

    Ok(())
}
