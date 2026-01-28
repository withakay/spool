use chrono::{DateTime, Utc};
use miette::Result;
use spool_core::config::ConfigContext;
use spool_core::installers::{install_default_templates, InitOptions, InstallMode};
use spool_core::spool_dir::get_spool_path;
use spool_core::{
    create as core_create, r#match::nearest_matches, show as core_show, validate as core_validate,
    workflow as core_workflow,
};
use spool_workflow::planning as wf_planning;
use spool_workflow::state as wf_state;
use spool_workflow::tasks as wf_tasks;
use spool_workflow::workflow as wf_workflow;
use std::collections::BTreeSet;
use std::path::Path;

const HELP: &str = "Usage: spool [options] [command]\n\nAI-native system for spec-driven development\n\nOptions:\n  -V, --version                    output the version number\n  --no-color                       Disable color output\n  -h, --help                       display help for command\n\nCommands:\n  init [options] [path]            Initialize Spool in your project\n  update [options] [path]          Update Spool instruction files\n  tasks                            Track execution tasks for a change\n  plan                             Project planning tools\n  state                            View and update planning/STATE.md\n  workflow                         Manage and run workflows\n  list [options]                   List items (changes by default). Use --specs\n                                   or --modules to list other items.\n  dashboard                        Display an interactive dashboard of specs and\n                                   changes\n  archive [options] [change-name]  Archive a completed change and update main\n                                   specs\n  config [options]                 View and modify global Spool configuration\n  create                           Create items\n  validate [options] [item-name]   Validate changes, specs, and modules\n  show [options] [item-name]       Show a change or spec\n  completions                      Manage shell completions for Spool CLI\n  status [options]                 [Experimental] Display artifact completion\n                                   status for a change\n  x-templates [options]            [Experimental] Show resolved template paths\n                                   for all artifacts in a schema\n  x-schemas [options]              [Experimental] List available workflow\n                                   schemas with descriptions\n  agent                            Commands that generate machine-readable\n                                   output for AI agents\n  ralph [options] [prompt]         Run iterative AI loop against a change\n                                   proposal\n  split [change-id]                Split a large change into smaller changes\n  help [command]                   display help for command";

fn main() -> Result<()> {
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

    match args.first().map(|s| s.as_str()) {
        Some("create") => {
            handle_create(&args[1..]);
            return Ok(());
        }
        Some("new") => {
            handle_new(&args[1..]);
            return Ok(());
        }
        Some("init") => {
            handle_init(&args[1..]);
            return Ok(());
        }
        Some("update") => {
            handle_update(&args[1..]);
            return Ok(());
        }
        Some("list") => {
            handle_list(&args[1..]);
            return Ok(());
        }
        Some("plan") => {
            handle_plan(&args[1..]);
            return Ok(());
        }
        Some("state") => {
            handle_state(&args[1..]);
            return Ok(());
        }
        Some("tasks") => {
            handle_tasks(&args[1..]);
            return Ok(());
        }
        Some("workflow") => {
            handle_workflow(&args[1..]);
            return Ok(());
        }
        Some("status") => {
            handle_status(&args[1..]);
            return Ok(());
        }
        Some("templates") | Some("x-templates") => {
            handle_templates(&args[1..]);
            return Ok(());
        }
        Some("instructions") => {
            handle_instructions(&args[1..]);
            return Ok(());
        }
        Some("agent") => {
            handle_agent(&args[1..]);
            return Ok(());
        }
        Some("x-instructions") => {
            handle_x_instructions(&args[1..]);
            return Ok(());
        }
        Some("show") => {
            handle_show(&args[1..]);
            return Ok(());
        }
        Some("validate") => {
            handle_validate(&args[1..]);
            return Ok(());
        }
        _ => {}
    }

    // Temporary fallback for unimplemented commands.
    println!("{HELP}");
    Ok(())
}

const LIST_HELP: &str = "Usage: spool list [options]\n\nList items (changes by default). Use --specs or --modules to list other items.\n\nOptions:\n  --specs         List specs instead of changes\n  --changes       List changes explicitly (default)\n  --modules       List modules instead of changes\n  --sort <order>  Sort order: \"recent\" (default) or \"name\" (default: \"recent\")\n  --json          Output as JSON (for programmatic use)\n  -h, --help      display help for command";

const INIT_HELP: &str = "Usage: spool init [options] [path]\n\nInitialize Spool in your project\n\nOptions:\n  --tools <tools>    Configure AI tools non-interactively (all, none, or comma-separated ids)\n  -f, --force        Overwrite existing tool files without prompting\n  -h, --help         display help for command";

const UPDATE_HELP: &str = "Usage: spool update [options] [path]\n\nUpdate Spool instruction files\n\nOptions:\n  --json          Output as JSON\n  -h, --help      display help for command";

const TASKS_HELP: &str = "Usage: spool tasks <command> [options]\n\nTrack execution tasks for a change\n\nCommands:\n  init <change-id>                         Create enhanced tasks.md\n  status <change-id>                       Show task progress\n  next <change-id>                         Show the next available task\n  start <change-id> <task-id>              Mark a task in-progress\n  complete <change-id> <task-id>           Mark a task complete\n  add <change-id> <task-name> [--wave <n>]  Add a new task (enhanced only)\n  show <change-id>                         Print tasks.md\n\nOptions:\n  --wave <n>                               Wave number for add (default: 1)\n  -h, --help                               display help for command";

const PLAN_HELP: &str = "Usage: spool plan <command> [options]\n\nProject planning tools\n\nCommands:\n  init                           Initialize planning structure\n  status                         Show current milestone progress\n\nOptions:\n  -h, --help                     display help for command";

const STATE_HELP: &str = "Usage: spool state <command> [options]\n\nView and update planning/STATE.md\n\nCommands:\n  show                            Show current project state\n  decision <text>                 Record a decision\n  blocker <text>                  Record a blocker\n  note <text>                     Add a session note\n  focus <text>                    Set current focus\n  question <text>                 Add an open question\n\nOptions:\n  -h, --help                      display help for command";

const WORKFLOW_HELP: &str = "Usage: spool workflow <command> [options]\n\nManage and run workflows\n\nCommands:\n  init                            Initialize workflow templates\n  list                            List available workflows\n  show <workflow-name>            Show workflow details\n\nOptions:\n  -h, --help                      display help for command";

fn handle_state(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{STATE_HELP}");
        return;
    }

    fn fail(msg: &str) -> ! {
        eprintln!();
        eprintln!("✖ Error: {msg}");
        std::process::exit(1);
    }

    let sub = args.first().map(|s| s.as_str()).unwrap_or("");
    let text = args.iter().skip(1).cloned().collect::<Vec<_>>().join(" ");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(Path::new("."), &ctx);
    let spool_dir = spool_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| ".spool".to_string());
    let state_path = spool_path.join("planning").join("STATE.md");
    if !state_path.exists() {
        fail(&format!(
            "STATE.md not found. Run \"spool init\" first or create {}/planning/STATE.md",
            spool_dir
        ));
    }

    if sub == "show" {
        let Ok(contents) = std::fs::read_to_string(&state_path) else {
            fail("Failed to read STATE.md");
        };
        print!("{contents}");
        return;
    }

    if text.trim().is_empty() {
        fail("Missing required text");
    }

    let Ok(contents) = std::fs::read_to_string(&state_path) else {
        fail("Failed to read STATE.md");
    };
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
        Err(e) => fail(&e),
    };

    if let Err(e) = std::fs::write(&state_path, updated) {
        fail(&e.to_string());
    }

    match sub {
        "decision" => eprintln!("✔ Decision recorded: {text}"),
        "blocker" => eprintln!("✔ Blocker recorded: {text}"),
        "note" => eprintln!("✔ Note recorded: {text}"),
        "focus" => eprintln!("✔ Focus updated: {text}"),
        "question" => eprintln!("✔ Question added: {text}"),
        _ => {}
    }
}

fn handle_workflow(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{WORKFLOW_HELP}");
        return;
    }

    fn fail(msg: &str) -> ! {
        eprintln!();
        eprintln!("✖ Error: {msg}");
        std::process::exit(1);
    }

    let sub = args.first().map(|s| s.as_str()).unwrap_or("");
    let wf_name = args.get(1).map(|s| s.as_str()).unwrap_or("");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(Path::new("."), &ctx);

    match sub {
        "init" => {
            if let Err(e) = wf_workflow::init_workflow_structure(&spool_path) {
                fail(&e.to_string());
            }
            println!("Created workflows directory with example workflows:");
            println!("  - research.yaml  (domain investigation)");
            println!("  - execute.yaml   (task execution)");
            println!("  - review.yaml    (adversarial review)");
            println!();
            println!("Prompt templates are installed via `spool init`.");
        }
        "list" => {
            let workflows = wf_workflow::list_workflows(&spool_path);
            if workflows.is_empty() {
                println!("No workflows found. Run `spool workflow init` to create examples.");
                return;
            }
            println!("Available workflows:");
            println!();
            for name in workflows {
                match wf_workflow::load_workflow(&spool_path, &name) {
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
        }
        "show" => {
            if wf_name.is_empty() || wf_name.starts_with('-') {
                fail("Missing required argument <workflow-name>");
            }
            let wf = wf_workflow::load_workflow(&spool_path, wf_name)
                .map_err(|e| format!("Invalid workflow: {e}"))
                .unwrap_or_else(|e| fail(&e));

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
        }
        _ => {
            fail(&format!("Unknown workflow subcommand '{sub}'"));
        }
    }
}

fn handle_plan(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{PLAN_HELP}");
        return;
    }

    fn fail(msg: &str) -> ! {
        eprintln!();
        eprintln!("✖ Error: {msg}");
        std::process::exit(1);
    }

    let sub = args.first().map(|s| s.as_str()).unwrap_or("");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(Path::new("."), &ctx);
    let spool_dir = spool_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| ".spool".to_string());
    let current_date = chrono::Local::now().format("%Y-%m-%d").to_string();

    match sub {
        "init" => {
            if let Err(e) =
                wf_planning::init_planning_structure(&spool_path, &current_date, &spool_dir)
            {
                fail(&e.to_string());
            }
            eprintln!("✔ Planning structure initialized");
            println!("Created:");
            println!("  - {}/planning/PROJECT.md", spool_dir);
            println!("  - {}/planning/ROADMAP.md", spool_dir);
            println!("  - {}/planning/STATE.md", spool_dir);
        }
        "status" => {
            let roadmap_path = wf_planning::planning_dir(&spool_path).join("ROADMAP.md");
            let Ok(contents) = std::fs::read_to_string(&roadmap_path) else {
                fail("ROADMAP.md not found. Run \"spool init\" or \"spool plan init\" first.");
            };
            let Some((milestone, status, phase)) = wf_planning::read_current_progress(&contents)
            else {
                fail("Could not find current milestone section in ROADMAP.md");
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
        }
        _ => {
            fail(&format!("Unknown plan subcommand '{sub}'"));
        }
    }
}

fn handle_tasks(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{TASKS_HELP}");
        return;
    }

    fn fail(msg: &str) -> ! {
        eprintln!();
        eprintln!("✖ Error: {msg}");
        std::process::exit(1);
    }

    fn parse_wave_flag(args: &[String]) -> u32 {
        let mut i = 0;
        while i < args.len() {
            if args[i] == "--wave" {
                if let Some(v) = args.get(i + 1) {
                    if let Ok(n) = v.parse::<u32>() {
                        return n;
                    }
                }
                return 1;
            }
            i += 1;
        }
        1
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
        fail("Missing required argument <change-id>");
    }

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(Path::new("."), &ctx);
    let change_dir = spool_path.join("changes").join(change_id);

    match sub {
        "init" => {
            if !change_dir.exists() {
                fail(&format!("Change '{change_id}' not found"));
            }
            let path = wf_tasks::tasks_path(&spool_path, change_id);
            if path.exists() {
                fail(&format!(
                    "tasks.md already exists for \"{change_id}\". Use \"tasks add\" to add tasks."
                ));
            }

            let now = chrono::Local::now();
            let contents = wf_tasks::enhanced_tasks_template(change_id, now);
            if let Some(parent) = path.parent() {
                if let Err(e) = std::fs::create_dir_all(parent) {
                    eprintln!("✖ Error: {e}");
                    std::process::exit(1);
                }
            }
            if let Err(e) = std::fs::write(&path, contents) {
                fail(&e.to_string());
            }
            eprintln!("✔ Enhanced tasks.md created for \"{change_id}\"");
        }
        "status" => {
            let path = wf_tasks::tasks_path(&spool_path, change_id);
            if !path.exists() {
                println!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                );
                return;
            }

            let Ok(contents) = std::fs::read_to_string(&path) else {
                fail(&format!("Failed to read {}", path.display()));
            };

            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);

            println!("Tasks for: {change_id}");
            println!("──────────────────────────────────────────────────");
            println!();

            let mut errors: Vec<&wf_tasks::TaskDiagnostic> = Vec::new();
            let mut warnings: Vec<&wf_tasks::TaskDiagnostic> = Vec::new();
            for d in &parsed.diagnostics {
                match d.level {
                    wf_tasks::DiagnosticLevel::Error => errors.push(d),
                    wf_tasks::DiagnosticLevel::Warning => warnings.push(d),
                }
            }

            if !errors.is_empty() {
                println!("Errors");
                for d in &errors {
                    if let Some(id) = &d.task_id {
                        println!("- {id}: {}", d.message);
                    } else {
                        println!("- {}", d.message);
                    }
                }
                println!();
            }

            if !warnings.is_empty() {
                println!("Warnings");
                for d in &warnings {
                    if let Some(id) = &d.task_id {
                        println!("- {id}: {}", d.message);
                    } else {
                        println!("- {}", d.message);
                    }
                }
                println!();
            }

            match parsed.format {
                wf_tasks::TasksFormat::Enhanced => {
                    println!(
                        "Progress: {}/{} complete, {} in-progress, {} pending",
                        parsed.progress.complete,
                        parsed.progress.total,
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

            if !errors.is_empty() {
                println!();
                println!("Readiness unavailable until errors are fixed.");
                return;
            }

            let (ready, blocked) = wf_tasks::compute_ready_and_blocked(&parsed.tasks);
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
        }
        "next" => {
            let path = wf_tasks::tasks_path(&spool_path, change_id);
            let Ok(contents) = std::fs::read_to_string(&path) else {
                fail(&format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ));
            };
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);

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
                }
                wf_tasks::TasksFormat::Enhanced => {
                    if parsed.progress.remaining == 0 {
                        println!("All tasks complete!");
                        return;
                    }

                    let (ready, blocked) = wf_tasks::compute_ready_and_blocked(&parsed.tasks);
                    if ready.is_empty() {
                        println!("No ready tasks.");
                        if let Some((t, blockers)) = blocked.first() {
                            println!("First blocked task: {} - {}", t.id, t.name);
                            println!("{}", format_blockers(blockers));
                        }
                        return;
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
                }
            }
        }
        "start" => {
            let task_id = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if task_id.is_empty() || task_id.starts_with('-') {
                fail("Missing required argument <task-id>");
            }
            let path = wf_tasks::tasks_path(&spool_path, change_id);
            let Ok(contents) = std::fs::read_to_string(&path) else {
                fail(&format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ));
            };
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);
            if parsed.format == wf_tasks::TasksFormat::Checkbox {
                fail("Checkbox-only tasks.md does not support in-progress. Use \"spool tasks complete\" when done.");
            }
            if let Some(first_err) = parsed
                .diagnostics
                .iter()
                .find(|d| d.level == wf_tasks::DiagnosticLevel::Error)
            {
                if let Some(id) = &first_err.task_id {
                    fail(&format!("{id}: {}", first_err.message));
                }
                fail(&first_err.message);
            }

            let Some(task) = parsed.tasks.iter().find(|t| t.id == task_id) else {
                fail(&format!("Task \"{task_id}\" not found in tasks.md"));
            };
            let status_label = match task.status {
                wf_tasks::TaskStatus::Pending => "pending",
                wf_tasks::TaskStatus::InProgress => "in_progress",
                wf_tasks::TaskStatus::Complete => "complete",
            };
            if task.status != wf_tasks::TaskStatus::Pending {
                fail(&format!(
                    "Task \"{task_id}\" is not pending (current: {status_label})"
                ));
            }

            let (ready, blocked) = wf_tasks::compute_ready_and_blocked(&parsed.tasks);
            if !ready.iter().any(|t| t.id == task_id) {
                if let Some((_, blockers)) = blocked.iter().find(|(t, _)| t.id == task_id) {
                    fail(&format_blockers(blockers));
                }
                fail("Task is blocked");
            }

            let updated = wf_tasks::update_enhanced_task_status(
                &contents,
                task_id,
                wf_tasks::TaskStatus::InProgress,
            );
            if let Err(e) = std::fs::write(&path, updated) {
                fail(&e.to_string());
            }
            eprintln!("✔ Task \"{task_id}\" marked as in-progress");
        }
        "complete" => {
            let task_id = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if task_id.is_empty() || task_id.starts_with('-') {
                fail("Missing required argument <task-id>");
            }
            let path = wf_tasks::tasks_path(&spool_path, change_id);
            let Ok(contents) = std::fs::read_to_string(&path) else {
                fail(&format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ));
            };
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);
            if parsed.format == wf_tasks::TasksFormat::Checkbox {
                // 1-based index
                let Ok(idx) = task_id.parse::<usize>() else {
                    fail(&format!("Task \"{task_id}\" not found"));
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
                        if let Some(rest) = t.splitn(2, "]").nth(1) {
                            let prefix = if t.starts_with('*') { "* [x]" } else { "- [x]" };
                            *line = format!("{}{}", prefix, rest);
                        }
                        break;
                    }
                }
                if count < idx {
                    fail(&format!("Task \"{task_id}\" not found"));
                }
                let mut out = lines.join("\n");
                out.push('\n');
                if let Err(e) = std::fs::write(&path, out) {
                    fail(&e.to_string());
                }
                eprintln!("✔ Task \"{task_id}\" marked as complete");
                return;
            }

            if let Some(first_err) = parsed
                .diagnostics
                .iter()
                .find(|d| d.level == wf_tasks::DiagnosticLevel::Error)
            {
                if let Some(id) = &first_err.task_id {
                    fail(&format!("{id}: {}", first_err.message));
                }
                fail(&first_err.message);
            }

            let updated = wf_tasks::update_enhanced_task_status(
                &contents,
                task_id,
                wf_tasks::TaskStatus::Complete,
            );
            if let Err(e) = std::fs::write(&path, updated) {
                fail(&e.to_string());
            }
            eprintln!("✔ Task \"{task_id}\" marked as complete");
        }
        "add" => {
            let task_name = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if task_name.is_empty() || task_name.starts_with('-') {
                fail("Missing required argument <task-name>");
            }
            let wave = parse_wave_flag(args);
            let path = wf_tasks::tasks_path(&spool_path, change_id);
            let Ok(contents) = std::fs::read_to_string(&path) else {
                fail(&format!(
                    "No tasks.md found for \"{change_id}\". Run \"spool tasks init {change_id}\" first."
                ));
            };
            let parsed = wf_tasks::parse_tasks_tracking_file(&contents);
            if parsed.format != wf_tasks::TasksFormat::Enhanced {
                fail("Cannot add tasks to checkbox-only tracking file. Convert to enhanced format first.");
            }
            if let Some(first_err) = parsed
                .diagnostics
                .iter()
                .find(|d| d.level == wf_tasks::DiagnosticLevel::Error)
            {
                if let Some(id) = &first_err.task_id {
                    fail(&format!("{id}: {}", first_err.message));
                }
                fail(&first_err.message);
            }

            let mut max_n = 0u32;
            for t in &parsed.tasks {
                if let Some((w, n)) = t.id.split_once('.') {
                    if let (Ok(w), Ok(n)) = (w.parse::<u32>(), n.parse::<u32>()) {
                        if w == wave {
                            max_n = max_n.max(n);
                        }
                    }
                }
            }
            let new_id = format!("{wave}.{}", max_n + 1);

            let block = format!(
                "\n### Task {new_id}: {task_name}\n- **Files**: `path/to/file.ts`\n- **Dependencies**: None\n- **Action**:\n  [Describe what needs to be done]\n- **Verify**: `[command to verify, e.g., npm test]`\n- **Done When**: [Success criteria]\n- **Status**: [ ] pending\n"
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
                    out.insert_str(pos, &format!("\n---\n\n## Wave {wave}\n"));
                    let pos2 = out.find("## Checkpoints").unwrap_or(out.len());
                    out.insert_str(pos2, &block);
                } else {
                    out.push_str(&format!("\n---\n\n## Wave {wave}\n"));
                    out.push_str(&block);
                }
            }

            if let Err(e) = std::fs::write(&path, out) {
                fail(&e.to_string());
            }
            eprintln!("✔ Task {new_id} \"{task_name}\" added to Wave {wave}");
        }
        "show" => {
            let path = wf_tasks::tasks_path(&spool_path, change_id);
            let Ok(contents) = std::fs::read_to_string(&path) else {
                fail(&format!("tasks.md not found for \"{change_id}\""));
            };
            print!("{contents}");
        }
        _ => {
            fail(&format!("Unknown tasks subcommand '{sub}'"));
        }
    }
}

const CREATE_HELP: &str = "Usage: spool create <type> [options]\n\nCreate items\n\nTypes:\n  module <name>                 Create a module\n  change <name>                 Create a change\n\nOptions:\n  --schema <name>               Workflow schema name (default: spec-driven)\n  --module <id>                 Module id (default: 000)\n  --description <text>          Description (writes README.md)\n  --scope <capabilities>        Module scope (comma-separated, default: \"*\")\n  --depends-on <modules>        Module dependencies (comma-separated module ids)\n  -h, --help                    display help for command";

const NEW_HELP: &str = "Usage: spool new <type> [options]\n\n[Experimental] Create new items\n\nTypes:\n  change <name>                 Create a change\n\nOptions:\n  --schema <name>               Workflow schema name (default: spec-driven)\n  --module <id>                 Module id (default: 000)\n  --description <text>          Description (writes README.md)\n  -h, --help                    display help for command";

const STATUS_HELP: &str = "Usage: spool status [options]\n\n[Experimental] Display artifact completion status for a change\n\nOptions:\n  --change <name>               Change id (directory name)\n  --schema <name>               Workflow schema name\n  --json                         Output as JSON\n  -h, --help                     display help for command";

const TEMPLATES_HELP: &str = "Usage: spool templates [options]\n\n[Experimental] Show resolved template paths for all artifacts in a schema\n\nOptions:\n  --schema <name>               Workflow schema name (default: spec-driven)\n  --json                         Output as JSON\n  -h, --help                     display help for command";

const INSTRUCTIONS_HELP: &str = "Usage: spool instructions <artifact> [options]\n\n[Experimental] Show instructions for generating an artifact\n\nOptions:\n  --change <name>               Change id (directory name)\n  --schema <name>               Workflow schema name\n  --json                         Output as JSON\n  -h, --help                     display help for command";

const AGENT_HELP: &str = "Usage: spool agent [command] [options]\n\nCommands that generate machine-readable output for AI agents\n\nCommands:\n  instruction <artifact> [options]   Generate enriched instructions\n\nOptions:\n  -h, --help                         display help for command";

const AGENT_INSTRUCTION_HELP: &str = "Usage: spool agent instruction <artifact> [options]\n\nGenerate enriched instructions\n\nOptions:\n  --change <name>               Change id (directory name)\n  --schema <name>               Workflow schema name\n  --json                         Output as JSON\n  -h, --help                     display help for command";

fn handle_create(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{CREATE_HELP}");
        return;
    }

    let Some(kind) = args.first().map(|s| s.as_str()) else {
        eprintln!("✖ Error: Missing required argument <type>");
        std::process::exit(1);
    };

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    match kind {
        "module" => {
            let name = args.get(1).map(|s| s.as_str()).unwrap_or("");
            if name.is_empty() || name.starts_with('-') {
                eprintln!("✖ Error: Missing required argument <name>");
                std::process::exit(1);
            }
            let scope = parse_string_flag(args, "--scope")
                .map(|raw| split_csv(&raw))
                .unwrap_or_else(|| vec!["*".to_string()]);
            let depends_on = parse_string_flag(args, "--depends-on")
                .map(|raw| split_csv(&raw))
                .unwrap_or_default();

            match core_create::create_module(&spool_path, name, scope, depends_on) {
                Ok(r) => {
                    if !r.created {
                        println!("Module \"{}\" already exists as {}", name, r.folder_name);
                        return;
                    }
                    println!("Created module: {}", r.folder_name);
                    println!("  Path: {}", r.module_dir.display());
                    println!("  Edit: spool/modules/{}/module.md", r.folder_name);
                }
                Err(e) => {
                    eprintln!("✖ Error: {e}");
                    std::process::exit(1);
                }
            }
        }
        "change" => {
            let name = args.get(1).map(|s| s.as_str()).unwrap_or("");
            if name.is_empty() || name.starts_with('-') {
                eprintln!("✖ Error: Missing required argument <name>");
                std::process::exit(1);
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
                &spool_path,
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
                }
                Err(e) => {
                    eprintln!("✖ Error: {e}");
                    std::process::exit(1);
                }
            }
        }
        _ => {
            eprintln!("✖ Error: Unknown create type '{kind}'");
            std::process::exit(1);
        }
    }
}

fn handle_new(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{NEW_HELP}");
        return;
    }

    let Some(kind) = args.first().map(|s| s.as_str()) else {
        eprintln!("✖ Error: Missing required argument <type>");
        std::process::exit(1);
    };
    if kind != "change" {
        eprintln!("✖ Error: Unknown new type '{kind}'");
        std::process::exit(1);
    }

    let name = args.get(1).map(|s| s.as_str()).unwrap_or("");
    if name.is_empty() || name.starts_with('-') {
        eprintln!("✖ Error: Missing required argument <name>");
        std::process::exit(1);
    }

    let schema_opt = parse_string_flag(args, "--schema");
    let schema = schema_opt
        .clone()
        .unwrap_or_else(|| core_workflow::default_schema_name().to_string());
    let module = parse_string_flag(args, "--module");
    let description = parse_string_flag(args, "--description");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

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
        &spool_path,
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
        }
        Err(e) => {
            eprintln!("✖ Error: {e}");
            std::process::exit(1);
        }
    }
}

fn handle_status(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{STATUS_HELP}");
        return;
    }

    let want_json = args.iter().any(|a| a == "--json");
    let change = parse_string_flag(args, "--change");
    if change.as_deref().unwrap_or("").is_empty() {
        let ctx = ConfigContext::from_process_env();
        let spool_path = get_spool_path(std::path::Path::new("."), &ctx);
        let changes = core_workflow::list_available_changes(&spool_path);
        eprintln!("✖ Error: Missing required option --change");
        if !changes.is_empty() {
            eprintln!("\nAvailable changes:");
            for c in changes {
                eprintln!("  {c}");
            }
        }
        std::process::exit(1);
    }

    let schema = parse_string_flag(args, "--schema");
    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Loading change status...");

    let change = change.expect("checked above");
    let status =
        match core_workflow::compute_change_status(&spool_path, &change, schema.as_deref(), &ctx) {
            Ok(s) => s,
            Err(core_workflow::WorkflowError::InvalidChangeName) => {
                eprintln!("✖ Error: Invalid change name");
                std::process::exit(1);
            }
            Err(core_workflow::WorkflowError::ChangeNotFound(name)) => {
                let changes = core_workflow::list_available_changes(&spool_path);
                eprintln!("✖ Error: Change '{name}' not found");
                if !changes.is_empty() {
                    eprintln!("\nAvailable changes:");
                    for c in changes {
                        eprintln!("  {c}");
                    }
                }
                std::process::exit(1);
            }
            Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
                eprintln!("✖ Error: Schema '{name}' not found");
                std::process::exit(1);
            }
            Err(e) => {
                eprintln!("✖ Error: {e}");
                std::process::exit(1);
            }
        };

    if want_json {
        let rendered = serde_json::to_string_pretty(&status).expect("json should serialize");
        println!("{rendered}");
        return;
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
}

fn handle_templates(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{TEMPLATES_HELP}");
        return;
    }
    let want_json = args.iter().any(|a| a == "--json");
    let schema = parse_string_flag(args, "--schema");

    eprintln!("Warning: \"spool templates\" is deprecated. Use \"spool x-templates\" instead.");

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Loading templates...");

    let ctx = ConfigContext::from_process_env();
    let schema_name = schema
        .clone()
        .unwrap_or_else(|| core_workflow::default_schema_name().to_string());
    let resolved = match core_workflow::resolve_schema(Some(&schema_name), &ctx) {
        Ok(v) => v,
        Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
            let schemas = core_workflow::list_available_schemas(&ctx);
            if schemas.is_empty() {
                eprintln!("✖ Error: Schema '{name}' not found");
            } else {
                eprintln!(
                    "✖ Error: Schema '{name}' not found. Available schemas:\n  {}",
                    schemas.join("\n  ")
                );
            }
            std::process::exit(1);
        }
        Err(e) => {
            eprintln!("✖ Error: {e}");
            std::process::exit(1);
        }
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
        return;
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
}

fn handle_instructions(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{INSTRUCTIONS_HELP}");
        return;
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
        eprintln!("✖ Error: Missing required option --change");
        std::process::exit(1);
    }
    let change = change.expect("checked above");
    let schema = parse_string_flag(args, "--schema");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    let Some(artifact) = artifact else {
        let schema_name = schema
            .clone()
            .unwrap_or_else(|| core_workflow::default_schema_name().to_string());
        eprintln!("✖ Error: Missing required argument <artifact>");
        if let Ok(r) = core_workflow::resolve_schema(Some(&schema_name), &ctx) {
            eprintln!("\nValid artifacts:");
            for a in r.schema.artifacts {
                eprintln!("  {}", a.id);
            }
        }
        std::process::exit(1);
    };

    if artifact == "apply" {
        // Match TS/ora: spinner output is written to stderr.
        eprintln!("- Generating apply instructions...");
        let apply = match core_workflow::compute_apply_instructions(
            &spool_path,
            &change,
            schema.as_deref(),
            &ctx,
        ) {
            Ok(r) => r,
            Err(core_workflow::WorkflowError::InvalidChangeName) => {
                eprintln!("✖ Error: Invalid change name");
                std::process::exit(1);
            }
            Err(core_workflow::WorkflowError::ChangeNotFound(name)) => {
                eprintln!("✖ Error: Change '{name}' not found");
                std::process::exit(1);
            }
            Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
                let schemas = core_workflow::list_available_schemas(&ctx);
                if schemas.is_empty() {
                    eprintln!("✖ Error: Schema '{name}' not found");
                } else {
                    eprintln!(
                        "✖ Error: Schema '{name}' not found. Available schemas:\n  {}",
                        schemas.join("\n  ")
                    );
                }
                std::process::exit(1);
            }
            Err(e) => {
                eprintln!("✖ Error: {e}");
                std::process::exit(1);
            }
        };

        if want_json {
            let rendered = serde_json::to_string_pretty(&apply).expect("json should serialize");
            println!("{rendered}");
            return;
        }

        print_apply_instructions_text(&apply);
        return;
    }

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Generating instructions...");

    let resolved = match core_workflow::resolve_instructions(
        &spool_path,
        &change,
        schema.as_deref(),
        artifact,
        &ctx,
    ) {
        Ok(r) => r,
        Err(core_workflow::WorkflowError::ArtifactNotFound(name)) => {
            let schema_name = schema
                .clone()
                .unwrap_or_else(|| core_workflow::read_change_schema(&spool_path, &change));
            eprintln!("✖ Error: Artifact '{name}' not found in schema '{schema_name}'.");
            if let Ok(r) = core_workflow::resolve_schema(Some(&schema_name), &ctx) {
                eprintln!("\nValid artifacts:");
                for a in r.schema.artifacts {
                    eprintln!("  {}", a.id);
                }
            }
            std::process::exit(1);
        }
        Err(core_workflow::WorkflowError::SchemaNotFound(name)) => {
            let schemas = core_workflow::list_available_schemas(&ctx);
            if schemas.is_empty() {
                eprintln!("✖ Error: Schema '{name}' not found");
            } else {
                eprintln!(
                    "✖ Error: Schema '{name}' not found. Available schemas:\n  {}",
                    schemas.join("\n  ")
                );
            }
            std::process::exit(1);
        }
        Err(e) => {
            eprintln!("✖ Error: {e}");
            std::process::exit(1);
        }
    };

    if want_json {
        let rendered = serde_json::to_string_pretty(&resolved).expect("json should serialize");
        println!("{rendered}");
        return;
    }

    print_artifact_instructions_text(&resolved);
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

    if instructions.state == "blocked" {
        if let Some(missing) = &instructions.missing_artifacts {
            println!("### ⚠️ Blocked");
            println!();
            println!("Missing artifacts: {}", missing.join(", "));
            println!("Use the spool-continue-change skill to create these first.");
            println!();
        }
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
        if let Some(diags) = &instructions.tracks_diagnostics {
            if !diags.is_empty() {
                let errors = diags.iter().filter(|d| d.level == "error").count();
                let warnings = diags.iter().filter(|d| d.level == "warning").count();
                if errors > 0 {
                    println!("- errors: {errors}");
                }
                if warnings > 0 {
                    println!("- warnings: {warnings}");
                }
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

fn handle_agent(args: &[String]) {
    if args.is_empty() || args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{AGENT_HELP}");
        return;
    }
    match args.first().map(|s| s.as_str()) {
        Some("instruction") => handle_agent_instruction(&args[1..]),
        _ => {
            println!("{AGENT_HELP}");
        }
    }
}

fn handle_agent_instruction(args: &[String]) {
    if args.is_empty() || args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{AGENT_INSTRUCTION_HELP}");
        return;
    }
    let want_json = args.iter().any(|a| a == "--json");
    let artifact = args.first().map(|s| s.as_str()).unwrap_or("");
    if artifact.is_empty() || artifact.starts_with('-') {
        eprintln!("✖ Error: Missing required argument <artifact>");
        std::process::exit(1);
    }
    let change = parse_string_flag(args, "--change");
    if change.as_deref().unwrap_or("").is_empty() {
        eprintln!("✖ Error: Missing required option --change");
        std::process::exit(1);
    }
    let change = change.expect("checked above");
    let schema = parse_string_flag(args, "--schema");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    // Match TS/ora: spinner output is written to stderr.
    eprintln!("- Generating instructions...");

    if artifact == "apply" {
        eprintln!("✖ Error: Invalid artifact 'apply'");
        std::process::exit(1);
    }

    let resolved = match core_workflow::resolve_instructions(
        &spool_path,
        &change,
        schema.as_deref(),
        artifact,
        &ctx,
    ) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("✖ Error: {e}");
            std::process::exit(1);
        }
    };

    if want_json {
        let rendered = serde_json::to_string_pretty(&resolved).expect("json should serialize");
        println!("{rendered}");
        return;
    }
    print_artifact_instructions_text(&resolved);
}

fn handle_x_instructions(args: &[String]) {
    eprintln!(
        "Warning: \"spool x-instructions\" is deprecated. Use \"spool agent instruction\" instead."
    );
    handle_agent_instruction(args);
}

fn handle_init(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{INIT_HELP}");
        return;
    }

    let force = args.iter().any(|a| a == "--force" || a == "-f");
    let tools_arg = parse_string_flag(args, "--tools");

    let mut tools: BTreeSet<String> = BTreeSet::new();
    for t in ["claude", "codex", "github-copilot", "opencode"] {
        tools.insert(t.to_string());
    }

    if let Some(raw) = tools_arg.as_deref() {
        let raw = raw.trim();
        if raw.is_empty() {
            eprintln!("✖ Error: --tools cannot be empty");
            std::process::exit(1);
        }

        if raw == "none" {
            tools.clear();
        } else if raw != "all" {
            let mut selected: BTreeSet<String> = BTreeSet::new();
            for part in raw.split(',') {
                let id = part.trim();
                if id.is_empty() {
                    continue;
                }
                match id {
                    "claude" | "codex" | "github-copilot" | "opencode" => {
                        selected.insert(id.to_string());
                    }
                    _ => {
                        eprintln!("✖ Error: Unknown tool id '{id}'");
                        std::process::exit(1);
                    }
                }
            }
            tools = selected;
        }
    }

    // Positional path (defaults to current directory).
    let target = last_positional(args).unwrap_or_else(|| ".".to_string());
    let target_path = std::path::Path::new(&target);
    let ctx = ConfigContext::from_process_env();

    let opts = InitOptions::new(tools, force);
    if let Err(e) = install_default_templates(target_path, &ctx, InstallMode::Init, &opts) {
        eprintln!("✖ Error: {e}");
        std::process::exit(1);
    }
}

fn handle_update(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{UPDATE_HELP}");
        return;
    }

    // `--json` is accepted for parity with TS but not implemented yet.
    let _want_json = args.iter().any(|a| a == "--json");
    let target = last_positional(args).unwrap_or_else(|| ".".to_string());
    let target_path = std::path::Path::new(&target);
    let ctx = ConfigContext::from_process_env();

    let tools: BTreeSet<String> = ["claude", "codex", "github-copilot", "opencode"]
        .into_iter()
        .map(|s| s.to_string())
        .collect();
    let opts = InitOptions::new(tools, true);

    if let Err(e) = install_default_templates(target_path, &ctx, InstallMode::Update, &opts) {
        eprintln!("✖ Error: {e}");
        std::process::exit(1);
    }
}

fn handle_list(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{LIST_HELP}");
        return;
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

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    match mode {
        "modules" => {
            let modules = spool_core::list::list_modules(&spool_path).unwrap_or_default();
            if want_json {
                let payload = ModulesResponse { modules };
                let rendered =
                    serde_json::to_string_pretty(&payload).expect("json should serialize");
                println!("{rendered}");
                return;
            }

            if modules.is_empty() {
                println!("No modules found.");
                println!("Create one with: spool create module <name>");
                return;
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
            let specs = spool_core::list::list_specs(&spool_path).unwrap_or_default();
            if specs.is_empty() {
                // TS prints a plain sentence even for `--json`.
                println!("No specs found.");
                return;
            }

            if want_json {
                let payload = SpecsResponse { specs };
                let rendered =
                    serde_json::to_string_pretty(&payload).expect("json should serialize");
                println!("{rendered}");
                return;
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
            let changes_dir = spool_path.join("changes");
            if !changes_dir.exists() {
                eprintln!("✖ Error: No Spool changes directory found. Run 'spool init' first.");
                std::process::exit(1);
            }

            let mut items: Vec<(String, u32, u32, DateTime<Utc>)> = Vec::new();
            let entries = std::fs::read_dir(&changes_dir).unwrap_or_else(|_| {
                eprintln!("✖ Error: No Spool changes directory found. Run 'spool init' first.");
                std::process::exit(1);
            });
            for entry in entries.flatten() {
                let ft = match entry.file_type() {
                    Ok(t) => t,
                    Err(_) => continue,
                };
                if !ft.is_dir() {
                    continue;
                }
                let name = entry.file_name().to_string_lossy().to_string();
                if name == "archive" {
                    continue;
                }
                let change_path = entry.path();
                let tasks_path = change_path.join("tasks.md");
                let (total, completed) = match std::fs::read_to_string(&tasks_path) {
                    Ok(c) => spool_core::list::count_tasks_markdown(&c),
                    Err(_) => (0, 0),
                };
                let lm = spool_core::list::last_modified_recursive(&change_path)
                    .unwrap_or_else(|_| Utc::now());
                items.push((name, completed, total, lm));
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
                return;
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
                return;
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
}

const SHOW_HELP: &str = "Usage: spool show [options] [command] [item-name]\n\nShow a change or spec\n\nOptions:\n  --json                          Output as JSON\n  --type <type>                   Type: change or spec\n  --no-interactive                Disable interactive prompts\n  --deltas-only                   Change JSON only: only include deltas\n  --requirements-only             Change JSON only: only include deltas (deprecated)\n  --requirements                  Spec JSON only: exclude scenarios\n  --no-scenarios                  Spec JSON only: exclude scenarios\n  -r, --requirement <id>          Spec JSON only: select requirement (1-based)\n  -h, --help                      display help for command\n\nCommands:\n  module [options] [module-id]    Show a module";

fn handle_show(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{SHOW_HELP}");
        return;
    }

    // Parse subcommand: `spool show module <id>`
    if args.first().map(|s| s.as_str()) == Some("module") {
        handle_show_module(&args[1..]);
        return;
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
        eprintln!(
            "Nothing to show. Try one of:\n  spool show <item>\n  spool show (for interactive selection)\nOr run in an interactive terminal."
        );
        std::process::exit(1);
    }
    let item = item.expect("checked");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    let explicit = typ.as_deref();
    let resolved_type = match explicit {
        Some("change") | Some("spec") => explicit.unwrap().to_string(),
        Some(_) => {
            eprintln!("✖ Error: Invalid type. Expected 'change' or 'spec'.");
            std::process::exit(1);
        }
        None => detect_item_type(&spool_path, &item),
    };

    if resolved_type == "ambiguous" {
        eprintln!(
            "Ambiguous item '{item}' matches both a change and a spec.\nUse --type change or --type spec to disambiguate."
        );
        std::process::exit(1);
    }
    if resolved_type == "unknown" {
        let candidates = list_candidate_items(&spool_path);
        let suggestions = nearest_matches(&item, &candidates, 5);
        eprintln!("Unknown item '{item}'");
        if !suggestions.is_empty() {
            eprintln!("Did you mean: {}?", suggestions.join(", "));
        }
        std::process::exit(1);
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
            let spec_path = spool_path.join("specs").join(&item).join("spec.md");
            let md = match std::fs::read_to_string(&spec_path) {
                Ok(c) => c,
                Err(_) => {
                    eprintln!(
                        "✖ Error: Spec '{item}' not found at {p}",
                        p = format!("{}/specs/{}/spec.md", spool_path.display(), item)
                    );
                    std::process::exit(1);
                }
            };
            if want_json {
                if requirements && requirement_idx.is_some() {
                    eprintln!("✖ Error: Cannot use --requirement with --requirements");
                    std::process::exit(1);
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
                        eprintln!(
                            "✖ Error: Requirement index out of range. Expected 1..={}",
                            json.requirements.len()
                        );
                        std::process::exit(1);
                    }
                    json.requirements = vec![json.requirements[one_based - 1].clone()];
                    json.requirement_count = json.requirements.len() as u32;
                }
                let rendered = serde_json::to_string_pretty(&json).expect("json should serialize");
                println!("{rendered}");
            } else {
                print!("{md}");
            }
        }
        "change" => {
            let change_path = spool_path.join("changes").join(&item);
            let proposal_path = change_path.join("proposal.md");
            if !proposal_path.exists() {
                eprintln!(
                    "✖ Error: Change '{item}' not found at {p}",
                    p = format!("{}/changes/{}/proposal.md", spool_path.display(), item)
                );
                std::process::exit(1);
            }
            if want_json {
                let mut files: Vec<core_show::DeltaSpecFile> = Vec::new();
                let paths =
                    core_show::read_change_delta_spec_paths(&spool_path, &item).unwrap_or_default();
                for p in paths {
                    if let Ok(f) = core_show::load_delta_spec_file(&p) {
                        files.push(f);
                    }
                }
                let json = core_show::parse_change_show_json(&item, &files);
                let rendered = serde_json::to_string_pretty(&json).expect("json should serialize");
                println!("{rendered}");
            } else {
                let md = std::fs::read_to_string(&proposal_path).unwrap_or_default();
                print!("{md}");
            }
        }
        _ => {
            eprintln!("✖ Error: Unhandled show type");
            std::process::exit(1);
        }
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

fn handle_show_module(args: &[String]) {
    // Minimal module show: print module.md if present.
    let want_json = args.iter().any(|a| a == "--json");
    if want_json {
        eprintln!("✖ Error: Module JSON output is not implemented");
        std::process::exit(1);
    }
    let module_id = last_positional(args);
    if module_id.is_none() {
        eprintln!(
            "Nothing to show. Try one of:\n  spool show module <module-id>\nOr run in an interactive terminal."
        );
        std::process::exit(1);
    }
    let module_id = module_id.expect("checked");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    let resolved = core_validate::resolve_module(&spool_path, &module_id).unwrap_or(None);
    let Some(m) = resolved else {
        eprintln!("✖ Error: Module '{module_id}' not found");
        std::process::exit(1);
    };

    let md = std::fs::read_to_string(&m.module_md).unwrap_or_default();
    print!("{md}");
}

const VALIDATE_HELP: &str = "Usage: spool validate [options] [command] [item-name]\n\nValidate changes, specs, and modules\n\nOptions:\n  --all                          Validate everything\n  --changes                       Validate changes\n  --specs                         Validate specs\n  --modules                       Validate modules\n  --module <id>                   Validate a module by id\n  --type <type>                   Type: change, spec, or module\n  --strict                        Treat warnings as errors\n  --json                          Output as JSON\n  --concurrency <n>               Concurrency (default: 6)\n  --no-interactive                Disable interactive prompts\n  -h, --help                      display help for command\n\nCommands:\n  module [module-id]              Validate a module";

fn handle_validate(args: &[String]) {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{VALIDATE_HELP}");
        return;
    }

    if args.first().map(|s| s.as_str()) == Some("module") {
        handle_validate_module(&args[1..]);
        return;
    }

    let want_json = args.iter().any(|a| a == "--json");
    let strict = args.iter().any(|a| a == "--strict");
    let typ = parse_string_flag(args, "--type");
    let bulk = args
        .iter()
        .any(|a| matches!(a.as_str(), "--all" | "--changes" | "--specs" | "--modules"));

    let item = last_positional(args);
    if item.is_none() && !bulk {
        eprintln!(
            "Nothing to validate. Try one of:\n  spool validate --all\n  spool validate --changes\n  spool validate --specs\n  spool validate <item-name>\nOr run in an interactive terminal."
        );
        std::process::exit(1);
    }

    if bulk {
        eprintln!("✖ Error: Bulk validation is not implemented in Rust yet");
        std::process::exit(1);
    }

    let item = item.expect("checked");
    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    let explicit = typ.as_deref();
    let resolved_type = match explicit {
        Some("change") | Some("spec") | Some("module") => explicit.unwrap().to_string(),
        Some(_) => {
            eprintln!("✖ Error: Invalid type. Expected 'change', 'spec', or 'module'.");
            std::process::exit(1);
        }
        None => detect_item_type(&spool_path, &item),
    };

    // Special-case: TS `--type module <id>` behaves like validating a spec by id.
    if resolved_type == "module" {
        let report = validate_spec_by_id_or_enoent(&spool_path, &item, strict);
        render_validate_result("spec", &item, report, want_json);
        return;
    }

    if resolved_type == "ambiguous" {
        eprintln!(
            "Ambiguous item '{item}' matches both a change and a spec.\nUse --type change or --type spec to disambiguate."
        );
        std::process::exit(1);
    }

    match resolved_type.as_str() {
        "spec" => {
            let spec_path = spool_path.join("specs").join(&item).join("spec.md");
            if !spec_path.exists() {
                let candidates = list_spec_ids(&spool_path);
                let suggestions = nearest_matches(&item, &candidates, 5);
                eprintln!("Unknown spec '{item}'");
                if !suggestions.is_empty() {
                    eprintln!("Did you mean: {}?", suggestions.join(", "));
                }
                std::process::exit(1);
            }
            let report =
                core_validate::validate_spec(&spool_path, &item, strict).unwrap_or_else(|e| {
                    eprintln!("✖ Error: {e}");
                    std::process::exit(1);
                });
            render_validate_result("spec", &item, report, want_json);
        }
        "change" => {
            let proposal = spool_path.join("changes").join(&item).join("proposal.md");
            if !proposal.exists() {
                let candidates = list_change_ids(&spool_path);
                let suggestions = nearest_matches(&item, &candidates, 5);
                eprintln!("Unknown change '{item}'");
                if !suggestions.is_empty() {
                    eprintln!("Did you mean: {}?", suggestions.join(", "));
                }
                std::process::exit(1);
            }
            let report =
                core_validate::validate_change(&spool_path, &item, strict).unwrap_or_else(|e| {
                    eprintln!("✖ Error: {e}");
                    std::process::exit(1);
                });
            render_validate_result("change", &item, report, want_json);
        }
        _ => {
            // unknown
            let candidates = list_candidate_items(&spool_path);
            let suggestions = nearest_matches(&item, &candidates, 5);
            eprintln!("Unknown item '{item}'");
            if !suggestions.is_empty() {
                eprintln!("Did you mean: {}?", suggestions.join(", "));
            }
            std::process::exit(1);
        }
    }
}

fn handle_validate_module(args: &[String]) {
    // TS prints a spinner line even in non-interactive environments.
    eprintln!("- Validating module...");
    let module_id = last_positional(args);
    if module_id.is_none() {
        eprintln!(
            "Nothing to validate. Try one of:\n  spool validate module <module-id>\nOr run in an interactive terminal."
        );
        std::process::exit(1);
    }
    let module_id = module_id.expect("checked");

    let ctx = ConfigContext::from_process_env();
    let spool_path = get_spool_path(std::path::Path::new("."), &ctx);

    let (full_name, report) = core_validate::validate_module(&spool_path, &module_id, false)
        .unwrap_or_else(|e| {
            eprintln!("✖ Error: {e}");
            std::process::exit(1);
        });
    if report.valid {
        println!("Module '{full_name}' is valid");
        return;
    }
    eprintln!("Module '{full_name}' has issues");
    for issue in &report.issues {
        eprintln!("✗ [{}] {}: {}", issue.level, issue.path, issue.message);
    }
    std::process::exit(1);
}

fn validate_spec_by_id_or_enoent(
    spool_path: &std::path::Path,
    spec_id: &str,
    strict: bool,
) -> core_validate::ValidationReport {
    let path = spool_path.join("specs").join(spec_id).join("spec.md");
    match std::fs::read_to_string(&path) {
        Ok(md) => core_validate::validate_spec_markdown(&md, strict),
        Err(e) => {
            let issue = core_validate::ValidationIssue {
                level: core_validate::LEVEL_ERROR.to_string(),
                path: "file".to_string(),
                message: format!("ENOENT: {e}"),
                line: None,
                column: None,
                metadata: None,
            };
            core_validate::ValidationReport::new(vec![issue], strict)
        }
    }
}

fn render_validate_result(
    typ: &str,
    id: &str,
    report: core_validate::ValidationReport,
    want_json: bool,
) {
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
        if report.valid {
            return;
        }
        std::process::exit(1);
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
        return;
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
    std::process::exit(1);
}

fn detect_item_type(spool_path: &std::path::Path, item: &str) -> String {
    let is_change = spool_path
        .join("changes")
        .join(item)
        .join("proposal.md")
        .exists();
    let is_spec = spool_path.join("specs").join(item).join("spec.md").exists();
    match (is_change, is_spec) {
        (true, true) => "ambiguous".to_string(),
        (true, false) => "change".to_string(),
        (false, true) => "spec".to_string(),
        _ => "unknown".to_string(),
    }
}

fn list_spec_ids(spool_path: &std::path::Path) -> Vec<String> {
    let specs_dir = spool_path.join("specs");
    if !specs_dir.exists() {
        return vec![];
    }
    let mut ids = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&specs_dir) {
        for e in entries.flatten() {
            if e.file_type().ok().is_some_and(|t| t.is_dir()) {
                let id = e.file_name().to_string_lossy().to_string();
                if e.path().join("spec.md").exists() {
                    ids.push(id);
                }
            }
        }
    }
    ids.sort();
    ids
}

fn list_change_ids(spool_path: &std::path::Path) -> Vec<String> {
    let changes_dir = spool_path.join("changes");
    if !changes_dir.exists() {
        return vec![];
    }
    let mut ids = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&changes_dir) {
        for e in entries.flatten() {
            if e.file_type().ok().is_some_and(|t| t.is_dir()) {
                let name = e.file_name().to_string_lossy().to_string();
                if name == "archive" {
                    continue;
                }
                if e.path().join("proposal.md").exists() {
                    ids.push(name);
                }
            }
        }
    }
    ids.sort();
    ids
}

fn list_candidate_items(spool_path: &std::path::Path) -> Vec<String> {
    let mut items = list_spec_ids(spool_path);
    items.extend(list_change_ids(spool_path));
    items
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
