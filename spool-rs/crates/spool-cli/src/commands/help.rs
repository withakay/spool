use crate::cli_error::CliResult;

pub(crate) const HELP: &str = "Usage: spool [options] [command]\n\nAI-native system for spec-driven development\n\nOptions:\n  -V, --version                    output the version number\n  --no-color                       Disable color output\n  -h, --help                       display help for command\n\nCommands:\n  init [--tools <...>] [path]      Initialize Spool in your project\n  update [options] [path]          Update Spool instruction files\n  tasks                            Track execution tasks for a change\n  plan                             Project planning tools\n  state                            View and update planning/STATE.md\n  workflow                         Manage and run workflows\n  list [--json|--specs|--modules]  List items (changes by default). Use --specs\n                                   or --modules to list other items.\n  dashboard                        Display an interactive dashboard of specs and\n                                   changes\n  archive [--json] [change-name]   Archive a completed change and update main\n                                   specs\n  config [options]                 View and modify global Spool configuration\n  create                           Create items\n  validate [--json|--all] [item]   Validate changes, specs, and modules\n  show [options] [item-name]       Show a change or spec\n  completions                      Manage shell completions for Spool CLI\n  status [options]                 [Experimental] Display artifact completion\n                                   status for a change\n  x-templates [options]            [Experimental] Show resolved template paths\n                                   for all artifacts in a schema\n  x-schemas [options]              [Experimental] List available workflow\n                                   schemas with descriptions\n  agent                            Commands that generate machine-readable\n                                   output for AI agents\n  ralph [options] [prompt]         Run the Ralph Wiggum iterative development\n                                   loop\n";

pub(crate) const HELP_ALL_HELP: &str = "Usage: spool help [command] [options]\n\nDisplay help information\n\nOptions:\n  --all           Show help for all commands\n  --json          Output as JSON (with --all)\n  -h, --help      display help for command";

/// Command help entry for the help dump system
pub(crate) struct CommandHelpEntry {
    pub(crate) path: &'static str,
    pub(crate) help: &'static str,
}

/// All command help entries for `spool help --all`
pub(crate) const ALL_HELP: &[CommandHelpEntry] = &[
    CommandHelpEntry {
        path: "spool",
        help: HELP,
    },
    CommandHelpEntry {
        path: "spool init",
        help: crate::INIT_HELP,
    },
    CommandHelpEntry {
        path: "spool update",
        help: crate::UPDATE_HELP,
    },
    CommandHelpEntry {
        path: "spool tasks",
        help: super::tasks::TASKS_HELP,
    },
    CommandHelpEntry {
        path: "spool plan",
        help: super::plan::PLAN_HELP,
    },
    CommandHelpEntry {
        path: "spool state",
        help: super::state::STATE_HELP,
    },
    CommandHelpEntry {
        path: "spool workflow",
        help: super::workflow::WORKFLOW_HELP,
    },
    CommandHelpEntry {
        path: "spool list",
        help: crate::LIST_HELP,
    },
    CommandHelpEntry {
        path: "spool archive",
        help: crate::ARCHIVE_HELP,
    },
    CommandHelpEntry {
        path: "spool config",
        help: crate::CONFIG_HELP,
    },
    CommandHelpEntry {
        path: "spool create",
        help: super::CREATE_HELP,
    },
    CommandHelpEntry {
        path: "spool validate",
        help: crate::VALIDATE_HELP,
    },
    CommandHelpEntry {
        path: "spool show",
        help: crate::SHOW_HELP,
    },
    CommandHelpEntry {
        path: "spool status",
        help: crate::STATUS_HELP,
    },
    CommandHelpEntry {
        path: "spool agent",
        help: crate::AGENT_HELP,
    },
    CommandHelpEntry {
        path: "spool agent instruction",
        help: crate::AGENT_INSTRUCTION_HELP,
    },
    CommandHelpEntry {
        path: "spool ralph",
        help: crate::RALPH_HELP,
    },
    CommandHelpEntry {
        path: "spool agent-config",
        help: crate::AGENT_CONFIG_HELP,
    },
    CommandHelpEntry {
        path: "spool x-templates",
        help: crate::TEMPLATES_HELP,
    },
    CommandHelpEntry {
        path: "spool stats",
        help: crate::STATS_HELP,
    },
];

pub(crate) fn handle_help(args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{HELP_ALL_HELP}");
        return Ok(());
    }

    if args.iter().any(|a| a == "--all") {
        return handle_help_all(args);
    }

    // Show global help by default
    println!("{HELP}");
    Ok(())
}

pub(crate) fn handle_help_all(args: &[String]) -> CliResult<()> {
    let json_output = args.iter().any(|a| a == "--json");

    if json_output {
        let commands: Vec<serde_json::Value> = ALL_HELP
            .iter()
            .map(|entry| {
                serde_json::json!({
                    "path": entry.path,
                    "help": entry.help,
                })
            })
            .collect();

        let output = serde_json::json!({
            "version": "1.0",
            "commands": commands,
        });
        println!(
            "{}",
            serde_json::to_string_pretty(&output).unwrap_or_default()
        );
        return Ok(());
    }

    println!("================================================================================");
    println!("SPOOL CLI REFERENCE");
    println!("================================================================================\n");

    for (i, entry) in ALL_HELP.iter().enumerate() {
        if i > 0 {
            println!(
                "\n--------------------------------------------------------------------------------\n"
            );
        }
        println!("{}", entry.path);
        println!("{}", "-".repeat(entry.path.len()));
        println!("{}", entry.help);
    }

    println!("\n================================================================================");
    println!("Run 'spool <command> -h' for detailed command help.");
    println!("================================================================================");

    Ok(())
}
