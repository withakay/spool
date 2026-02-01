use crate::cli_error::CliResult;
use crate::runtime::Runtime;
use crate::{commands, util};

pub(super) fn run(args: &[String]) -> CliResult<()> {
    // Match Commander: `spool --help` shows top-level help, but `spool <cmd> --help`
    // shows subcommand help.
    let first = args.first().map(|s| s.as_str());

    // Handle --help-all global flag
    if args.iter().any(|a| a == "--help-all") {
        let filtered: Vec<String> = args
            .iter()
            .filter(|a| a.as_str() != "--help-all")
            .cloned()
            .collect();
        return commands::handle_help_all(&filtered);
    }

    // Handle help command with possible --all flag
    if first == Some("help") {
        return commands::handle_help(&args[1..]);
    }

    let looks_like_global_help = args.is_empty() || matches!(first, Some("--help") | Some("-h"));
    if looks_like_global_help {
        println!("{}", super::help::HELP);
        println!();
        println!("Run 'spool help --all' for the complete CLI reference.");
        return Ok(());
    }

    if args.len() == 1 && (args[0] == "--version" || args[0] == "-V") {
        // Match Commander.js default: prints version only.
        println!("{}", env!("CARGO_PKG_VERSION"));
        return Ok(());
    }

    let rt = Runtime::new();

    let command_id = util::command_id_from_args(args);
    let project_root = util::project_root_for_logging(&rt, args);
    let spool_path_for_logging = util::spool_path_for_logging(&project_root, &rt);

    match args.first().map(|s| s.as_str()) {
        Some("create") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_create(&rt, &args[1..]),
            );
        }
        Some("new") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_new(&rt, &args[1..]),
            );
        }
        Some("init") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::init::handle_init(&rt, &args[1..]),
            );
        }
        Some("update") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::update::handle_update(&rt, &args[1..]),
            );
        }
        Some("list") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::list::handle_list(&rt, &args[1..]),
            );
        }
        Some("plan") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_plan(&rt, &args[1..]),
            );
        }
        Some("state") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_state(&rt, &args[1..]),
            );
        }
        Some("tasks") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_tasks(&rt, &args[1..]),
            );
        }
        Some("workflow") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_workflow(&rt, &args[1..]),
            );
        }
        Some("status") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::status::handle_status(&rt, &args[1..]),
            );
        }
        Some("stats") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_stats(&rt, &args[1..]),
            );
        }
        Some("config") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_config(&rt, &args[1..]),
            );
        }
        Some("agent-config") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || commands::handle_agent_config(&rt, &args[1..]),
            );
        }
        Some("templates") | Some("x-templates") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::templates::handle_templates(&rt, &args[1..]),
            );
        }
        Some("instructions") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::instructions::handle_instructions(&rt, &args[1..]),
            );
        }
        Some("agent") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::instructions::handle_agent(&rt, &args[1..]),
            );
        }
        Some("x-instructions") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::instructions::handle_x_instructions(&rt, &args[1..]),
            );
        }
        Some("show") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::show::handle_show(&rt, &args[1..]),
            );
        }
        Some("validate") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::validate::handle_validate(&rt, &args[1..]),
            );
        }
        Some("ralph") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::ralph::handle_ralph(&rt, &args[1..]),
            );
        }
        Some("loop") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::ralph::handle_loop(&rt, &args[1..]),
            );
        }
        Some("archive") => {
            return util::with_logging(
                &rt,
                &command_id,
                &project_root,
                &spool_path_for_logging,
                || super::archive::handle_archive(&rt, &args[1..]),
            );
        }
        _ => {}
    }

    util::with_logging(
        &rt,
        &command_id,
        &project_root,
        &spool_path_for_logging,
        || {
            // Temporary fallback for unimplemented commands.
            println!("{}", super::help::HELP);
            Ok(())
        },
    )
}
