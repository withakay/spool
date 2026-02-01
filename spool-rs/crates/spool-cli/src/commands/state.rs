use crate::cli_error::{CliError, CliResult, to_cli_error};
use crate::runtime::Runtime;
use spool_workflow::state as wf_state;

pub(crate) const STATE_HELP: &str = "Usage: spool state <command> [options]\n\nView and update planning/STATE.md\n\nCommands:\n  show                            Show current project state\n  decision <text>                 Record a decision\n  blocker <text>                  Record a blocker\n  note <text>                     Add a session note\n  focus <text>                    Set current focus\n  question <text>                 Add an open question\n\nOptions:\n  -h, --help                      display help for command";

pub(crate) fn handle_state(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{STATE_HELP}");
        return Ok(());
    }

    let sub = args.first().map(|s| s.as_str()).unwrap_or("");
    let text = args.iter().skip(1).cloned().collect::<Vec<_>>().join(" ");

    let spool_path = rt.spool_path();
    let spool_dir = spool_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| ".spool".to_string());
    let state_path = spool_path.join("planning").join("STATE.md");
    if !state_path.exists() {
        return Err(CliError::msg(format!(
            "STATE.md not found. Run \"spool init\" first or create {}/planning/STATE.md",
            spool_dir
        )));
    }

    if sub == "show" {
        let contents = spool_core::io::read_to_string(&state_path)
            .map_err(|_| CliError::msg("Failed to read STATE.md"))?;
        print!("{contents}");
        return Ok(());
    }

    if text.trim().is_empty() {
        return Err(CliError::msg("Missing required text"));
    }

    let contents = spool_core::io::read_to_string(&state_path)
        .map_err(|_| CliError::msg("Failed to read STATE.md"))?;
    let date = wf_state::now_date();

    let updated = match sub {
        "decision" => wf_state::add_decision(&contents, &date, &text),
        "blocker" => wf_state::add_blocker(&contents, &date, &text),
        "question" => wf_state::add_question(&contents, &date, &text),
        "focus" => wf_state::set_focus(&contents, &date, &text),
        "note" => {
            let time = wf_state::now_time();
            wf_state::add_note(&contents, &date, &time, &text)
        }
        _ => Err(format!("Unknown state subcommand '{sub}'")),
    };

    let updated = match updated {
        Ok(v) => v,
        Err(e) => return Err(CliError::msg(e)),
    };

    spool_core::io::write(&state_path, updated.as_bytes()).map_err(to_cli_error)?;

    match sub {
        "decision" => eprintln!("✔ Decision recorded: {text}"),
        "blocker" => eprintln!("✔ Blocker recorded: {text}"),
        "note" => eprintln!("✔ Note recorded: {text}"),
        "focus" => eprintln!("✔ Focus updated: {text}"),
        "question" => eprintln!("✔ Question added: {text}"),
        _ => {}
    }

    Ok(())
}
