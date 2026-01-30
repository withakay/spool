use chrono::{DateTime, Utc};
mod cli_error;
mod diagnostics;

use crate::cli_error::{CliError, CliResult, fail, silent_fail, to_cli_error};
use spool_core::config::ConfigContext;
use spool_core::installers::{InitOptions, InstallMode, install_default_templates};
use spool_core::paths as core_paths;
use spool_core::ralph as core_ralph;
use spool_core::repo_index::RepoIndex;
use spool_core::spool_dir::get_spool_path;
use spool_core::{
    create as core_create, r#match::nearest_matches, show as core_show, validate as core_validate,
    workflow as core_workflow,
};
use spool_harness::Harness;
use spool_harness::OpencodeHarness;
use spool_harness::stub::StubHarness;
use spool_workflow::planning as wf_planning;
use spool_workflow::state as wf_state;
use spool_workflow::tasks as wf_tasks;
use spool_workflow::workflow as wf_workflow;
use std::collections::BTreeSet;
use std::path::Path;
use std::path::PathBuf;
use std::sync::OnceLock;

const HELP: &str = "Usage: spool [options] [command]\n\nAI-native system for spec-driven development\n\nOptions:\n  -V, --version                    output the version number\n  --no-color                       Disable color output\n  -h, --help                       display help for command\n\nCommands:\n  init [options] [path]            Initialize Spool in your project\n  update [options] [path]          Update Spool instruction files\n  tasks                            Track execution tasks for a change\n  plan                             Project planning tools\n  state                            View and update planning/STATE.md\n  workflow                         Manage and run workflows\n  list [options]                   List items (changes by default). Use --specs\n                                   or --modules to list other items.\n  dashboard                        Display an interactive dashboard of specs and\n                                   changes\n  archive [options] [change-name]  Archive a completed change and update main\n                                   specs\n  config [options]                 View and modify global Spool configuration\n  create                           Create items\n  validate [options] [item-name]   Validate changes, specs, and modules\n  show [options] [item-name]       Show a change or spec\n  completions                      Manage shell completions for Spool CLI\n  status [options]                 [Experimental] Display artifact completion\n                                   status for a change\n  x-templates [options]            [Experimental] Show resolved template paths\n                                   for all artifacts in a schema\n  x-schemas [options]              [Experimental] List available workflow\n                                   schemas with descriptions\n  agent                            Commands that generate machine-readable\n                                   output for AI agents\n  ralph [options] [prompt]         Run iterative AI loop against a change\n                                   proposal\n  split [change-id]                Split a large change into smaller changes\n  help [command]                   display help for command";

struct Runtime {
    ctx: ConfigContext,
    cwd: PathBuf,
    spool_path: OnceLock<PathBuf>,
    repo_index: OnceLock<RepoIndex>,
}

impl Runtime {
    fn new() -> Self {
        Self {
            ctx: ConfigContext::from_process_env(),
            cwd: PathBuf::from("."),
            spool_path: OnceLock::new(),
            repo_index: OnceLock::new(),
        }
    }

    fn ctx(&self) -> &ConfigContext {
        &self.ctx
    }

    fn spool_path(&self) -> &Path {
        self.spool_path
            .get_or_init(|| get_spool_path(&self.cwd, &self.ctx))
            .as_path()
    }

    fn repo_index(&self) -> &RepoIndex {
        self.repo_index
            .get_or_init(|| RepoIndex::load(self.spool_path()).unwrap_or_default())
    }
}

fn main() {
    // Ensure tracing can be enabled for debugging without changing user output.
    let _ = tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .with_writer(std::io::stderr)
        .try_init();

    let args: Vec<String> = std::env::args().skip(1).collect();

    // Match TS behavior: `--no-color` sets NO_COLOR=1 globally before command execution.
    if args.iter().any(|a| a == "--no-color") {
        // Rust 1.93+ marks `set_var` unsafe due to potential UB when racing with
        // other threads reading the environment. We do this before any command
        // execution or thread spawning.
        unsafe {
            std::env::set_var("NO_COLOR", "1");
        }
    }

    if let Err(e) = run(&args) {
        if !e.is_silent() {
            eprintln!();
            eprintln!("✖ Error: {e}");
        }
        std::process::exit(1);
    }
}

fn run(args: &[String]) -> CliResult<()> {
    // Match Commander: `spool --help` shows top-level help, but `spool <cmd> --help`
    // shows subcommand help.
    let first = args.first().map(|s| s.as_str());
    let looks_like_global_help =
        args.is_empty() || matches!(first, Some("--help") | Some("-h") | Some("help"));
    if looks_like_global_help {
        println!("{HELP}");
        return Ok(());
    }

    if args.len() == 1 && (args[0] == "--version" || args[0] == "-V") {
        // Match Commander.js default: prints version only.
        println!("{}", env!("CARGO_PKG_VERSION"));
        return Ok(());
    }

    let rt = Runtime::new();

    match args.first().map(|s| s.as_str()) {
        Some("create") => {
            handle_create(&rt, &args[1..])?;
            return Ok(());
        }
        Some("new") => {
            handle_new(&rt, &args[1..])?;
            return Ok(());
        }
        Some("init") => {
            handle_init(&rt, &args[1..])?;
            return Ok(());
        }
        Some("update") => {
            handle_update(&rt, &args[1..])?;
            return Ok(());
        }
        Some("list") => {
            handle_list(&rt, &args[1..])?;
            return Ok(());
        }
        Some("plan") => {
            handle_plan(&rt, &args[1..])?;
            return Ok(());
        }
        Some("state") => {
            handle_state(&rt, &args[1..])?;
            return Ok(());
        }
        Some("tasks") => {
            handle_tasks(&rt, &args[1..])?;
            return Ok(());
        }
        Some("workflow") => {
            handle_workflow(&rt, &args[1..])?;
            return Ok(());
        }
        Some("status") => {
            handle_status(&rt, &args[1..])?;
            return Ok(());
        }
        Some("templates") | Some("x-templates") => {
            handle_templates(&rt, &args[1..])?;
            return Ok(());
        }
        Some("instructions") => {
            handle_instructions(&rt, &args[1..])?;
            return Ok(());
        }
        Some("agent") => {
            handle_agent(&rt, &args[1..])?;
            return Ok(());
        }
        Some("x-instructions") => {
            handle_x_instructions(&rt, &args[1..])?;
            return Ok(());
        }
        Some("show") => {
            handle_show(&rt, &args[1..])?;
            return Ok(());
        }
        Some("validate") => {
            handle_validate(&rt, &args[1..])?;
            return Ok(());
        }
        Some("ralph") => {
            handle_ralph(&rt, &args[1..])?;
            return Ok(());
        }
        Some("loop") => {
            handle_loop(&rt, &args[1..])?;
            return Ok(());
        }
        _ => {}
    }

    // Temporary fallback for unimplemented commands.
    println!("{HELP}");
    Ok(())
}

const LIST_HELP: &str = "Usage: spool list [options]\n\nList items (changes by default). Use --specs or --modules to list other items.\n\nOptions:\n  --specs         List specs instead of changes\n  --changes       List changes explicitly (default)\n  --modules       List modules instead of changes\n  --sort <order>  Sort order: \"recent\" (default) or \"name\" (default: \"recent\")\n  --json          Output as JSON (for programmatic use)\n  -h, --help      display help for command";

const INIT_HELP: &str = "Usage: spool init [options] [path]\n\nInitialize Spool in your project\n\nNotes:\n  When run interactively and --tools is not provided, spool will prompt for tool selection.\n  In non-interactive contexts, you must provide --tools.\n\nOptions:\n  --tools <tools>    Configure AI tools non-interactively (all, none, or comma-separated ids)\n  -f, --force        Overwrite existing tool files without prompting\n  -h, --help         display help for command";

const UPDATE_HELP: &str = "Usage: spool update [options] [path]\n\nUpdate Spool instruction files\n\nOptions:\n  --json          Output as JSON\n  -h, --help      display help for command";

const TASKS_HELP: &str = "Usage: spool tasks <command> [options]\n\nTrack execution tasks for a change\n\nCommands:\n  init <change-id>                         Create enhanced tasks.md\n  status <change-id>                       Show task progress\n  next <change-id>                         Show the next available task\n  start <change-id> <task-id>              Mark a task in-progress\n  complete <change-id> <task-id>           Mark a task complete\n  shelve <change-id> <task-id>             Shelve a task (reversible)\n  unshelve <change-id> <task-id>           Restore a shelved task to pending\n  add <change-id> <task-name> [--wave <n>]  Add a new task (enhanced only)\n  show <change-id>                         Print tasks.md\n\nOptions:\n  --wave <n>                               Wave number for add (default: 1)\n  -h, --help                               display help for command";

const PLAN_HELP: &str = "Usage: spool plan <command> [options]\n\nProject planning tools\n\nCommands:\n  init                           Initialize planning structure\n  status                         Show current milestone progress\n\nOptions:\n  -h, --help                     display help for command";

const STATE_HELP: &str = "Usage: spool state <command> [options]\n\nView and update planning/STATE.md\n\nCommands:\n  show                            Show current project state\n  decision <text>                 Record a decision\n  blocker <text>                  Record a blocker\n  note <text>                     Add a session note\n  focus <text>                    Set current focus\n  question <text>                 Add an open question\n\nOptions:\n  -h, --help                      display help for command";

const WORKFLOW_HELP: &str = "Usage: spool workflow <command> [options]\n\nManage and run workflows\n\nCommands:\n  init                            Initialize workflow templates\n  list                            List available workflows\n  show <workflow-name>            Show workflow details\n\nOptions:\n  -h, --help                      display help for command";

const RALPH_HELP: &str = "Usage: spool ralph [options] [prompt]\n\nRun the Ralph Wiggum iterative development loop\n\nOptions:\n  --change <id>               Target a specific change\n  --module <id>               Target a module (selects a change)\n  --harness <name>            Harness to run (default: opencode)\n  --model <model>             Model id for the harness\n  --min-iterations <n>         Minimum iterations before stopping (default: 1)\n  --max-iterations <n>         Maximum iterations (default: unlimited)\n  --completion-promise <name>  Completion promise token (default: COMPLETE)\n  --allow-all                  Allow all tool actions (dangerous)\n  --yolo                       Alias for --allow-all\n  --dangerously-allow-all      Alias for --allow-all\n  --no-commit                  Do not create git commits per iteration\n  --status                     Show current Ralph state for the change\n  --add-context <text>         Append extra context to the Ralph loop\n  --clear-context              Clear the Ralph loop context file\n  --no-interactive             Do not prompt for selections\n  -h, --help                   display help for command";

const LOOP_HELP: &str =
    "Usage: spool loop [options] [prompt]\n\nDeprecated alias for 'spool ralph'";

fn handle_state(rt: &Runtime, args: &[String]) -> CliResult<()> {
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

fn handle_workflow(rt: &Runtime, args: &[String]) -> CliResult<()> {
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

fn handle_plan(rt: &Runtime, args: &[String]) -> CliResult<()> {
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

fn handle_tasks(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{TASKS_HELP}");
        return Ok(());
    }

    fn parse_wave_flag(args: &[String]) -> u32 {
        args.iter()
            .enumerate()
            .find(|(_, a)| *a == "--wave")
            .and_then(|(i, _)| args.get(i + 1))
            .and_then(|v| v.parse::<u32>().ok())
            .unwrap_or(1)
    }

    fn format_blockers(blockers: &[String]) -> String {
        if blockers.is_empty() {
            return "Task is blocked".to_string();
        }
        let mut out = String::from("Task is blocked:");
        for b in blockers {
            out.push_str("\n- ");
            out.push_str(b);
        }
        out
    }

    let sub = args.first().map(|s| s.as_str()).unwrap_or("");
    let change_id = args.get(1).map(|s| s.as_str()).unwrap_or("");
    if change_id.is_empty() || change_id.starts_with('-') {
        return fail("Missing required argument <change-id>");
    }

    let spool_path = rt.spool_path();
    let change_dir = core_paths::change_dir(spool_path, change_id);

    match sub {
        "init" => {
            if !change_dir.exists() {
                return fail(format!("Change '{change_id}' not found"));
            }
            let path = wf_tasks::tasks_path(spool_path, change_id);
            if path.exists() {
                return fail(format!(
                    "tasks.md already exists for \"{change_id}\". Use \"tasks add\" to add tasks."
                ));
            }

            let now = chrono::Local::now();
            let contents = wf_tasks::enhanced_tasks_template(change_id, now);
            if let Some(parent) = path.parent() {
                spool_core::io::create_dir_all(parent).map_err(to_cli_error)?;
            }
            spool_core::io::write(&path, contents.as_bytes()).map_err(to_cli_error)?;
            eprintln!("✔ Enhanced tasks.md created for \"{change_id}\"");
            Ok(())
        }
        "status" => {
            let path = wf_tasks::tasks_path(spool_path, change_id);
            if !path.exists() {
                println!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                );
                return Ok(());
            }

            let contents = spool_core::io::read_to_string(&path)
                .map_err(|_| CliError::msg(format!("Failed to read {}", path.display())))?;

            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);

            if let Some(msg) = diagnostics::blocking_task_error_message(&path, &parsed.diagnostics)
            {
                return Err(CliError::msg(msg));
            }

            println!("Tasks for: {change_id}");
            println!("──────────────────────────────────────────────────");
            println!();

            let warnings = diagnostics::render_task_diagnostics(
                &path,
                &parsed.diagnostics,
                wf_tasks::DiagnosticLevel::Warning,
            );
            if !warnings.is_empty() {
                println!("Warnings");
                print!("{warnings}");
                println!();
            }

            match parsed.format {
                wf_tasks::TasksFormat::Enhanced => {
                    let done = parsed.progress.complete + parsed.progress.shelved;
                    println!(
                        "Progress: {}/{} done ({} complete, {} shelved), {} in-progress, {} pending",
                        done,
                        parsed.progress.total,
                        parsed.progress.complete,
                        parsed.progress.shelved,
                        parsed.progress.in_progress,
                        parsed.progress.pending
                    );
                }
                wf_tasks::TasksFormat::Checkbox => {
                    println!(
                        "Progress (compat): {}/{} complete",
                        parsed.progress.complete, parsed.progress.total
                    );
                }
            }

            let (ready, blocked) = wf_tasks::compute_ready_and_blocked(&parsed);
            println!();
            println!("Ready");
            for t in &ready {
                println!("  - {}: {}", t.id, t.name);
            }
            println!();
            println!("Blocked");
            for (t, blockers) in &blocked {
                println!("  - {}: {}", t.id, t.name);
                for b in blockers {
                    println!("    - {b}");
                }
            }

            Ok(())
        }
        "next" => {
            let path = wf_tasks::tasks_path(spool_path, change_id);
            let contents = spool_core::io::read_to_string(&path).map_err(|_| {
                CliError::msg(format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ))
            })?;
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);

            if let Some(msg) = diagnostics::blocking_task_error_message(&path, &parsed.diagnostics)
            {
                return Err(CliError::msg(msg));
            }

            match parsed.format {
                wf_tasks::TasksFormat::Checkbox => {
                    let next = parsed
                        .tasks
                        .iter()
                        .find(|t| t.status == wf_tasks::TaskStatus::Pending);
                    if let Some(t) = next {
                        println!("Next Task (compat)");
                        println!("──────────────────────────────────────────────────");
                        println!("Task {}: {}", t.id, t.name);
                        println!(
                            "Run \"spool tasks complete {change_id} {}\" when done",
                            t.id
                        );
                    } else {
                        println!("All tasks complete!");
                    }
                    Ok(())
                }
                wf_tasks::TasksFormat::Enhanced => {
                    if parsed.progress.remaining == 0 {
                        println!("All tasks complete!");
                        return Ok(());
                    }

                    let (ready, blocked) = wf_tasks::compute_ready_and_blocked(&parsed);
                    if ready.is_empty() {
                        println!("No ready tasks.");
                        if let Some((t, blockers)) = blocked.first() {
                            println!("First blocked task: {} - {}", t.id, t.name);
                            println!("{}", format_blockers(blockers));
                        }
                        return Ok(());
                    }

                    let t = &ready[0];
                    println!("Next Task");
                    println!("──────────────────────────────────────────────────");
                    println!("Task {}: {}", t.id, t.name);
                    println!();
                    if !t.files.is_empty() {
                        println!("Files: {}", t.files.join(", "));
                    }
                    if !t.action.trim().is_empty() {
                        println!("Action:");
                        for line in t.action.lines() {
                            println!("  {line}");
                        }
                    }
                    if let Some(v) = &t.verify {
                        println!("Verify: {v}");
                    }
                    if let Some(v) = &t.done_when {
                        println!("Done When: {v}");
                    }
                    println!();
                    println!("Run \"spool tasks start {change_id} {}\" to begin", t.id);
                    Ok(())
                }
            }
        }
        "start" => {
            let task_id = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if task_id.is_empty() || task_id.starts_with('-') {
                return fail("Missing required argument <task-id>");
            }
            let path = wf_tasks::tasks_path(spool_path, change_id);
            let contents = spool_core::io::read_to_string(&path).map_err(|_| {
                CliError::msg(format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ))
            })?;
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);
            if parsed.format == wf_tasks::TasksFormat::Checkbox {
                return fail(
                    "Checkbox-only tasks.md does not support in-progress. Use \"spool tasks complete\" when done.",
                );
            }

            if let Some(msg) = diagnostics::blocking_task_error_message(&path, &parsed.diagnostics)
            {
                return Err(CliError::msg(msg));
            }

            let Some(task) = parsed.tasks.iter().find(|t| t.id == task_id) else {
                return fail(format!("Task \"{task_id}\" not found in tasks.md"));
            };
            let status_label = match task.status {
                wf_tasks::TaskStatus::Pending => "pending",
                wf_tasks::TaskStatus::InProgress => "in_progress",
                wf_tasks::TaskStatus::Complete => "complete",
                wf_tasks::TaskStatus::Shelved => "shelved",
            };
            if task.status == wf_tasks::TaskStatus::Shelved {
                return fail(format!(
                    "Task \"{task_id}\" is shelved (run \"spool tasks unshelve {change_id} {task_id}\" first)"
                ));
            }
            if task.status != wf_tasks::TaskStatus::Pending {
                return fail(format!(
                    "Task \"{task_id}\" is not pending (current: {status_label})"
                ));
            }

            let (ready, blocked) = wf_tasks::compute_ready_and_blocked(&parsed);
            if !ready.iter().any(|t| t.id == task_id) {
                if let Some((_, blockers)) = blocked.iter().find(|(t, _)| t.id == task_id) {
                    return fail(format_blockers(blockers));
                }
                return fail("Task is blocked");
            }

            let updated = wf_tasks::update_enhanced_task_status(
                &contents,
                task_id,
                wf_tasks::TaskStatus::InProgress,
                chrono::Local::now(),
            );
            spool_core::io::write(&path, updated.as_bytes()).map_err(to_cli_error)?;
            eprintln!("✔ Task \"{task_id}\" marked as in-progress");
            Ok(())
        }
        "complete" => {
            let task_id = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if task_id.is_empty() || task_id.starts_with('-') {
                return fail("Missing required argument <task-id>");
            }
            let path = wf_tasks::tasks_path(spool_path, change_id);
            let contents = spool_core::io::read_to_string(&path).map_err(|_| {
                CliError::msg(format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ))
            })?;
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);
            if parsed.format == wf_tasks::TasksFormat::Checkbox {
                // 1-based index
                let Ok(idx) = task_id.parse::<usize>() else {
                    return fail(format!("Task \"{task_id}\" not found"));
                };
                let mut count = 0usize;
                let mut lines: Vec<String> = contents.lines().map(|l| l.to_string()).collect();
                for line in &mut lines {
                    let t = line.trim_start();
                    let is_box = t.starts_with("- [") || t.starts_with("* [");
                    if !is_box {
                        continue;
                    }
                    count += 1;
                    if count == idx {
                        if let Some((_, rest)) = t.split_once(']') {
                            let prefix = if t.starts_with('*') { "* [x]" } else { "- [x]" };
                            *line = format!("{}{}", prefix, rest);
                        }
                        break;
                    }
                }
                if count < idx {
                    return fail(format!("Task \"{task_id}\" not found"));
                }
                let mut out = lines.join("\n");
                out.push('\n');
                spool_core::io::write(&path, out.as_bytes()).map_err(to_cli_error)?;
                eprintln!("✔ Task \"{task_id}\" marked as complete");
                return Ok(());
            }

            if let Some(msg) = diagnostics::blocking_task_error_message(&path, &parsed.diagnostics)
            {
                return Err(CliError::msg(msg));
            }

            let updated = wf_tasks::update_enhanced_task_status(
                &contents,
                task_id,
                wf_tasks::TaskStatus::Complete,
                chrono::Local::now(),
            );
            spool_core::io::write(&path, updated.as_bytes()).map_err(to_cli_error)?;
            eprintln!("✔ Task \"{task_id}\" marked as complete");
            Ok(())
        }
        "shelve" => {
            let task_id = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if task_id.is_empty() || task_id.starts_with('-') {
                return fail("Missing required argument <task-id>");
            }
            let path = wf_tasks::tasks_path(spool_path, change_id);
            let contents = spool_core::io::read_to_string(&path).map_err(|_| {
                CliError::msg(format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ))
            })?;
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);
            if parsed.format == wf_tasks::TasksFormat::Checkbox {
                return fail("Checkbox-only tasks.md does not support shelving.");
            }

            if let Some(msg) = diagnostics::blocking_task_error_message(&path, &parsed.diagnostics)
            {
                return Err(CliError::msg(msg));
            }

            let Some(task) = parsed.tasks.iter().find(|t| t.id == task_id) else {
                return fail(format!("Task \"{task_id}\" not found in tasks.md"));
            };
            if task.status == wf_tasks::TaskStatus::Complete {
                return fail(format!("Task \"{task_id}\" is already complete"));
            }

            let updated = wf_tasks::update_enhanced_task_status(
                &contents,
                task_id,
                wf_tasks::TaskStatus::Shelved,
                chrono::Local::now(),
            );
            spool_core::io::write(&path, updated.as_bytes()).map_err(to_cli_error)?;
            eprintln!("✔ Task \"{task_id}\" shelved");
            Ok(())
        }
        "unshelve" => {
            let task_id = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if task_id.is_empty() || task_id.starts_with('-') {
                return fail("Missing required argument <task-id>");
            }
            let path = wf_tasks::tasks_path(spool_path, change_id);
            let contents = spool_core::io::read_to_string(&path).map_err(|_| {
                CliError::msg(format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ))
            })?;
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);
            if parsed.format == wf_tasks::TasksFormat::Checkbox {
                return fail("Checkbox-only tasks.md does not support shelving.");
            }

            if let Some(msg) = diagnostics::blocking_task_error_message(&path, &parsed.diagnostics)
            {
                return Err(CliError::msg(msg));
            }

            let Some(task) = parsed.tasks.iter().find(|t| t.id == task_id) else {
                return fail(format!("Task \"{task_id}\" not found in tasks.md"));
            };
            if task.status != wf_tasks::TaskStatus::Shelved {
                return fail(format!("Task \"{task_id}\" is not shelved"));
            }

            let updated = wf_tasks::update_enhanced_task_status(
                &contents,
                task_id,
                wf_tasks::TaskStatus::Pending,
                chrono::Local::now(),
            );
            spool_core::io::write(&path, updated.as_bytes()).map_err(to_cli_error)?;
            eprintln!("✔ Task \"{task_id}\" unshelved (pending)");
            Ok(())
        }
        "add" => {
            let task_name = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if task_name.is_empty() || task_name.starts_with('-') {
                return fail("Missing required argument <task-name>");
            }
            let wave = parse_wave_flag(args);
            let path = wf_tasks::tasks_path(spool_path, change_id);
            let contents = spool_core::io::read_to_string(&path).map_err(|_| {
                CliError::msg(format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ))
            })?;
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);
            if parsed.format != wf_tasks::TasksFormat::Enhanced {
                return fail(
                    "Cannot add tasks to checkbox-only tracking file. Convert to enhanced format first.",
                );
            }

            if let Some(msg) = diagnostics::blocking_task_error_message(&path, &parsed.diagnostics)
            {
                return Err(CliError::msg(msg));
            }

            let mut max_n = 0u32;
            for t in &parsed.tasks {
                if let Some((w, n)) = t.id.split_once('.')
                    && let (Ok(w), Ok(n)) = (w.parse::<u32>(), n.parse::<u32>())
                    && w == wave
                {
                    max_n = max_n.max(n);
                }
            }
            let new_id = format!("{wave}.{}", max_n + 1);

            let date = chrono::Local::now().format("%Y-%m-%d").to_string();
            let block = format!(
                "\n### Task {new_id}: {task_name}\n- **Files**: `path/to/file.ts`\n- **Dependencies**: None\n- **Action**:\n  [Describe what needs to be done]\n- **Verify**: `[command to verify, e.g., npm test]`\n- **Done When**: [Success criteria]\n- **Updated At**: {date}\n- **Status**: [ ] pending\n"
            );

            let mut out = contents.clone();
            if out.contains(&format!("## Wave {wave}")) {
                // Insert before the next major section after this wave.
                if let Some(pos) = out.find("## Checkpoints") {
                    out.insert_str(pos, &block);
                } else {
                    out.push_str(&block);
                }
            } else {
                // Create wave section before checkpoints (or at end).
                if let Some(pos) = out.find("## Checkpoints") {
                    out.insert_str(
                        pos,
                        &format!("\n---\n\n## Wave {wave}\n- **Depends On**: None\n"),
                    );
                    let pos2 = out.find("## Checkpoints").unwrap_or(out.len());
                    out.insert_str(pos2, &block);
                } else {
                    out.push_str(&format!(
                        "\n---\n\n## Wave {wave}\n- **Depends On**: None\n"
                    ));
                    out.push_str(&block);
                }
            }

            spool_core::io::write(&path, out.as_bytes()).map_err(to_cli_error)?;
            eprintln!("✔ Task {new_id} \"{task_name}\" added to Wave {wave}");
            Ok(())
        }
        "show" => {
            let path = wf_tasks::tasks_path(spool_path, change_id);
            let contents = spool_core::io::read_to_string(&path)
                .map_err(|_| CliError::msg(format!("tasks.md not found for \"{change_id}\"")))?;
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);

            if let Some(msg) = diagnostics::blocking_task_error_message(&path, &parsed.diagnostics)
            {
                return Err(CliError::msg(msg));
            }
            print!("{contents}");
            Ok(())
        }
        _ => fail(format!("Unknown tasks subcommand '{sub}'")),
    }
}

const CREATE_HELP: &str = "Usage: spool create <type> [options]\n\nCreate items\n\nTypes:\n  module <name>                 Create a module\n  change <name>                 Create a change\n\nOptions:\n  --schema <name>               Workflow schema name (default: spec-driven)\n  --module <id>                 Module id (default: 000)\n  --description <text>          Description (writes README.md)\n  --scope <capabilities>        Module scope (comma-separated, default: \"*\")\n  --depends-on <modules>        Module dependencies (comma-separated module ids)\n  -h, --help                    display help for command";

const NEW_HELP: &str = "Usage: spool new <type> [options]\n\n[Experimental] Create new items\n\nTypes:\n  change <name>                 Create a change\n\nOptions:\n  --schema <name>               Workflow schema name (default: spec-driven)\n  --module <id>                 Module id (default: 000)\n  --description <text>          Description (writes README.md)\n  -h, --help                    display help for command";

const STATUS_HELP: &str = "Usage: spool status [options]\n\n[Experimental] Display artifact completion status for a change\n\nOptions:\n  --change <name>               Change id (directory name)\n  --schema <name>               Workflow schema name\n  --json                         Output as JSON\n  -h, --help                     display help for command";

const TEMPLATES_HELP: &str = "Usage: spool templates [options]\n\n[Experimental] Show resolved template paths for all artifacts in a schema\n\nOptions:\n  --schema <name>               Workflow schema name (default: spec-driven)\n  --json                         Output as JSON\n  -h, --help                     display help for command";

const INSTRUCTIONS_HELP: &str = "Usage: spool instructions <artifact> [options]\n\n[Experimental] Show instructions for generating an artifact\n\nOptions:\n  --change <name>               Change id (directory name)\n  --schema <name>               Workflow schema name\n  --json                         Output as JSON\n  -h, --help                     display help for command";

const AGENT_HELP: &str = "Usage: spool agent [command] [options]\n\nCommands that generate machine-readable output for AI agents\n\nCommands:\n  instruction <artifact> [options]   Generate enriched instructions\n\nOptions:\n  -h, --help                         display help for command";

const AGENT_INSTRUCTION_HELP: &str = "Usage: spool agent instruction <artifact> [options]\n\nGenerate enriched instructions\n\nOptions:\n  --change <name>               Change id (directory name)\n  --schema <name>               Workflow schema name\n  --json                         Output as JSON\n  -h, --help                     display help for command";

fn handle_create(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{CREATE_HELP}");
        return Ok(());
    }

    let Some(kind) = args.first().map(|s| s.as_str()) else {
        return fail("Missing required argument <type>");
    };

    let spool_path = rt.spool_path();

    match kind {
        "module" => {
            let name = args.get(1).map(|s| s.as_str()).unwrap_or("");
            if name.is_empty() || name.starts_with('-') {
                return fail("Missing required argument <name>");
            }
            let scope = parse_string_flag(args, "--scope")
                .map(|raw| split_csv(&raw))
                .unwrap_or_else(|| vec!["*".to_string()]);
            let depends_on = parse_string_flag(args, "--depends-on")
                .map(|raw| split_csv(&raw))
                .unwrap_or_default();

            let r = core_create::create_module(spool_path, name, scope, depends_on)
                .map_err(to_cli_error)?;
            if !r.created {
                println!("Module \"{}\" already exists as {}", name, r.folder_name);
                return Ok(());
            }
            println!("Created module: {}", r.folder_name);
            println!("  Path: {}", r.module_dir.display());
            println!("  Edit: spool/modules/{}/module.md", r.folder_name);
            Ok(())
        }
        "change" => {
            let name = args.get(1).map(|s| s.as_str()).unwrap_or("");
            if name.is_empty() || name.starts_with('-') {
                return fail("Missing required argument <name>");
            }
            let schema_opt = parse_string_flag(args, "--schema");
            let schema = schema_opt
                .clone()
                .unwrap_or_else(|| core_workflow::default_schema_name().to_string());
            let module = parse_string_flag(args, "--module");
            let description = parse_string_flag(args, "--description");

            let module_id = module
                .as_deref()
                .and_then(|m| {
                    spool_core::id::parse_module_id(m)
                        .ok()
                        .map(|p| p.module_id.to_string())
                })
                .unwrap_or_else(|| "000".to_string());
            let schema_display = if schema_opt.is_some() {
                format!(" with schema '{}'", schema)
            } else {
                String::new()
            };

            // Match TS/ora: spinner output is written to stderr.
            eprintln!(
                "- Creating change '{}' in module {}{}...",
                name, module_id, schema_display
            );

            match core_create::create_change(
                spool_path,
                name,
                &schema,
                module.as_deref(),
                description.as_deref(),
            ) {
                Ok(r) => {
                    // TS prints the spool directory name (default: ".spool") rather than an absolute path.
                    let spool_dir = spool_path
                        .file_name()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_else(|| ".spool".to_string());
                    eprintln!(
                        "✔ Created change '{}' at {}/changes/{}/ (schema: {})",
                        r.change_id, spool_dir, r.change_id, schema
                    );
                    Ok(())
                }
                Err(e) => Err(to_cli_error(e)),
            }
        }
        _ => fail(format!("Unknown create type '{kind}'")),
    }
}

fn handle_new(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{NEW_HELP}");
        return Ok(());
    }

    let Some(kind) = args.first().map(|s| s.as_str()) else {
        return fail("Missing required argument <type>");
    };
    if kind != "change" {
        return fail(format!("Unknown new type '{kind}'"));
    }

    let name = args.get(1).map(|s| s.as_str()).unwrap_or("");
    if name.is_empty() || name.starts_with('-') {
        return fail("Missing required argument <name>");
    }

    let schema_opt = parse_string_flag(args, "--schema");
    let schema = schema_opt
        .clone()
        .unwrap_or_else(|| core_workflow::default_schema_name().to_string());
    let module = parse_string_flag(args, "--module");
    let description = parse_string_flag(args, "--description");

    let spool_path = rt.spool_path();

    let module_id = module
        .as_deref()
        .and_then(|m| {
            spool_core::id::parse_module_id(m)
                .ok()
                .map(|p| p.module_id.to_string())
        })
        .unwrap_or_else(|| "000".to_string());
    let schema_display = if schema_opt.is_some() {
        format!(" with schema '{}'", schema)
    } else {
        String::new()
    };
    eprintln!(
        "- Creating change '{}' in module {}{}...",
        name, module_id, schema_display
    );

    match core_create::create_change(
        spool_path,
        name,
        &schema,
        module.as_deref(),
        description.as_deref(),
    ) {
        Ok(r) => {
            let spool_dir = spool_path
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| ".spool".to_string());
            eprintln!(
                "✔ Created change '{}' at {}/changes/{}/ (schema: {})",
                r.change_id, spool_dir, r.change_id, schema
            );
            Ok(())
        }
        Err(e) => Err(to_cli_error(e)),
    }
}

fn handle_status(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{STATUS_HELP}");
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
                return fail(schema_not_found_message(ctx, &name));
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

fn handle_templates(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{TEMPLATES_HELP}");
        return Ok(());
    }
    let want_json = args.iter().any(|a| a == "--json");
    let schema = parse_string_flag(args, "--schema");

    eprintln!("Warning: \"spool templates\" is deprecated. Use \"spool x-templates\" instead.");

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Loading templates...");

    let ctx = rt.ctx();
    let schema_name = schema
        .clone()
        .unwrap_or_else(|| core_workflow::default_schema_name().to_string());
    let resolved = match core_workflow::resolve_schema(Some(&schema_name), ctx) {
        Ok(v) => v,
        Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
            return fail(schema_not_found_message(ctx, &name));
        }
        Err(e) => return Err(to_cli_error(e)),
    };

    let templates_dir = resolved.schema_dir.join("templates");

    if want_json {
        let mut out: std::collections::BTreeMap<String, core_workflow::TemplateInfo> =
            std::collections::BTreeMap::new();
        for a in &resolved.schema.artifacts {
            out.insert(
                a.id.clone(),
                core_workflow::TemplateInfo {
                    source: resolved.source.as_str().to_string(),
                    path: templates_dir
                        .join(&a.template)
                        .to_string_lossy()
                        .to_string(),
                },
            );
        }
        let rendered = serde_json::to_string_pretty(&out).expect("json should serialize");
        println!("{rendered}");
        return Ok(());
    }

    println!("Schema: {}", resolved.schema.name);
    println!(
        "Source: {}",
        if resolved.source == core_workflow::SchemaSource::User {
            "user override"
        } else {
            "package built-in"
        }
    );
    println!();

    for a in &resolved.schema.artifacts {
        println!("{}:", a.id);
        println!("  {}", templates_dir.join(&a.template).to_string_lossy());
    }

    Ok(())
}

fn handle_instructions(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{INSTRUCTIONS_HELP}");
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
                return fail(schema_not_found_message(ctx, &name));
            }
            Err(e) => return Err(to_cli_error(e)),
        };

        if want_json {
            let rendered = serde_json::to_string_pretty(&apply).expect("json should serialize");
            println!("{rendered}");
            return Ok(());
        }

        print_apply_instructions_text(&apply);
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
            return fail(schema_not_found_message(ctx, &name));
        }
        Err(e) => return Err(to_cli_error(e)),
    };

    if want_json {
        let rendered = serde_json::to_string_pretty(&resolved).expect("json should serialize");
        println!("{rendered}");
        return Ok(());
    }

    print_artifact_instructions_text(&resolved);

    Ok(())
}

fn print_artifact_instructions_text(instructions: &core_workflow::InstructionsResponse) {
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

fn handle_agent(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.is_empty() || args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{AGENT_HELP}");
        return Ok(());
    }
    match args.first().map(|s| s.as_str()) {
        Some("instruction") => handle_agent_instruction(rt, &args[1..]),
        _ => {
            println!("{AGENT_HELP}");
            Ok(())
        }
    }
}

fn handle_agent_instruction(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.is_empty() || args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{AGENT_INSTRUCTION_HELP}");
        return Ok(());
    }
    let want_json = args.iter().any(|a| a == "--json");
    let artifact = args.first().map(|s| s.as_str()).unwrap_or("");
    if artifact.is_empty() || artifact.starts_with('-') {
        return fail("Missing required argument <artifact>");
    }
    let change = parse_string_flag(args, "--change");
    if change.as_deref().unwrap_or("").is_empty() {
        return fail("Missing required option --change");
    }
    let change = change.expect("checked above");
    let schema = parse_string_flag(args, "--schema");

    let ctx = rt.ctx();
    let spool_path = rt.spool_path();

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Generating instructions...");

    if artifact == "apply" {
        return fail("Invalid artifact 'apply'");
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
    print_artifact_instructions_text(&resolved);

    Ok(())
}

fn handle_x_instructions(rt: &Runtime, args: &[String]) -> CliResult<()> {
    eprintln!(
        "Warning: \"spool x-instructions\" is deprecated. Use \"spool agent instruction\" instead."
    );
    handle_agent_instruction(rt, args)
}

fn handle_init(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{INIT_HELP}");
        return Ok(());
    }

    let force = args.iter().any(|a| a == "--force" || a == "-f");
    let tools_arg = parse_string_flag(args, "--tools");

    // Positional path (defaults to current directory).
    let target = last_positional(args).unwrap_or_else(|| ".".to_string());
    let target_path = std::path::Path::new(&target);
    let ctx = rt.ctx();

    let all_ids = spool_core::installers::available_tool_ids();

    let tools: BTreeSet<String> = if let Some(raw) = tools_arg.as_deref() {
        let raw = raw.trim();
        if raw.is_empty() {
            return fail("--tools cannot be empty");
        }

        if raw == "none" {
            BTreeSet::new()
        } else if raw == "all" {
            all_ids.iter().map(|s| (*s).to_string()).collect()
        } else {
            let valid = all_ids.join(", ");
            let mut selected: BTreeSet<String> = BTreeSet::new();
            for part in raw.split(',') {
                let id = part.trim();
                if id.is_empty() {
                    continue;
                }
                if all_ids.contains(&id) {
                    selected.insert(id.to_string());
                } else {
                    return fail(format!("Unknown tool id '{id}'. Valid tool ids: {valid}"));
                }
            }
            selected
        }
    } else {
        use std::io::BufRead;
        use std::io::{IsTerminal, stdin, stdout};

        // Match TS semantics: prompt only when interactive; otherwise require explicit --tools.
        let ui = spool_core::output::resolve_ui_options(
            false,
            std::env::var("SPOOL_INTERACTIVE").ok().as_deref(),
            false,
            std::env::var("NO_COLOR").ok().as_deref(),
        );
        let is_tty = stdin().is_terminal() && stdout().is_terminal();
        if !(ui.interactive && is_tty) {
            return fail(
                "Non-interactive init requires --tools (all, none, or comma-separated ids).",
            );
        }

        println!(
            "Welcome to Spool!\n\nStep 1/3\n\nConfigure your Spool tooling\nPress Enter to continue."
        );
        {
            let mut line = String::new();
            let mut locked = stdin().lock();
            let _ = locked.read_line(&mut line);
        }

        println!(
            "\nStep 2/3\n\nWhich natively supported AI tools do you use?\nUse ↑/↓ to move · Space to toggle · Enter reviews.\n"
        );

        let mut detected: BTreeSet<&'static str> = BTreeSet::new();
        if target_path.join("CLAUDE.md").exists() || target_path.join(".claude").exists() {
            detected.insert(spool_core::installers::TOOL_CLAUDE);
        }
        if target_path.join(".opencode").exists() {
            detected.insert(spool_core::installers::TOOL_OPENCODE);
        }
        if target_path.join(".github").exists() {
            detected.insert(spool_core::installers::TOOL_GITHUB_COPILOT);
        }
        let codex_home = std::env::var_os("CODEX_HOME")
            .map(std::path::PathBuf::from)
            .or_else(|| ctx.home_dir.clone().map(|h| h.join(".codex")));
        if codex_home.is_some_and(|p| p.exists()) {
            detected.insert(spool_core::installers::TOOL_CODEX);
        }

        let tool_items: Vec<(&'static str, &str)> = vec![
            (spool_core::installers::TOOL_CLAUDE, "Claude Code"),
            (spool_core::installers::TOOL_CODEX, "Codex"),
            (
                spool_core::installers::TOOL_GITHUB_COPILOT,
                "GitHub Copilot",
            ),
            (spool_core::installers::TOOL_OPENCODE, "OpenCode"),
        ];
        let labels: Vec<String> = tool_items
            .iter()
            .map(|(id, label)| format!("{label} ({id})"))
            .collect();
        let defaults: Vec<bool> = tool_items
            .iter()
            .map(|(id, _)| detected.contains(id))
            .collect();

        let indices =
            match dialoguer::MultiSelect::with_theme(&dialoguer::theme::ColorfulTheme::default())
                .with_prompt("Select AI tools to configure")
                .items(&labels)
                .defaults(&defaults)
                .interact()
            {
                Ok(v) => v,
                Err(e) => {
                    return Err(CliError::msg(format!("Failed to prompt for tools: {e}")));
                }
            };

        println!("\nStep 3/3\n\nReview selections\nPress Enter to confirm.");
        {
            let mut line = String::new();
            let mut locked = stdin().lock();
            let _ = locked.read_line(&mut line);
        }

        indices
            .into_iter()
            .map(|i| tool_items[i].0.to_string())
            .collect()
    };

    let opts = InitOptions::new(tools, force);
    install_default_templates(target_path, ctx, InstallMode::Init, &opts).map_err(to_cli_error)?;

    Ok(())
}

fn handle_update(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{UPDATE_HELP}");
        return Ok(());
    }

    // `--json` is accepted for parity with TS but not implemented yet.
    let _want_json = args.iter().any(|a| a == "--json");
    let target = last_positional(args).unwrap_or_else(|| ".".to_string());
    let target_path = std::path::Path::new(&target);
    let ctx = rt.ctx();

    let tools: BTreeSet<String> = spool_core::installers::available_tool_ids()
        .iter()
        .map(|s| (*s).to_string())
        .collect();
    let opts = InitOptions::new(tools, true);

    install_default_templates(target_path, ctx, InstallMode::Update, &opts)
        .map_err(to_cli_error)?;

    Ok(())
}

fn handle_list(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{LIST_HELP}");
        return Ok(());
    }

    let want_specs = args.iter().any(|a| a == "--specs");
    let want_modules = args.iter().any(|a| a == "--modules");
    let want_json = args.iter().any(|a| a == "--json");

    let sort = parse_sort_order(args).unwrap_or("recent");
    let mode = if want_specs {
        "specs"
    } else if want_modules {
        "modules"
    } else {
        // default is changes, and `--changes` is a no-op.
        "changes"
    };

    let spool_path = rt.spool_path();

    match mode {
        "modules" => {
            let modules = spool_core::list::list_modules(spool_path).unwrap_or_default();
            if want_json {
                let payload = ModulesResponse { modules };
                let rendered =
                    serde_json::to_string_pretty(&payload).expect("json should serialize");
                println!("{rendered}");
                return Ok(());
            }

            if modules.is_empty() {
                println!("No modules found.");
                println!("Create one with: spool create module <name>");
                return Ok(());
            }

            println!("Modules:\n");
            for m in modules {
                if m.change_count == 0 {
                    println!("  {}", m.full_name);
                    continue;
                }
                let suffix = if m.change_count == 1 {
                    "change"
                } else {
                    "changes"
                };
                println!("  {} ({} {suffix})", m.full_name, m.change_count);
            }
            println!();
        }
        "specs" => {
            let specs = spool_core::list::list_specs(spool_path).unwrap_or_default();
            if specs.is_empty() {
                // TS prints a plain sentence even for `--json`.
                println!("No specs found.");
                return Ok(());
            }

            if want_json {
                let payload = SpecsResponse { specs };
                let rendered =
                    serde_json::to_string_pretty(&payload).expect("json should serialize");
                println!("{rendered}");
                return Ok(());
            }

            println!("Specs:");
            let padding = "  ";
            let name_width = specs.iter().map(|s| s.id.len()).max().unwrap_or(0);
            for s in specs {
                let padded = format!("{id: <width$}", id = s.id, width = name_width);
                println!("{padding}{padded}     requirements {}", s.requirement_count);
            }
        }
        _ => {
            // changes
            let changes_dir = core_paths::changes_dir(spool_path);
            if !changes_dir.exists() {
                return fail("No Spool changes directory found. Run 'spool init' first.");
            }

            let mut items: Vec<(String, u32, u32, DateTime<Utc>)> = Vec::new();
            for name in &rt.repo_index().change_dir_names {
                let change_path = core_paths::change_dir(spool_path, name);
                let tasks_path = change_path.join("tasks.md");
                let (total, completed) = spool_core::io::read_to_string_optional(&tasks_path)
                    .map_err(to_cli_error)?
                    .map(|c| spool_core::list::count_tasks_markdown(&c))
                    .unwrap_or((0, 0));
                let lm = spool_core::list::last_modified_recursive(&change_path)
                    .unwrap_or_else(|_| Utc::now());
                items.push((name.clone(), completed, total, lm));
            }

            if items.is_empty() {
                if want_json {
                    let rendered =
                        serde_json::to_string_pretty(&serde_json::json!({ "changes": [] }))
                            .expect("json should serialize");
                    println!("{rendered}");
                } else {
                    println!("No active changes found.");
                }
                return Ok(());
            }

            if sort == "name" {
                items.sort_by(|a, b| a.0.cmp(&b.0));
            } else {
                items.sort_by(|a, b| b.3.cmp(&a.3));
            }

            if want_json {
                let changes: Vec<spool_core::list::ChangeListItem> = items
                    .into_iter()
                    .map(|(name, completed, total, lm)| {
                        let status = if total == 0 {
                            "no-tasks"
                        } else if completed == total {
                            "complete"
                        } else {
                            "in-progress"
                        };
                        spool_core::list::ChangeListItem {
                            name,
                            completed_tasks: completed,
                            total_tasks: total,
                            last_modified: spool_core::list::to_iso_millis(lm),
                            status: status.to_string(),
                        }
                    })
                    .collect();
                let payload = ChangesResponse { changes };
                let rendered =
                    serde_json::to_string_pretty(&payload).expect("json should serialize");
                println!("{rendered}");
                return Ok(());
            }

            println!("Changes:");
            let name_width = items.iter().map(|i| i.0.len()).max().unwrap_or(0);
            for (name, completed, total, lm) in items {
                let status = format_task_status(total, completed);
                let time_ago = format_relative_time(lm);
                let padded = format!("{name: <width$}", width = name_width);
                println!("  {padded}     {: <12}  {time_ago}", status);
            }
        }
    }

    Ok(())
}

const SHOW_HELP: &str = "Usage: spool show [options] [command] [item-name]\n\nShow a change or spec\n\nOptions:\n  --json                          Output as JSON\n  --type <type>                   Type: change or spec\n  --no-interactive                Disable interactive prompts\n  --deltas-only                   Change JSON only: only include deltas\n  --requirements-only             Change JSON only: only include deltas (deprecated)\n  --requirements                  Spec JSON only: exclude scenarios\n  --no-scenarios                  Spec JSON only: exclude scenarios\n  -r, --requirement <id>          Spec JSON only: select requirement (1-based)\n  -h, --help                      display help for command\n\nCommands:\n  module [options] [module-id]    Show a module";

fn handle_show(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{SHOW_HELP}");
        return Ok(());
    }

    // Parse subcommand: `spool show module <id>`
    if args.first().map(|s| s.as_str()) == Some("module") {
        return handle_show_module(rt, &args[1..]);
    }

    let want_json = args.iter().any(|a| a == "--json");
    let typ = parse_string_flag(args, "--type");
    let cli_no_interactive = args.iter().any(|a| a == "--no-interactive");
    let ui = spool_core::output::resolve_ui_options(
        false,
        std::env::var("NO_COLOR").ok().as_deref(),
        cli_no_interactive,
        std::env::var("SPOOL_INTERACTIVE").ok().as_deref(),
    );

    let deltas_only = args.iter().any(|a| a == "--deltas-only");
    let requirements_only = args.iter().any(|a| a == "--requirements-only");

    let requirements = args.iter().any(|a| a == "--requirements");
    let scenarios = !args.iter().any(|a| a == "--no-scenarios");
    let requirement_idx = parse_string_flag(args, "--requirement")
        .or_else(|| parse_string_flag(args, "-r"))
        .and_then(|s| s.parse::<usize>().ok());

    let item = last_positional(args);
    if item.is_none() {
        if ui.interactive {
            // Interactive selection is not implemented yet.
        }
        return fail(
            "Nothing to show. Try one of:\n  spool show <item>\n  spool show (for interactive selection)\nOr run in an interactive terminal.",
        );
    }
    let item = item.expect("checked");

    let spool_path = rt.spool_path();

    let explicit = typ.as_deref();
    let resolved_type = match explicit {
        Some("change") | Some("spec") => explicit.unwrap().to_string(),
        Some(_) => return fail("Invalid type. Expected 'change' or 'spec'."),
        None => detect_item_type(rt, &item),
    };

    if resolved_type == "ambiguous" {
        return fail(format!(
            "Ambiguous item '{item}' matches both a change and a spec.\nUse --type change or --type spec to disambiguate."
        ));
    }
    if resolved_type == "unknown" {
        let candidates = list_candidate_items(rt);
        let suggestions = nearest_matches(&item, &candidates, 5);
        return fail(unknown_with_suggestions("item", &item, &suggestions));
    }

    // Warn on ignored flags (matches TS behavior closely).
    if want_json {
        let ignored = ignored_show_flags(
            &resolved_type,
            deltas_only,
            requirements_only,
            requirements,
            scenarios,
            requirement_idx,
        );
        if !ignored.is_empty() {
            eprintln!(
                "Warning: Ignoring flags not applicable to {resolved_type}: {}",
                ignored.join(", ")
            );
        }
    }

    match resolved_type.as_str() {
        "spec" => {
            let spec_path = core_paths::spec_markdown_path(spool_path, &item);
            let md = spool_core::io::read_to_string(&spec_path).map_err(|_| {
                CliError::msg(format!(
                    "Spec '{item}' not found at {}",
                    spec_path.display()
                ))
            })?;
            if want_json {
                if requirements && requirement_idx.is_some() {
                    return fail("Cannot use --requirement with --requirements");
                }
                let mut json = core_show::parse_spec_show_json(&item, &md);

                // Apply filters
                if requirements || !scenarios {
                    for r in &mut json.requirements {
                        r.scenarios.clear();
                    }
                }
                if let Some(one_based) = requirement_idx {
                    if one_based == 0 || one_based > json.requirements.len() {
                        return fail(format!(
                            "Requirement index out of range. Expected 1..={}",
                            json.requirements.len()
                        ));
                    }
                    json.requirements = vec![json.requirements[one_based - 1].clone()];
                    json.requirement_count = json.requirements.len() as u32;
                }
                let rendered = serde_json::to_string_pretty(&json).expect("json should serialize");
                println!("{rendered}");
            } else {
                print!("{md}");
            }
            Ok(())
        }
        "change" => {
            let change_path = core_paths::change_dir(spool_path, &item);
            let proposal_path = change_path.join("proposal.md");
            if !proposal_path.exists() {
                return fail(format!(
                    "Change '{item}' not found at {}",
                    proposal_path.display()
                ));
            }
            if want_json {
                let mut files: Vec<core_show::DeltaSpecFile> = Vec::new();
                let paths =
                    core_show::read_change_delta_spec_paths(spool_path, &item).unwrap_or_default();
                for p in paths {
                    if let Ok(f) = core_show::load_delta_spec_file(&p) {
                        files.push(f);
                    }
                }
                let json = core_show::parse_change_show_json(&item, &files);
                let rendered = serde_json::to_string_pretty(&json).expect("json should serialize");
                println!("{rendered}");
            } else {
                let md = spool_core::io::read_to_string_or_default(&proposal_path);
                print!("{md}");
            }
            Ok(())
        }
        _ => fail("Unhandled show type"),
    }
}

fn ignored_show_flags(
    typ: &str,
    deltas_only: bool,
    requirements_only: bool,
    requirements: bool,
    scenarios: bool,
    requirement_idx: Option<usize>,
) -> Vec<&'static str> {
    let mut out: Vec<&'static str> = Vec::new();
    if typ == "spec" {
        if deltas_only {
            out.push("deltasOnly");
        }
        if requirements_only {
            out.push("requirementsOnly");
        }
    } else if typ == "change" {
        // Commander sets `scenarios` default true; TS warns even when not specified.
        if scenarios {
            out.push("scenarios");
        }
        if requirements {
            out.push("requirements");
        }
        if requirement_idx.is_some() {
            out.push("requirement");
        }
    }
    out
}

fn handle_show_module(rt: &Runtime, args: &[String]) -> CliResult<()> {
    // Minimal module show: print module.md if present.
    let want_json = args.iter().any(|a| a == "--json");
    if want_json {
        return fail("Module JSON output is not implemented");
    }
    let module_id = last_positional(args);
    if module_id.is_none() {
        return fail(
            "Nothing to show. Try one of:\n  spool show module <module-id>\nOr run in an interactive terminal.",
        );
    }
    let module_id = module_id.expect("checked");

    let spool_path = rt.spool_path();

    let resolved = core_validate::resolve_module(spool_path, &module_id).map_err(to_cli_error)?;
    let Some(m) = resolved else {
        return fail(format!("Module '{module_id}' not found"));
    };

    let md = spool_core::io::read_to_string_or_default(&m.module_md);
    print!("{md}");

    Ok(())
}

const VALIDATE_HELP: &str = "Usage: spool validate [options] [command] [item-name]\n\nValidate changes, specs, and modules\n\nOptions:\n  --all                          Validate everything\n  --changes                       Validate changes\n  --specs                         Validate specs\n  --modules                       Validate modules\n  --module <id>                   Validate a module by id\n  --type <type>                   Type: change, spec, or module\n  --strict                        Treat warnings as errors\n  --json                          Output as JSON\n  --concurrency <n>               Concurrency (default: 6)\n  --no-interactive                Disable interactive prompts\n  -h, --help                      display help for command\n\nCommands:\n  module [module-id]              Validate a module";

fn handle_loop(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{LOOP_HELP}\n\n{RALPH_HELP}");
        return Ok(());
    }
    // Match TS: loop is deprecated wrapper.
    eprintln!("Warning: `spool loop` is deprecated. Use `spool ralph` instead.");
    handle_ralph(rt, args)
}

fn handle_ralph(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{RALPH_HELP}");
        return Ok(());
    }

    fn parse_u32_flag(args: &[String], key: &str) -> Option<u32> {
        parse_string_flag(args, key).and_then(|v| v.parse::<u32>().ok())
    }

    fn collect_prompt(args: &[String]) -> String {
        // Collect positional args, skipping known flags + their values.
        let mut out: Vec<String> = Vec::new();
        let mut i = 0;
        while i < args.len() {
            let a = args[i].as_str();
            let takes_value = matches!(
                a,
                "--change"
                    | "--module"
                    | "--harness"
                    | "--model"
                    | "--min-iterations"
                    | "--max-iterations"
                    | "--completion-promise"
                    | "--add-context"
                    | "--stub-script"
            );

            if takes_value {
                i += 2;
                continue;
            }

            if a.starts_with("--change=")
                || a.starts_with("--module=")
                || a.starts_with("--harness=")
                || a.starts_with("--model=")
                || a.starts_with("--min-iterations=")
                || a.starts_with("--max-iterations=")
                || a.starts_with("--completion-promise=")
                || a.starts_with("--add-context=")
                || a.starts_with("--stub-script=")
            {
                i += 1;
                continue;
            }

            if a.starts_with('-') {
                i += 1;
                continue;
            }

            out.push(args[i].clone());
            i += 1;
        }
        out.join(" ")
    }

    let change_id = parse_string_flag(args, "--change");
    let module_id = parse_string_flag(args, "--module");

    let harness = parse_string_flag(args, "--harness").unwrap_or_else(|| "opencode".to_string());
    let model = parse_string_flag(args, "--model");

    let min_iterations = parse_u32_flag(args, "--min-iterations").unwrap_or(1);
    let max_iterations = parse_u32_flag(args, "--max-iterations");
    let completion_promise =
        parse_string_flag(args, "--completion-promise").unwrap_or_else(|| "COMPLETE".to_string());

    let allow_all = args.iter().any(|a| {
        matches!(
            a.as_str(),
            "--allow-all" | "--yolo" | "--dangerously-allow-all"
        )
    });
    let no_commit = args.iter().any(|a| a == "--no-commit");
    let status = args.iter().any(|a| a == "--status");
    let add_context = parse_string_flag(args, "--add-context");
    let clear_context = args.iter().any(|a| a == "--clear-context");
    let interactive = !args.iter().any(|a| a == "--no-interactive");

    // Hidden testing flag.
    let stub_script = parse_string_flag(args, "--stub-script");

    if !interactive
        && change_id.is_none()
        && module_id.is_none()
        && !status
        && add_context.is_none()
        && !clear_context
    {
        return fail(
            "Either --change, --module, --status, --add-context, or --clear-context must be specified",
        );
    }

    if clear_context && change_id.is_none() {
        return fail("--change is required for --clear-context");
    }
    if add_context.is_some() && change_id.is_none() {
        return fail("--change is required for --add-context");
    }
    if status && change_id.is_none() && module_id.is_none() {
        return fail("--change is required for --status, or provide --module to auto-select");
    }

    let prompt = collect_prompt(args);

    let spool_path = rt.spool_path();

    let mut harness_impl: Box<dyn Harness> = match harness.as_str() {
        "opencode" => Box::new(OpencodeHarness),
        "stub" => {
            let mut p = stub_script.map(std::path::PathBuf::from);
            if p.is_none() {
                // Prefer env var in CI, but allow missing.
                p = None;
            }
            match StubHarness::from_env_or_default(p) {
                Ok(h) => Box::new(h),
                Err(e) => return Err(to_cli_error(e)),
            }
        }
        _ => return fail(format!("Unknown harness: {h}", h = harness)),
    };

    let opts = core_ralph::RalphOptions {
        prompt,
        change_id,
        module_id,
        model,
        min_iterations,
        max_iterations,
        completion_promise,
        allow_all,
        no_commit,
        interactive,
        status,
        add_context,
        clear_context,
    };

    core_ralph::run_ralph(spool_path, opts, harness_impl.as_mut()).map_err(to_cli_error)?;

    Ok(())
}

fn handle_validate(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{VALIDATE_HELP}");
        return Ok(());
    }

    if args.first().map(|s| s.as_str()) == Some("module") {
        return handle_validate_module(rt, &args[1..]);
    }

    let want_json = args.iter().any(|a| a == "--json");
    let strict = args.iter().any(|a| a == "--strict");
    let typ = parse_string_flag(args, "--type");
    let bulk = args
        .iter()
        .any(|a| matches!(a.as_str(), "--all" | "--changes" | "--specs" | "--modules"));

    let item = last_positional(args);
    if item.is_none() && !bulk {
        return fail(
            "Nothing to validate. Try one of:\n  spool validate --all\n  spool validate --changes\n  spool validate --specs\n  spool validate <item-name>\nOr run in an interactive terminal.",
        );
    }

    if bulk {
        let spool_path = rt.spool_path();
        let repo_index = rt.repo_index();

        let want_all = args.iter().any(|a| a == "--all");
        let want_changes = want_all || args.iter().any(|a| a == "--changes");
        let want_specs = want_all || args.iter().any(|a| a == "--specs");
        let want_modules = want_all || args.iter().any(|a| a == "--modules");

        #[derive(serde::Serialize)]
        struct Item {
            id: String,
            #[serde(rename = "type")]
            typ: String,
            valid: bool,
            issues: Vec<core_validate::ValidationIssue>,
            #[serde(rename = "durationMs")]
            duration_ms: u32,
        }

        let mut items: Vec<Item> = Vec::new();

        if want_changes {
            let module_ids = repo_index.module_ids.clone();

            let change_dirs = repo_index.change_dir_names.clone();

            let mut parsed: std::collections::BTreeMap<String, spool_core::id::ParsedChangeId> =
                std::collections::BTreeMap::new();
            let mut numeric_to_dirs: std::collections::BTreeMap<String, Vec<String>> =
                std::collections::BTreeMap::new();

            for dir_name in &change_dirs {
                match spool_core::id::parse_change_id(dir_name) {
                    Ok(p) => {
                        let numeric = format!("{}-{}", p.module_id, p.change_num);
                        numeric_to_dirs
                            .entry(numeric)
                            .or_default()
                            .push(dir_name.clone());
                        parsed.insert(dir_name.clone(), p);
                    }
                    Err(_) => {
                        // handled per-item below
                    }
                }
            }

            let mut duplicate_by_dir: std::collections::BTreeMap<String, Vec<String>> =
                std::collections::BTreeMap::new();
            for (numeric, dirs) in &numeric_to_dirs {
                if dirs.len() <= 1 {
                    continue;
                }
                for d in dirs {
                    let others: Vec<String> = dirs.iter().filter(|x| *x != d).cloned().collect();
                    duplicate_by_dir
                        .entry(d.clone())
                        .or_default()
                        .extend(others);
                    // also attach numeric id context as a message later
                    let _ = numeric;
                }
            }

            for dir_name in change_dirs {
                let mut issues: Vec<core_validate::ValidationIssue> = Vec::new();

                // Directory naming / parsing
                let parsed_change = match spool_core::id::parse_change_id(&dir_name) {
                    Ok(p) => Some(p),
                    Err(e) => {
                        let msg = if let Some(hint) = e.hint.as_deref() {
                            format!(
                                "Invalid change directory name '{dir_name}': {} (hint: {hint})",
                                e.error
                            )
                        } else {
                            format!("Invalid change directory name '{dir_name}': {}", e.error)
                        };
                        issues.push(core_validate::error("id", msg));
                        None
                    }
                };

                // Module existence
                if let Some(p) = &parsed_change
                    && !module_ids.contains(p.module_id.as_str())
                {
                    issues.push(core_validate::error(
                        "module",
                        format!(
                            "Change '{}' refers to missing module '{}'",
                            dir_name, p.module_id
                        ),
                    ));
                }

                // Duplicate numeric change IDs
                if let Some(p) = parsed.get(&dir_name) {
                    let numeric = format!("{}-{}", p.module_id, p.change_num);
                    if let Some(others) = duplicate_by_dir.get(&dir_name) {
                        issues.push(core_validate::error(
                            "id",
                            format!(
                                "Duplicate numeric change id {numeric}: also found at {}",
                                others.join(", ")
                            ),
                        ));
                    }
                }

                // Existing delta validation (if we can)
                let report = if parsed_change.is_some() {
                    core_validate::validate_change(spool_path, &dir_name, strict).unwrap_or_else(
                        |e| {
                            core_validate::ValidationReport::new(
                                vec![core_validate::error(
                                    "validate",
                                    format!("Validation failed: {e}"),
                                )],
                                strict,
                            )
                        },
                    )
                } else {
                    core_validate::ValidationReport::new(vec![], strict)
                };

                let mut merged = report.issues.clone();
                merged.extend(issues);
                let merged_report = core_validate::ValidationReport::new(merged, strict);

                items.push(Item {
                    id: dir_name,
                    typ: "change".to_string(),
                    valid: merged_report.valid,
                    issues: merged_report.issues,
                    duration_ms: 1,
                });
            }
        }

        if want_specs {
            for spec_id in list_spec_ids_from_index(spool_path, repo_index) {
                let report = core_validate::validate_spec(spool_path, &spec_id, strict)
                    .unwrap_or_else(|e| {
                        core_validate::ValidationReport::new(
                            vec![core_validate::error(
                                "validate",
                                format!("Validation failed: {e}"),
                            )],
                            strict,
                        )
                    });
                items.push(Item {
                    id: spec_id,
                    typ: "spec".to_string(),
                    valid: report.valid,
                    issues: report.issues,
                    duration_ms: 1,
                });
            }
        }

        if want_modules {
            for m in repo_index.module_dir_names.clone() {
                let (_full_name, report) = core_validate::validate_module(spool_path, &m, strict)
                    .unwrap_or_else(|e| {
                        (
                            m.clone(),
                            core_validate::ValidationReport::new(
                                vec![core_validate::error(
                                    "validate",
                                    format!("Validation failed: {e}"),
                                )],
                                strict,
                            ),
                        )
                    });

                items.push(Item {
                    id: m,
                    typ: "module".to_string(),
                    valid: report.valid,
                    issues: report.issues,
                    duration_ms: 1,
                });
            }
        }

        let passed = items.iter().filter(|i| i.valid).count() as u32;
        let failed = items.len() as u32 - passed;

        if want_json {
            #[derive(serde::Serialize)]
            struct Totals {
                items: u32,
                passed: u32,
                failed: u32,
            }
            #[derive(serde::Serialize)]
            struct ByType {
                items: u32,
                passed: u32,
                failed: u32,
            }
            #[derive(serde::Serialize)]
            struct Summary {
                totals: Totals,
                #[serde(rename = "byType")]
                by_type: std::collections::BTreeMap<String, ByType>,
            }
            #[derive(serde::Serialize)]
            struct Envelope {
                items: Vec<Item>,
                summary: Summary,
                version: &'static str,
            }

            let mut by_type: std::collections::BTreeMap<String, ByType> =
                std::collections::BTreeMap::new();
            for it in &items {
                let entry = by_type.entry(it.typ.clone()).or_insert(ByType {
                    items: 0,
                    passed: 0,
                    failed: 0,
                });
                entry.items += 1;
                if it.valid {
                    entry.passed += 1;
                } else {
                    entry.failed += 1;
                }
            }

            let env = Envelope {
                items,
                summary: Summary {
                    totals: Totals {
                        items: passed + failed,
                        passed,
                        failed,
                    },
                    by_type,
                },
                version: "1.0",
            };
            let rendered = serde_json::to_string_pretty(&env).expect("json should serialize");
            println!("{rendered}");
            if failed > 0 {
                return silent_fail();
            }
            return Ok(());
        }

        if failed == 0 {
            println!("All items valid ({passed} checked)");
            return Ok(());
        }
        eprintln!(
            "Validation failed: {failed} of {} items invalid",
            passed + failed
        );
        for it in &items {
            if it.valid {
                continue;
            }
            eprintln!("- {} {} has issues", it.typ, it.id);
            for issue in &it.issues {
                eprintln!("  - [{}] {}: {}", issue.level, issue.path, issue.message);
            }
        }
        return silent_fail();
    }

    let item = item.expect("checked");
    let spool_path = rt.spool_path();

    let explicit = typ.as_deref();
    let resolved_type = match explicit {
        Some("change") | Some("spec") | Some("module") => explicit.unwrap().to_string(),
        Some(_) => {
            return fail("Invalid type. Expected 'change', 'spec', or 'module'.");
        }
        None => detect_item_type(rt, &item),
    };

    // Special-case: TS `--type module <id>` behaves like validating a spec by id.
    if resolved_type == "module" {
        let report = validate_spec_by_id_or_enoent(spool_path, &item, strict);
        let ok = render_validate_result("spec", &item, report, want_json);
        if !ok {
            return silent_fail();
        }
        return Ok(());
    }

    if resolved_type == "ambiguous" {
        return fail(format!(
            "Ambiguous item '{item}' matches both a change and a spec.\nUse --type change or --type spec to disambiguate."
        ));
    }

    match resolved_type.as_str() {
        "spec" => {
            let spec_path = core_paths::spec_markdown_path(spool_path, &item);
            if !spec_path.exists() {
                let candidates = list_spec_ids(rt);
                let suggestions = nearest_matches(&item, &candidates, 5);
                return fail(unknown_with_suggestions("spec", &item, &suggestions));
            }
            let report =
                core_validate::validate_spec(spool_path, &item, strict).map_err(to_cli_error)?;
            let ok = render_validate_result("spec", &item, report, want_json);
            if !ok {
                return silent_fail();
            }
            Ok(())
        }
        "change" => {
            let proposal = core_paths::change_dir(spool_path, &item).join("proposal.md");
            if !proposal.exists() {
                let candidates = list_change_ids(rt);
                let suggestions = nearest_matches(&item, &candidates, 5);
                return fail(unknown_with_suggestions("change", &item, &suggestions));
            }
            let report =
                core_validate::validate_change(spool_path, &item, strict).map_err(to_cli_error)?;
            let ok = render_validate_result("change", &item, report, want_json);
            if !ok {
                return silent_fail();
            }
            Ok(())
        }
        _ => {
            // unknown
            let candidates = list_candidate_items(rt);
            let suggestions = nearest_matches(&item, &candidates, 5);
            fail(unknown_with_suggestions("item", &item, &suggestions))
        }
    }
}

fn schema_not_found_message(ctx: &ConfigContext, name: &str) -> String {
    let schemas = core_workflow::list_available_schemas(ctx);
    let mut msg = format!("Schema '{name}' not found");
    if !schemas.is_empty() {
        msg.push_str(&format!(". Available schemas:\n  {}", schemas.join("\n  ")));
    }
    msg
}

fn unknown_with_suggestions(kind: &str, item: &str, suggestions: &[String]) -> String {
    let mut msg = format!("Unknown {kind} '{item}'");
    if !suggestions.is_empty() {
        msg.push_str(&format!("\nDid you mean: {}?", suggestions.join(", ")));
    }
    msg
}

fn handle_validate_module(rt: &Runtime, args: &[String]) -> CliResult<()> {
    // TS prints a spinner line even in non-interactive environments.
    eprintln!("- Validating module...");
    let module_id = last_positional(args);
    if module_id.is_none() {
        return fail(
            "Nothing to validate. Try one of:\n  spool validate module <module-id>\nOr run in an interactive terminal.",
        );
    }
    let module_id = module_id.expect("checked");

    let spool_path = rt.spool_path();

    let (full_name, report) =
        core_validate::validate_module(spool_path, &module_id, false).map_err(to_cli_error)?;
    if report.valid {
        println!("Module '{full_name}' is valid");
        return Ok(());
    }

    let mut msg = format!("Module '{full_name}' has issues\n");
    msg.push_str(&diagnostics::render_validation_issues(&report.issues));
    fail(msg)
}

fn validate_spec_by_id_or_enoent(
    spool_path: &std::path::Path,
    spec_id: &str,
    strict: bool,
) -> core_validate::ValidationReport {
    let path = core_paths::spec_markdown_path(spool_path, spec_id);
    match spool_core::io::read_to_string_std(&path) {
        Ok(md) => core_validate::validate_spec_markdown(&md, strict),
        Err(e) => core_validate::ValidationReport::new(
            vec![core_validate::error("file", format!("ENOENT: {e}"))],
            strict,
        ),
    }
}

fn render_validate_result(
    typ: &str,
    id: &str,
    report: core_validate::ValidationReport,
    want_json: bool,
) -> bool {
    if want_json {
        // Match TS validate JSON envelope for single-item validation.
        #[derive(serde::Serialize)]
        struct Item<'a> {
            id: &'a str,
            #[serde(rename = "type")]
            typ: &'a str,
            valid: bool,
            issues: Vec<core_validate::ValidationIssue>,
            #[serde(rename = "durationMs")]
            duration_ms: u32,
        }
        #[derive(serde::Serialize)]
        struct Totals {
            items: u32,
            passed: u32,
            failed: u32,
        }
        #[derive(serde::Serialize)]
        struct ByType {
            items: u32,
            passed: u32,
            failed: u32,
        }
        #[derive(serde::Serialize)]
        struct Summary {
            totals: Totals,
            #[serde(rename = "byType")]
            by_type: std::collections::BTreeMap<String, ByType>,
        }
        #[derive(serde::Serialize)]
        struct Envelope<'a> {
            items: Vec<Item<'a>>,
            summary: Summary,
            version: &'static str,
        }

        let passed = if report.valid { 1 } else { 0 };
        let failed = if report.valid { 0 } else { 1 };
        let mut by_type = std::collections::BTreeMap::new();
        by_type.insert(
            typ.to_string(),
            ByType {
                items: 1,
                passed,
                failed,
            },
        );

        let env = Envelope {
            items: vec![Item {
                id,
                typ,
                valid: report.valid,
                issues: report.issues.clone(),
                duration_ms: 1,
            }],
            summary: Summary {
                totals: Totals {
                    items: 1,
                    passed,
                    failed,
                },
                by_type,
            },
            version: "1.0",
        };
        let rendered = serde_json::to_string_pretty(&env).expect("json should serialize");
        println!("{rendered}");
        return report.valid;
    }

    let label = if typ == "spec" {
        "Specification"
    } else if typ == "change" {
        "Change"
    } else {
        "Item"
    };

    if report.valid {
        println!("{label} '{id}' is valid");
        return true;
    }

    eprintln!("{label} '{id}' has issues");
    for issue in &report.issues {
        eprintln!("✗ [{}] {}: {}", issue.level, issue.path, issue.message);
    }

    // Minimal next steps matching TS for spec validation.
    if typ == "spec" {
        eprintln!("Next steps:");
        eprintln!("  - Ensure spec includes ## Purpose and ## Requirements sections");
        eprintln!("  - Each requirement MUST include at least one #### Scenario: block");
        eprintln!("  - Re-run with --json to see structured report");
    }

    false
}

fn detect_item_type(rt: &Runtime, item: &str) -> String {
    let spool_path = rt.spool_path();
    let idx = rt.repo_index();

    let is_change = idx.change_dir_names.iter().any(|n| n == item)
        && core_paths::change_dir(spool_path, item)
            .join("proposal.md")
            .exists();
    let is_spec = idx.spec_dir_names.iter().any(|n| n == item)
        && core_paths::spec_markdown_path(spool_path, item).exists();
    match (is_change, is_spec) {
        (true, true) => "ambiguous".to_string(),
        (true, false) => "change".to_string(),
        (false, true) => "spec".to_string(),
        _ => "unknown".to_string(),
    }
}

fn list_spec_ids(rt: &Runtime) -> Vec<String> {
    list_spec_ids_from_index(rt.spool_path(), rt.repo_index())
}

fn list_change_ids(rt: &Runtime) -> Vec<String> {
    list_change_ids_from_index(rt.spool_path(), rt.repo_index())
}

fn list_candidate_items(rt: &Runtime) -> Vec<String> {
    let mut items = list_spec_ids(rt);
    items.extend(list_change_ids(rt));
    items
}

fn list_spec_ids_from_index(
    spool_path: &Path,
    idx: &spool_core::repo_index::RepoIndex,
) -> Vec<String> {
    let specs_dir = core_paths::specs_dir(spool_path);
    let mut ids: Vec<String> = Vec::new();
    for id in &idx.spec_dir_names {
        if specs_dir.join(id).join("spec.md").exists() {
            ids.push(id.clone());
        }
    }
    ids.sort();
    ids
}

fn list_change_ids_from_index(
    spool_path: &Path,
    idx: &spool_core::repo_index::RepoIndex,
) -> Vec<String> {
    let mut ids: Vec<String> = Vec::new();
    for name in &idx.change_dir_names {
        if core_paths::change_dir(spool_path, name)
            .join("proposal.md")
            .exists()
        {
            ids.push(name.clone());
        }
    }
    ids.sort();
    ids
}

fn parse_string_flag(args: &[String], key: &str) -> Option<String> {
    let mut iter = args.iter();
    while let Some(a) = iter.next() {
        if a == key {
            return iter.next().cloned();
        }
        if let Some(v) = a.strip_prefix(&format!("{key}=")) {
            return Some(v.to_string());
        }
    }
    None
}

fn split_csv(raw: &str) -> Vec<String> {
    raw.split(',').map(|s| s.trim().to_string()).collect()
}

fn last_positional(args: &[String]) -> Option<String> {
    let mut last: Option<String> = None;
    let mut skip_next = false;
    for a in args {
        if skip_next {
            skip_next = false;
            continue;
        }
        if a == "--type"
            || a == "--sort"
            || a == "--module"
            || a == "--concurrency"
            || a == "--requirement"
            || a == "--tools"
            || a == "-r"
        {
            skip_next = true;
            continue;
        }
        if a.starts_with('-') {
            continue;
        }
        last = Some(a.clone());
    }
    last
}

#[derive(Debug, serde::Serialize)]
struct ModulesResponse {
    modules: Vec<spool_core::list::ModuleListItem>,
}

#[derive(Debug, serde::Serialize)]
struct ChangesResponse {
    changes: Vec<spool_core::list::ChangeListItem>,
}

#[derive(Debug, serde::Serialize)]
struct SpecsResponse {
    specs: Vec<spool_core::list::SpecListItem>,
}

fn parse_sort_order(args: &[String]) -> Option<&str> {
    let mut iter = args.iter();
    while let Some(a) = iter.next() {
        if a == "--sort" {
            return iter.next().map(|s| s.as_str());
        }
        if let Some(v) = a.strip_prefix("--sort=") {
            return Some(v);
        }
    }
    None
}

fn format_task_status(total: u32, completed: u32) -> String {
    if total == 0 {
        return "No tasks".to_string();
    }
    if total == completed {
        return "\u{2713} Complete".to_string();
    }
    format!("{completed}/{total} tasks")
}

fn format_relative_time(then: DateTime<Utc>) -> String {
    let now = Utc::now();
    let diff = now.signed_duration_since(then);
    let secs = diff.num_seconds();
    if secs <= 0 {
        return "just now".to_string();
    }
    let mins = diff.num_minutes();
    let hours = diff.num_hours();
    let days = diff.num_days();

    if days > 30 {
        // Node's `toLocaleDateString()` is locale-dependent; in our parity harness
        // environment it renders as M/D/YYYY.
        return then.format("%-m/%-d/%Y").to_string();
    }

    if days > 0 {
        format!("{days}d ago")
    } else if hours > 0 {
        format!("{hours}h ago")
    } else if mins > 0 {
        format!("{mins}m ago")
    } else {
        "just now".to_string()
    }
}
