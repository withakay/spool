use miette::{miette, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RalphHistoryEntry {
    pub timestamp: i64,
    pub duration: i64,
    pub completion_promise_found: bool,
    pub file_changes_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RalphState {
    pub change_id: String,
    pub iteration: u32,
    pub history: Vec<RalphHistoryEntry>,
    pub context_file: String,
}

pub fn ralph_state_dir(spool_path: &Path, change_id: &str) -> PathBuf {
    spool_path.join(".state").join("ralph").join(change_id)
}

pub fn ralph_state_json_path(spool_path: &Path, change_id: &str) -> PathBuf {
    ralph_state_dir(spool_path, change_id).join("state.json")
}

pub fn ralph_context_path(spool_path: &Path, change_id: &str) -> PathBuf {
    ralph_state_dir(spool_path, change_id).join("context.md")
}

pub fn load_state(spool_path: &Path, change_id: &str) -> Result<Option<RalphState>> {
    let p = ralph_state_json_path(spool_path, change_id);
    if !p.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&p)
        .map_err(|e| miette!("I/O error reading {p}: {e}", p = p.display()))?;
    let state = serde_json::from_str(&raw)
        .map_err(|e| miette!("JSON error parsing {p}: {e}", p = p.display()))?;
    Ok(Some(state))
}

pub fn save_state(spool_path: &Path, change_id: &str, state: &RalphState) -> Result<()> {
    let dir = ralph_state_dir(spool_path, change_id);
    fs::create_dir_all(&dir)
        .map_err(|e| miette!("I/O error creating {p}: {e}", p = dir.display()))?;
    let p = ralph_state_json_path(spool_path, change_id);
    let raw = serde_json::to_string_pretty(state)
        .map_err(|e| miette!("JSON error serializing state: {e}"))?;
    fs::write(&p, raw).map_err(|e| miette!("I/O error writing {p}: {e}", p = p.display()))?;
    Ok(())
}

pub fn load_context(spool_path: &Path, change_id: &str) -> Result<String> {
    let p = ralph_context_path(spool_path, change_id);
    if !p.exists() {
        return Ok(String::new());
    }
    Ok(fs::read_to_string(&p)
        .map_err(|e| miette!("I/O error reading {p}: {e}", p = p.display()))?)
}

pub fn append_context(spool_path: &Path, change_id: &str, text: &str) -> Result<()> {
    let dir = ralph_state_dir(spool_path, change_id);
    fs::create_dir_all(&dir)
        .map_err(|e| miette!("I/O error creating {p}: {e}", p = dir.display()))?;
    let p = ralph_context_path(spool_path, change_id);
    let mut existing = if p.exists() {
        fs::read_to_string(&p)
            .map_err(|e| miette!("I/O error reading {p}: {e}", p = p.display()))?
    } else {
        String::new()
    };

    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Ok(());
    }

    if !existing.trim().is_empty() {
        existing.push_str("\n\n");
    }
    existing.push_str(trimmed);
    existing.push('\n');
    fs::write(&p, existing).map_err(|e| miette!("I/O error writing {p}: {e}", p = p.display()))?;
    Ok(())
}

pub fn clear_context(spool_path: &Path, change_id: &str) -> Result<()> {
    let dir = ralph_state_dir(spool_path, change_id);
    fs::create_dir_all(&dir)
        .map_err(|e| miette!("I/O error creating {p}: {e}", p = dir.display()))?;
    let p = ralph_context_path(spool_path, change_id);
    fs::write(&p, "").map_err(|e| miette!("I/O error writing {p}: {e}", p = p.display()))?;
    Ok(())
}
