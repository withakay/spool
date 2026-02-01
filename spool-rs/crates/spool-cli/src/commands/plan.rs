use crate::cli_error::{CliError, CliResult, to_cli_error};
use crate::runtime::Runtime;
use spool_workflow::planning as wf_planning;

pub(crate) const PLAN_HELP: &str = "Usage: spool plan <command> [options]\n\nProject planning tools\n\nCommands:\n  init                           Initialize planning structure\n  status                         Show current milestone progress\n\nOptions:\n  -h, --help                     display help for command";

pub(crate) fn handle_plan(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{PLAN_HELP}");
        return Ok(());
    }

    let sub = args.first().map(|s| s.as_str()).unwrap_or("");

    let spool_path = rt.spool_path();
    let spool_dir = spool_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| ".spool".to_string());
    let current_date = chrono::Local::now().format("%Y-%m-%d").to_string();

    match sub {
        "init" => {
            wf_planning::init_planning_structure(spool_path, &current_date, &spool_dir)
                .map_err(to_cli_error)?;
            eprintln!("✔ Planning structure initialized");
            println!("Created:");
            println!("  - {}/planning/PROJECT.md", spool_dir);
            println!("  - {}/planning/ROADMAP.md", spool_dir);
            println!("  - {}/planning/STATE.md", spool_dir);
            Ok(())
        }
        "status" => {
            let roadmap_path = wf_planning::planning_dir(spool_path).join("ROADMAP.md");
            let contents = spool_core::io::read_to_string(&roadmap_path).map_err(|_| {
                CliError::msg(
                    "ROADMAP.md not found. Run \"spool init\" or \"spool plan init\" first.",
                )
            })?;

            let Some((milestone, status, phase)) = wf_planning::read_current_progress(&contents)
            else {
                return Err(CliError::msg(
                    "Could not find current milestone section in ROADMAP.md",
                ));
            };
            let phases = wf_planning::read_phase_rows(&contents);

            println!("Current Progress");
            println!("────────────────────────────────────────");
            println!("Milestone: {milestone}");
            println!("Status: {status}");
            println!("Phase: {phase}");
            println!();
            println!("Phases");
            println!("────────────────────────────────────────");
            for (num, name, st, _changes) in phases {
                let icon = if st.eq_ignore_ascii_case("Complete") {
                    "✓"
                } else if st.eq_ignore_ascii_case("In Progress") {
                    "●"
                } else {
                    "○"
                };
                println!("  {icon} Phase {num}: {name} [{st}]");
            }
            Ok(())
        }
        _ => Err(CliError::msg(format!("Unknown plan subcommand '{sub}'"))),
    }
}
