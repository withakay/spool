use crate::cli::Cli;
use crate::runtime::Runtime;
use crate::util::parse_string_flag;
use clap::ColorChoice;
use clap::CommandFactory;
use spool_core::config::ConfigContext;
use spool_core::paths as core_paths;
use spool_core::workflow as core_workflow;
use std::path::{Path, PathBuf};

pub(crate) fn schema_not_found_message(ctx: &ConfigContext, name: &str) -> String {
    let schemas = core_workflow::list_available_schemas(ctx);
    let mut msg = format!("Schema '{name}' not found");
    if !schemas.is_empty() {
        msg.push_str(&format!(". Available schemas:\n  {}", schemas.join("\n  ")));
    }
    msg
}

pub(crate) fn render_command_long_help(path: &[&str], bin_name: &str) -> String {
    let mut cmd = Cli::command();
    cmd = cmd.color(ColorChoice::Never);

    if path.is_empty() {
        return cmd.bin_name(bin_name).render_long_help().to_string();
    }

    let mut current = cmd;
    for (i, part) in path.iter().enumerate() {
        let Some(found) = current.find_subcommand_mut(part) else {
            return format!("Usage: {bin_name}\n\n(Help unavailable)");
        };

        let mut found = found.clone().color(ColorChoice::Never);
        if i + 1 == path.len() {
            found = found.bin_name(bin_name);
            return found.render_long_help().to_string();
        }
        current = found;
    }

    format!("Usage: {bin_name}\n\n(Help unavailable)")
}

pub(crate) fn unknown_with_suggestions(kind: &str, item: &str, suggestions: &[String]) -> String {
    let mut msg = format!("Unknown {kind} '{item}'");
    if !suggestions.is_empty() {
        msg.push_str(&format!("\nDid you mean: {}?", suggestions.join(", ")));
    }
    msg
}

pub(crate) fn detect_item_type(rt: &Runtime, item: &str) -> String {
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

pub(crate) fn list_spec_ids(rt: &Runtime) -> Vec<String> {
    list_spec_ids_from_index(rt.spool_path(), rt.repo_index())
}

pub(crate) fn list_change_ids(rt: &Runtime) -> Vec<String> {
    list_change_ids_from_index(rt.spool_path(), rt.repo_index())
}

pub(crate) fn list_candidate_items(rt: &Runtime) -> Vec<String> {
    let mut items = list_spec_ids(rt);
    items.extend(list_change_ids(rt));
    items
}

pub(crate) fn list_spec_ids_from_index(
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

pub(crate) fn list_change_ids_from_index(
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

pub(crate) fn last_positional(args: &[String]) -> Option<String> {
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
            || a == "--schema"
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

pub(crate) fn project_root_override_for_init_update(args: &[String]) -> PathBuf {
    for a in args.iter().skip(1) {
        if a.starts_with('-') {
            continue;
        }
        return PathBuf::from(a);
    }
    PathBuf::from(".")
}

pub(crate) fn parse_schema_flag(args: &[String]) -> Option<String> {
    parse_string_flag(args, "--schema")
}
