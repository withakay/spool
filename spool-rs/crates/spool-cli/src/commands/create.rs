use crate::cli_error::{CliResult, fail, to_cli_error};
use crate::runtime::Runtime;
use crate::util::{parse_string_flag, split_csv};
use spool_core::{create as core_create, workflow as core_workflow};

pub(crate) const CREATE_HELP: &str = "Usage: spool create <type> [options]\n\nCreate items\n\nTypes:\n  module <name>                 Create a module\n  change <name>                 Create a change\n\nOptions:\n  --schema <name>               Workflow schema name (default: spec-driven)\n  --module <id>                 Module id (default: 000)\n  --description <text>          Description (writes README.md)\n  --scope <capabilities>        Module scope (comma-separated, default: \"*\")\n  --depends-on <modules>        Module dependencies (comma-separated module ids)\n  -h, --help                    display help for command";

pub(crate) const NEW_HELP: &str = "Usage: spool new <type> [options]\n\n[Experimental] Create new items\n\nTypes:\n  change <name>                 Create a change\n\nOptions:\n  --schema <name>               Workflow schema name (default: spec-driven)\n  --module <id>                 Module id (default: 000)\n  --description <text>          Description (writes README.md)\n  -h, --help                    display help for command";

pub(crate) fn handle_create(rt: &Runtime, args: &[String]) -> CliResult<()> {
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
                    // TS prints the spool directory name (default: \".spool\") rather than an absolute path.
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

pub(crate) fn handle_new(rt: &Runtime, args: &[String]) -> CliResult<()> {
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
