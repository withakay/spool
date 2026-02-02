use crate::cli::TemplatesArgs;
use crate::cli_error::{CliResult, fail, to_cli_error};
use crate::runtime::Runtime;
use crate::util::parse_string_flag;
use spool_core::workflow as core_workflow;

pub(crate) fn handle_templates(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!(
            "{}",
            super::common::render_command_long_help(&["templates"], "spool templates")
        );
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
            return fail(super::common::schema_not_found_message(ctx, &name));
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

pub(crate) fn handle_templates_clap(rt: &Runtime, args: &TemplatesArgs) -> CliResult<()> {
    let mut argv: Vec<String> = Vec::new();
    if let Some(schema) = &args.schema {
        argv.push("--schema".to_string());
        argv.push(schema.clone());
    }
    if args.json {
        argv.push("--json".to_string());
    }
    handle_templates(rt, &argv)
}

pub(crate) fn handle_x_templates_clap(rt: &Runtime, args: &TemplatesArgs) -> CliResult<()> {
    let mut argv: Vec<String> = Vec::new();
    if let Some(schema) = &args.schema {
        argv.push("--schema".to_string());
        argv.push(schema.clone());
    }
    if args.json {
        argv.push("--json".to_string());
    }
    // The legacy handler expects `x-templates` vs `templates` only for the warning text;
    // `spool-cli` preserves behavior by routing both through the same implementation.
    handle_templates(rt, &argv)
}
