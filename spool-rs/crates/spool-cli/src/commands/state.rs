use crate::cli::{StateAction, StateArgs};
use crate::cli_error::{CliError, CliResult, to_cli_error};
use crate::runtime::Runtime;
use spool_domain::state as wf_state;

pub(crate) fn handle_state_clap(rt: &Runtime, args: &StateArgs) -> CliResult<()> {
    let Some(action) = &args.action else {
        return Err(CliError::msg("Missing required state subcommand"));
    };

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

    if matches!(action, StateAction::Show) {
        let contents = spool_core::io::read_to_string(&state_path)
            .map_err(|_| CliError::msg("Failed to read STATE.md"))?;
        print!("{contents}");
        return Ok(());
    }

    let text = match action {
        StateAction::Show => String::new(),
        StateAction::Decision { text }
        | StateAction::Blocker { text }
        | StateAction::Note { text }
        | StateAction::Focus { text }
        | StateAction::Question { text } => text.join(" "),
    };

    let contents = spool_core::io::read_to_string(&state_path)
        .map_err(|_| CliError::msg("Failed to read STATE.md"))?;
    let date = wf_state::now_date();

    let updated = match action {
        StateAction::Show => Ok(contents),
        StateAction::Decision { .. } => wf_state::add_decision(&contents, &date, &text),
        StateAction::Blocker { .. } => wf_state::add_blocker(&contents, &date, &text),
        StateAction::Question { .. } => wf_state::add_question(&contents, &date, &text),
        StateAction::Focus { .. } => wf_state::set_focus(&contents, &date, &text),
        StateAction::Note { .. } => {
            let time = wf_state::now_time();
            wf_state::add_note(&contents, &date, &time, &text)
        }
    };

    let updated = match updated {
        Ok(v) => v,
        Err(e) => return Err(CliError::msg(e)),
    };

    spool_core::io::write(&state_path, updated.as_bytes()).map_err(to_cli_error)?;

    match action {
        StateAction::Show => {}
        StateAction::Decision { .. } => eprintln!("✔ Decision recorded: {text}"),
        StateAction::Blocker { .. } => eprintln!("✔ Blocker recorded: {text}"),
        StateAction::Note { .. } => eprintln!("✔ Note recorded: {text}"),
        StateAction::Focus { .. } => eprintln!("✔ Focus updated: {text}"),
        StateAction::Question { .. } => eprintln!("✔ Question added: {text}"),
    }

    Ok(())
}
