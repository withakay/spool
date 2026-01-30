use std::collections::BTreeSet;
use std::path::Path;

use miette::{IntoDiagnostic, Result};

fn list_child_dirs(dir: &Path) -> Result<Vec<String>> {
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut out: Vec<String> = Vec::new();
    for e in std::fs::read_dir(dir).into_diagnostic()? {
        let e = e.into_diagnostic()?;
        let ft = e.file_type().into_diagnostic()?;
        if !ft.is_dir() {
            continue;
        }
        let name = e.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        out.push(name);
    }
    out.sort();
    Ok(out)
}

pub fn list_dir_names(dir: &Path) -> Result<Vec<String>> {
    list_child_dirs(dir)
}

pub fn list_change_dir_names(spool_path: &Path) -> Result<Vec<String>> {
    let mut out = list_child_dirs(crate::paths::changes_dir(spool_path).as_path())?;
    out.retain(|n| n != "archive");
    Ok(out)
}

pub fn list_module_dir_names(spool_path: &Path) -> Result<Vec<String>> {
    list_child_dirs(crate::paths::modules_dir(spool_path).as_path())
}

pub fn list_module_ids(spool_path: &Path) -> Result<BTreeSet<String>> {
    let mut ids: BTreeSet<String> = BTreeSet::new();
    for name in list_module_dir_names(spool_path)? {
        let Some((id_part, _)) = name.split_once('_') else {
            continue;
        };
        if id_part.len() == 3 && id_part.chars().all(|c| c.is_ascii_digit()) {
            ids.insert(id_part.to_string());
        }
    }
    Ok(ids)
}

pub fn list_spec_dir_names(spool_path: &Path) -> Result<Vec<String>> {
    list_child_dirs(crate::paths::specs_dir(spool_path).as_path())
}
