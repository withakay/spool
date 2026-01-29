use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use chrono::Utc;
use miette::{miette, Result};
use spool_fs::update_file_with_markers;

use crate::config::ConfigContext;
use crate::spool_dir::get_spool_dir_name;

pub const TOOL_CLAUDE: &str = "claude";
pub const TOOL_CODEX: &str = "codex";
pub const TOOL_GITHUB_COPILOT: &str = "github-copilot";
pub const TOOL_OPENCODE: &str = "opencode";

pub fn available_tool_ids() -> &'static [&'static str] {
    &[TOOL_CLAUDE, TOOL_CODEX, TOOL_GITHUB_COPILOT, TOOL_OPENCODE]
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InitOptions {
    pub tools: BTreeSet<String>,
    pub force: bool,
}

impl InitOptions {
    pub fn new(tools: BTreeSet<String>, force: bool) -> Self {
        Self { tools, force }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InstallMode {
    Init,
    Update,
}

pub fn install_default_templates(
    project_root: &Path,
    ctx: &ConfigContext,
    mode: InstallMode,
    opts: &InitOptions,
) -> Result<()> {
    let spool_dir_name = get_spool_dir_name(project_root, ctx);
    let spool_dir = spool_templates::normalize_spool_dir(&spool_dir_name);

    install_project_templates(project_root, &spool_dir, mode, opts)?;
    install_home_templates(ctx, &spool_dir, mode, opts)?;
    Ok(())
}

fn install_project_templates(
    project_root: &Path,
    spool_dir: &str,
    mode: InstallMode,
    opts: &InitOptions,
) -> Result<()> {
    let selected = &opts.tools;
    let current_date = Utc::now().format("%Y-%m-%d").to_string();
    let state_rel = format!("{spool_dir}/planning/STATE.md");

    for f in spool_templates::default_project_files() {
        let rel = spool_templates::render_rel_path(f.relative_path, spool_dir);
        if !should_install_project_rel(rel.as_ref(), selected) {
            continue;
        }

        let mut bytes = spool_templates::render_bytes(f.contents, spool_dir).into_owned();
        if rel.as_ref() == state_rel {
            if let Ok(s) = std::str::from_utf8(&bytes) {
                bytes = s.replace("__CURRENT_DATE__", &current_date).into_bytes();
            }
        }
        let target = project_root.join(rel.as_ref());
        write_one(&target, &bytes, mode, opts)?;
    }

    Ok(())
}

fn install_home_templates(
    ctx: &ConfigContext,
    spool_dir: &str,
    mode: InstallMode,
    opts: &InitOptions,
) -> Result<()> {
    if !opts.tools.contains(TOOL_CODEX) {
        return Ok(());
    }

    // Codex honors CODEX_HOME when set; otherwise defaults to $HOME/.codex.
    let base = if let Some(v) = std::env::var_os("CODEX_HOME") {
        PathBuf::from(v)
    } else {
        let home = ctx
            .home_dir
            .clone()
            .ok_or_else(|| miette!("Cannot install Codex prompts: HOME is not set"))?;
        home.join(".codex")
    };

    for f in spool_templates::default_home_files() {
        // Templates are stored under `.codex/...` when installing into HOME.
        // When CODEX_HOME is set, strip the leading `.codex/` to match Codex conventions.
        let rel = f.relative_path;
        let rel = if std::env::var_os("CODEX_HOME").is_some() {
            rel.strip_prefix(".codex/").unwrap_or(rel)
        } else {
            rel
        };

        let rel = spool_templates::render_rel_path(rel, spool_dir);
        let bytes = spool_templates::render_bytes(f.contents, spool_dir);
        let target = base.join(rel.as_ref());
        write_one(&target, &bytes, mode, opts)?;
    }

    Ok(())
}

fn should_install_project_rel(rel: &str, tools: &BTreeSet<String>) -> bool {
    // Always install Spool project assets.
    if rel == "AGENTS.md" {
        return true;
    }
    if rel.starts_with(".spool/") {
        return true;
    }

    // Tool-specific assets.
    if rel == "CLAUDE.md" || rel.starts_with(".claude/") {
        return tools.contains(TOOL_CLAUDE);
    }
    if rel.starts_with(".opencode/") {
        return tools.contains(TOOL_OPENCODE);
    }
    if rel.starts_with(".github/") {
        return tools.contains(TOOL_GITHUB_COPILOT);
    }

    // Unknown/unclassified: only install when tools=all (caller controls via set contents).
    false
}

fn write_one(
    target: &Path,
    rendered_bytes: &[u8],
    mode: InstallMode,
    opts: &InitOptions,
) -> Result<()> {
    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| miette!("Failed to create directory {}: {e}", parent.display()))?;
    }

    // Marker-managed files: template contains markers; we extract the inner block.
    if let Ok(text) = std::str::from_utf8(rendered_bytes) {
        if let Some(block) = spool_templates::extract_managed_block(text) {
            if target.exists() {
                if mode == InstallMode::Init && !opts.force {
                    // If the file exists but doesn't contain Spool markers, mimic TS init behavior:
                    // refuse to overwrite without --force.
                    let existing = std::fs::read_to_string(target).unwrap_or_default();
                    let has_start = existing.contains(spool_templates::SPOOL_START_MARKER);
                    let has_end = existing.contains(spool_templates::SPOOL_END_MARKER);
                    if !(has_start && has_end) {
                        return Err(miette!(
                            "Refusing to overwrite existing file without markers: {} (re-run with --force)",
                            target.display()
                        ));
                    }
                }

                update_file_with_markers(
                    target,
                    block,
                    spool_templates::SPOOL_START_MARKER,
                    spool_templates::SPOOL_END_MARKER,
                )
                .map_err(|e| miette!("Failed to update markers in {}: {e}", target.display()))?;
            } else {
                // New file: write the template bytes verbatim so output matches embedded assets.
                std::fs::write(target, rendered_bytes)
                    .map_err(|e| miette!("Failed to write {}: {e}", target.display()))?;
            }

            return Ok(());
        }
    }

    // Non-marker-managed files: init refuses to overwrite unless --force.
    if mode == InstallMode::Init && target.exists() && !opts.force {
        return Err(miette!(
            "Refusing to overwrite existing file without markers: {} (re-run with --force)",
            target.display()
        ));
    }

    std::fs::write(target, rendered_bytes)
        .map_err(|e| miette!("Failed to write {}: {e}", target.display()))?;
    Ok(())
}
