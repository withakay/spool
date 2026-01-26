use miette::Result;
use spool_core::config::ConfigContext;
use spool_core::spool_dir::get_spool_path;

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

    if args.is_empty() || args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{HELP}");
        return Ok(());
    }

    if args.len() == 1 && (args[0] == "--version" || args[0] == "-V") {
        // Match Commander.js default: prints version only.
        println!("{}", env!("CARGO_PKG_VERSION"));
        return Ok(());
    }

    if args.first().map(|s| s.as_str()) == Some("list") {
        return handle_list(&args[1..]);
    }

    // Temporary fallback for unimplemented commands.
    println!("{HELP}");
    Ok(())
}

fn handle_list(args: &[String]) -> Result<()> {
    let want_modules = args.iter().any(|a| a == "--modules");
    let want_json = args.iter().any(|a| a == "--json");

    if want_modules && want_json {
        let ctx = ConfigContext::from_process_env();
        let modules = list_modules(std::path::Path::new("."), &ctx)?;
        let payload = ModulesResponse { modules };
        let rendered = serde_json::to_string_pretty(&payload).expect("json should serialize");
        println!("{rendered}");
        return Ok(());
    }

    // Not implemented yet.
    println!("[]");
    Ok(())
}

#[derive(Debug, serde::Serialize)]
struct ModulesResponse {
    modules: Vec<Module>,
}

#[derive(Debug, serde::Serialize)]
struct Module {
    id: String,
    name: String,
    #[serde(rename = "fullName")]
    full_name: String,
    #[serde(rename = "changeCount")]
    change_count: usize,
}

fn list_modules(project_root: &std::path::Path, ctx: &ConfigContext) -> Result<Vec<Module>> {
    use miette::IntoDiagnostic;
    use std::fs;

    let spool_path = get_spool_path(project_root, ctx);
    let modules_dir = spool_path.join("modules");
    let changes_dir = spool_path.join("changes");

    let mut modules: Vec<Module> = Vec::new();

    if !modules_dir.exists() {
        return Ok(modules);
    }

    for entry in fs::read_dir(&modules_dir).into_diagnostic()? {
        let entry = entry.into_diagnostic()?;
        if !entry.file_type().into_diagnostic()?.is_dir() {
            continue;
        }

        let full_name = entry.file_name().to_string_lossy().to_string();
        if full_name.starts_with('.') {
            continue;
        }

        let Some((id, name)) = parse_module_folder_name(&full_name) else {
            continue;
        };

        // TS oracle only counts modules that have module.md present.
        let module_md = entry.path().join("module.md");
        if fs::metadata(&module_md).is_err() {
            continue;
        }

        let change_count = count_changes_for_module(&changes_dir, &id)?;

        modules.push(Module {
            id,
            name,
            full_name,
            change_count,
        });
    }

    modules.sort_by(|a, b| a.full_name.cmp(&b.full_name));
    Ok(modules)
}

fn count_changes_for_module(changes_dir: &std::path::Path, module_id: &str) -> Result<usize> {
    use miette::IntoDiagnostic;
    use std::fs;

    if !changes_dir.exists() {
        return Ok(0);
    }

    let mut count = 0usize;
    for entry in fs::read_dir(changes_dir).into_diagnostic()? {
        let entry = entry.into_diagnostic()?;
        if !entry.file_type().into_diagnostic()?.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || name == "archive" {
            continue;
        }

        // TS oracle only considers changes "active" if proposal.md exists.
        if fs::metadata(entry.path().join("proposal.md")).is_err() {
            continue;
        }

        // Only modular changes are associated with modules.
        if let Some(parsed_module_id) = parse_modular_change_module_id(&name)
            && parsed_module_id == module_id
        {
            count += 1;
        }
    }

    Ok(count)
}

fn parse_module_folder_name(folder: &str) -> Option<(String, String)> {
    // TS regex: /^(\d{3})_([a-z][a-z0-9-]*)$/
    let bytes = folder.as_bytes();
    if bytes.len() < 5 {
        return None;
    }
    if !bytes.first()?.is_ascii_digit()
        || !bytes.get(1)?.is_ascii_digit()
        || !bytes.get(2)?.is_ascii_digit()
    {
        return None;
    }
    if *bytes.get(3)? != b'_' {
        return None;
    }

    let name = &folder[4..];
    let mut chars = name.chars();
    let first = chars.next()?;
    if !first.is_ascii_lowercase() {
        return None;
    }
    for c in chars {
        if !(c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
            return None;
        }
    }

    Some((folder[0..3].to_string(), name.to_string()))
}

fn parse_modular_change_module_id(folder: &str) -> Option<&str> {
    // TS regex: /^(\d{3})-(\d{2})_([a-z][a-z0-9-]*)$/
    let bytes = folder.as_bytes();
    if bytes.len() < 8 {
        return None;
    }
    if !bytes.first()?.is_ascii_digit()
        || !bytes.get(1)?.is_ascii_digit()
        || !bytes.get(2)?.is_ascii_digit()
    {
        return None;
    }
    if *bytes.get(3)? != b'-' {
        return None;
    }
    if !bytes.get(4)?.is_ascii_digit() || !bytes.get(5)?.is_ascii_digit() {
        return None;
    }
    if *bytes.get(6)? != b'_' {
        return None;
    }
    let name = &folder[7..];
    let mut chars = name.chars();
    let first = chars.next()?;
    if !first.is_ascii_lowercase() {
        return None;
    }
    for c in chars {
        if !(c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
            return None;
        }
    }
    Some(&folder[0..3])
}
