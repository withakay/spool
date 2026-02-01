use crate::cli_error::{CliResult, to_cli_error};
use crate::runtime::Runtime;
use spool_core::installers::{InitOptions, InstallMode, install_default_templates};
use std::collections::BTreeSet;

pub(super) fn handle_update(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{}", super::UPDATE_HELP);
        return Ok(());
    }

    // `--json` is accepted for parity with TS but not implemented yet.
    let _want_json = args.iter().any(|a| a == "--json");
    let target = super::common::last_positional(args).unwrap_or_else(|| ".".to_string());
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
