use std::path::{Path, PathBuf};

use chrono::{DateTime, SecondsFormat, Timelike, Utc};
use miette::{IntoDiagnostic, Result};

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct ModuleListItem {
    pub id: String,
    pub name: String,
    #[serde(rename = "fullName")]
    pub full_name: String,
    #[serde(rename = "changeCount")]
    pub change_count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct ChangeListItem {
    pub name: String,
    #[serde(rename = "completedTasks")]
    pub completed_tasks: u32,
    #[serde(rename = "totalTasks")]
    pub total_tasks: u32,
    #[serde(rename = "lastModified")]
    pub last_modified: String,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct SpecListItem {
    pub id: String,
    #[serde(rename = "requirementCount")]
    pub requirement_count: u32,
}

pub fn list_modules(spool_path: &Path) -> Result<Vec<ModuleListItem>> {
    let modules_dir = spool_path.join("modules");
    let changes_dir = spool_path.join("changes");

    let mut modules: Vec<ModuleListItem> = Vec::new();
    if !modules_dir.exists() {
        return Ok(modules);
    }

    for entry in std::fs::read_dir(&modules_dir).into_diagnostic()? {
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
        if std::fs::metadata(entry.path().join("module.md")).is_err() {
            continue;
        }
        let change_count = count_changes_for_module(&changes_dir, &id)?;
        modules.push(ModuleListItem {
            id,
            name,
            full_name,
            change_count,
        });
    }

    modules.sort_by(|a, b| a.full_name.cmp(&b.full_name));
    Ok(modules)
}

pub fn list_change_dirs(spool_path: &Path) -> Result<Vec<PathBuf>> {
    let changes_dir = spool_path.join("changes");
    if !changes_dir.exists() {
        return Ok(vec![]);
    }

    let mut dirs: Vec<PathBuf> = Vec::new();
    for entry in std::fs::read_dir(&changes_dir).into_diagnostic()? {
        let entry = entry.into_diagnostic()?;
        if !entry.file_type().into_diagnostic()?.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name == "archive" {
            continue;
        }
        dirs.push(entry.path());
    }
    Ok(dirs)
}

pub fn count_tasks_markdown(contents: &str) -> (u32, u32) {
    let mut total = 0u32;
    let mut completed = 0u32;
    for line in contents.lines() {
        let t = line.trim_start();
        if t.len() < 6 {
            continue;
        }

        // TS: /^[-*]\s+\[[\sx]\]/i and /^[-*]\s+\[x\]/i
        let bytes = t.as_bytes();
        if bytes[0] != b'-' && bytes[0] != b'*' {
            continue;
        }
        // Require at least one whitespace after bullet.
        if bytes.get(1).is_some_and(|b| !b.is_ascii_whitespace()) {
            continue;
        }
        let mut i = 1usize;
        while i < bytes.len() && bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        if i + 2 >= bytes.len() || bytes[i] != b'[' || bytes[i + 2] != b']' {
            continue;
        }
        let mid = bytes[i + 1];
        if mid != b' ' && mid != b's' && mid != b'S' && mid != b'x' && mid != b'X' {
            continue;
        }
        total += 1;
        if mid == b'x' || mid == b'X' {
            completed += 1;
        }
    }
    (total, completed)
}

pub fn last_modified_recursive(path: &Path) -> Result<DateTime<Utc>> {
    use std::collections::VecDeque;

    let mut max = std::fs::metadata(path)
        .into_diagnostic()?
        .modified()
        .into_diagnostic()?;

    let mut queue: VecDeque<PathBuf> = VecDeque::new();
    queue.push_back(path.to_path_buf());

    while let Some(p) = queue.pop_front() {
        let meta = match std::fs::symlink_metadata(&p) {
            Ok(m) => m,
            Err(_) => continue,
        };
        if let Ok(m) = meta.modified() {
            if m > max {
                max = m;
            }
        }
        if meta.is_dir() {
            let iter = match std::fs::read_dir(&p) {
                Ok(i) => i,
                Err(_) => continue,
            };
            for entry in iter {
                let entry = match entry {
                    Ok(e) => e,
                    Err(_) => continue,
                };
                queue.push_back(entry.path());
            }
        }
    }

    let dt: DateTime<Utc> = max.into();
    Ok(dt)
}

pub fn to_iso_millis(dt: DateTime<Utc>) -> String {
    // JS Date.toISOString() is millisecond-precision. Truncate to millis to avoid
    // platform-specific sub-ms differences.
    let nanos = dt.timestamp_subsec_nanos();
    let truncated = dt
        .with_nanosecond((nanos / 1_000_000) * 1_000_000)
        .unwrap_or(dt);
    truncated.to_rfc3339_opts(SecondsFormat::Millis, true)
}

pub fn list_specs(spool_path: &Path) -> Result<Vec<SpecListItem>> {
    let specs_dir = spool_path.join("specs");
    if !specs_dir.exists() {
        return Ok(vec![]);
    }

    let mut specs: Vec<SpecListItem> = Vec::new();
    for entry in std::fs::read_dir(&specs_dir).into_diagnostic()? {
        let entry = entry.into_diagnostic()?;
        if !entry.file_type().into_diagnostic()?.is_dir() {
            continue;
        }
        let id = entry.file_name().to_string_lossy().to_string();
        let spec_md = entry.path().join("spec.md");
        let content = std::fs::read_to_string(&spec_md).unwrap_or_default();
        let requirement_count = if content.is_empty() {
            0
        } else {
            count_requirements_in_spec_markdown(&content)
        };
        specs.push(SpecListItem {
            id,
            requirement_count,
        });
    }

    specs.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(specs)
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

fn count_changes_for_module(changes_dir: &Path, module_id: &str) -> Result<usize> {
    if !changes_dir.exists() {
        return Ok(0);
    }
    let mut count = 0usize;
    for entry in std::fs::read_dir(changes_dir).into_diagnostic()? {
        let entry = entry.into_diagnostic()?;
        if !entry.file_type().into_diagnostic()?.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || name == "archive" {
            continue;
        }
        if std::fs::metadata(entry.path().join("proposal.md")).is_err() {
            continue;
        }
        if let Some(mid) = parse_modular_change_module_id(&name) {
            if mid == module_id {
                count += 1;
            }
        }
    }
    Ok(count)
}

#[derive(Debug, Clone)]
struct Section {
    level: usize,
    title: String,
    children: Vec<Section>,
}

fn count_requirements_in_spec_markdown(content: &str) -> u32 {
    let sections = parse_sections(content);
    // Match TS MarkdownParser.parseSpec: requires Purpose and Requirements.
    let purpose = find_section(&sections, "Purpose");
    let req = find_section(&sections, "Requirements");
    if purpose.is_none() || req.is_none() {
        return 0;
    }
    req.map(|s| s.children.len() as u32).unwrap_or(0)
}

fn parse_sections(content: &str) -> Vec<Section> {
    let normalized = content.replace(['\r'], "");
    let lines: Vec<&str> = normalized.split('\n').collect();
    let mut sections: Vec<Section> = Vec::new();
    let mut stack: Vec<Section> = Vec::new();

    for line in lines {
        let trimmed = line.trim_end();
        if let Some((level, title)) = parse_header(trimmed) {
            let section = Section {
                level,
                title: title.to_string(),
                children: Vec::new(),
            };

            while stack.last().is_some_and(|s| s.level >= level) {
                let completed = stack.pop().expect("checked");
                attach_section(&mut sections, &mut stack, completed);
            }

            stack.push(section);
        }
    }

    while let Some(completed) = stack.pop() {
        attach_section(&mut sections, &mut stack, completed);
    }

    sections
}

fn attach_section(sections: &mut Vec<Section>, stack: &mut Vec<Section>, section: Section) {
    if let Some(parent) = stack.last_mut() {
        parent.children.push(section);
    } else {
        sections.push(section);
    }
}

fn parse_header(line: &str) -> Option<(usize, &str)> {
    let bytes = line.as_bytes();
    if bytes.is_empty() {
        return None;
    }
    let mut i = 0usize;
    while i < bytes.len() && bytes[i] == b'#' {
        i += 1;
    }
    if i == 0 || i > 6 {
        return None;
    }
    if i >= bytes.len() || !bytes[i].is_ascii_whitespace() {
        return None;
    }
    let title = line[i..].trim();
    if title.is_empty() {
        return None;
    }
    Some((i, title))
}

fn find_section<'a>(sections: &'a [Section], title: &str) -> Option<&'a Section> {
    for s in sections {
        if s.title.eq_ignore_ascii_case(title) {
            return Some(s);
        }
        if let Some(child) = find_section(&s.children, title) {
            return Some(child);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_tasks_like_ts() {
        let input = r#"
- [ ] a
- [x] b
* [s] c
* [X] d
-[] not
"#;
        let (total, completed) = count_tasks_markdown(input);
        assert_eq!(total, 4);
        assert_eq!(completed, 2);
    }

    #[test]
    fn counts_requirements_from_headings() {
        let md = r#"
# Title

## Purpose
blah

## Requirements

### Requirement: One
foo

### Requirement: Two
bar
"#;
        assert_eq!(count_requirements_in_spec_markdown(md), 2);
    }

    #[test]
    fn iso_millis_matches_expected_shape() {
        let dt = DateTime::parse_from_rfc3339("2026-01-26T00:00:00.123Z")
            .unwrap()
            .with_timezone(&Utc);
        assert_eq!(to_iso_millis(dt), "2026-01-26T00:00:00.123Z");
    }
}
