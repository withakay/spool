use chrono::{DateTime, Utc};
use miette::Result;
use spool_core::config::ConfigContext;
use spool_core::spool_dir::get_spool_path;
use spool_core::{r#match::nearest_matches, show as core_show, validate as core_validate};

const HELP: &str = "Usage: spool [options] [command]\n\nAI-native system for spec-driven development\n\nOptions:\n  -V, --version                    output the version number\n  --no-color                       Disable color output\n  -h, --help                       display help for command\n\nCommands:\n  init [options] [path]            Initialize Spool in your project\n  update [options] [path]          Update Spool instruction files\n  tasks                            Track execution tasks for a change\n  list [options]                   List items (changes by default). Use --specs\n                                   or --modules to list other items.\n  dashboard                        Display an interactive dashboard of specs and\n                                   changes\n  archive [options] [change-name]  Archive a completed change and update main\n                                   specs\n  config [options]                 View and modify global Spool configuration\n  create                           Create items\n  validate [options] [item-name]   Validate changes, specs, and modules\n  show [options] [item-name]       Show a change or spec\n  completions                      Manage shell completions for Spool CLI\n  status [options]                 [Experimental] Display artifact completion\n                                   status for a change\n  x-templates [options]            [Experimental] Show resolved template paths\n                                   for all artifacts in a schema\n  x-schemas [options]              [Experimental] List available workflow\n                                   schemas with descriptions\n  agent                            Commands that generate machine-readable\n                                   output for AI agents\n  ralph [options] [prompt]         Run iterative AI loop against a change\n                                   proposal\n  split [change-id]                Split a large change into smaller changes\n  help [command]                   display help for command";

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
        Some("list") => {
            handle_list(&args[1..]);
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
