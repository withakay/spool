use std::path::{Path, PathBuf};

use miette::Result;
use serde::Serialize;

use crate::show::{
    DeltaSpecFile, load_delta_spec_file, parse_change_show_json, parse_spec_show_json,
};

mod issue;

pub use issue::{error, info, issue, warning, with_line, with_loc, with_metadata};

pub type ValidationLevel = &'static str;

pub const LEVEL_ERROR: ValidationLevel = "ERROR";
pub const LEVEL_WARNING: ValidationLevel = "WARNING";
pub const LEVEL_INFO: ValidationLevel = "INFO";

// Thresholds: match TS defaults.
const MIN_PURPOSE_LENGTH: usize = 50;
const MIN_MODULE_PURPOSE_LENGTH: usize = 20;
const MAX_DELTAS_PER_CHANGE: usize = 10;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ValidationIssue {
    pub level: String,
    pub path: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ValidationReport {
    pub valid: bool,
    pub issues: Vec<ValidationIssue>,
    pub summary: ValidationSummary,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ValidationSummary {
    pub errors: u32,
    pub warnings: u32,
    pub info: u32,
}

impl ValidationReport {
    pub fn new(issues: Vec<ValidationIssue>, strict: bool) -> Self {
        let mut errors = 0u32;
        let mut warnings = 0u32;
        let mut info = 0u32;
        for i in &issues {
            match i.level.as_str() {
                LEVEL_ERROR => errors += 1,
                LEVEL_WARNING => warnings += 1,
                LEVEL_INFO => info += 1,
                _ => {}
            }
        }
        let valid = if strict {
            errors == 0 && warnings == 0
        } else {
            errors == 0
        };
        Self {
            valid,
            issues,
            summary: ValidationSummary {
                errors,
                warnings,
                info,
            },
        }
    }
}

pub fn validate_spec_markdown(markdown: &str, strict: bool) -> ValidationReport {
    let json = parse_spec_show_json("<spec>", markdown);

    let mut issues: Vec<ValidationIssue> = Vec::new();

    if json.overview.trim().is_empty() {
        issues.push(issue(
            LEVEL_ERROR,
            "purpose",
            "Purpose section cannot be empty",
        ));
    } else if json.overview.len() < MIN_PURPOSE_LENGTH {
        issues.push(issue(
            LEVEL_WARNING,
            "purpose",
            "Purpose section is too brief (less than 50 characters)",
        ));
    }

    if json.requirements.is_empty() {
        issues.push(issue(
            LEVEL_ERROR,
            "requirements",
            "Spec must have at least one requirement",
        ));
    }

    for (idx, req) in json.requirements.iter().enumerate() {
        let path = format!("requirements[{idx}]");
        if req.text.trim().is_empty() {
            issues.push(issue(
                LEVEL_ERROR,
                &path,
                "Requirement text cannot be empty",
            ));
        }
        if req.scenarios.is_empty() {
            issues.push(issue(
                LEVEL_ERROR,
                &path,
                "Requirement must have at least one scenario",
            ));
        }
        for (sidx, sc) in req.scenarios.iter().enumerate() {
            let sp = format!("{path}.scenarios[{sidx}]");
            if sc.raw_text.trim().is_empty() {
                issues.push(issue(LEVEL_ERROR, &sp, "Scenario text cannot be empty"));
            }
        }
    }

    ValidationReport::new(issues, strict)
}

pub fn validate_spec(spool_path: &Path, spec_id: &str, strict: bool) -> Result<ValidationReport> {
    let path = crate::paths::spec_markdown_path(spool_path, spec_id);
    let markdown = crate::io::read_to_string(&path)?;
    Ok(validate_spec_markdown(&markdown, strict))
}

pub fn validate_change(
    spool_path: &Path,
    change_id: &str,
    strict: bool,
) -> Result<ValidationReport> {
    let paths = crate::show::read_change_delta_spec_paths(spool_path, change_id)?;
    if paths.is_empty() {
        let issues = vec![issue(
            LEVEL_ERROR,
            "specs",
            "Change must have at least one delta",
        )];
        return Ok(ValidationReport::new(issues, strict));
    }

    let mut files: Vec<DeltaSpecFile> = Vec::new();
    for p in paths {
        files.push(load_delta_spec_file(&p)?);
    }

    let show = parse_change_show_json(change_id, &files);
    let mut issues: Vec<ValidationIssue> = Vec::new();
    if show.deltas.is_empty() {
        issues.push(issue(
            LEVEL_ERROR,
            "specs",
            "Change must have at least one delta",
        ));
        return Ok(ValidationReport::new(issues, strict));
    }

    if show.deltas.len() > MAX_DELTAS_PER_CHANGE {
        issues.push(issue(
            LEVEL_INFO,
            "deltas",
            "Consider splitting changes with more than 10 deltas",
        ));
    }

    for (idx, d) in show.deltas.iter().enumerate() {
        let base = format!("deltas[{idx}]");
        if d.description.trim().is_empty() {
            issues.push(issue(
                LEVEL_ERROR,
                &base,
                "Delta description cannot be empty",
            ));
        } else if d.description.trim().len() < 20 {
            issues.push(issue(
                LEVEL_WARNING,
                &base,
                "Delta description is too brief",
            ));
        }

        if d.requirements.is_empty() {
            issues.push(issue(
                LEVEL_WARNING,
                &base,
                "Delta should include requirements",
            ));
        }

        for (ridx, r) in d.requirements.iter().enumerate() {
            let rp = format!("{base}.requirements[{ridx}]");
            if r.text.trim().is_empty() {
                issues.push(issue(LEVEL_ERROR, &rp, "Requirement text cannot be empty"));
            }
            let up = r.text.to_ascii_uppercase();
            if !up.contains("SHALL") && !up.contains("MUST") {
                issues.push(issue(
                    LEVEL_ERROR,
                    &rp,
                    "Requirement must contain SHALL or MUST keyword",
                ));
            }
            if r.scenarios.is_empty() {
                issues.push(issue(
                    LEVEL_ERROR,
                    &rp,
                    "Requirement must have at least one scenario",
                ));
            }
        }
    }

    Ok(ValidationReport::new(issues, strict))
}

#[derive(Debug, Clone)]
pub struct ResolvedModule {
    pub id: String,
    pub full_name: String,
    pub module_dir: PathBuf,
    pub module_md: PathBuf,
}

pub fn resolve_module(spool_path: &Path, input: &str) -> Result<Option<ResolvedModule>> {
    let modules_dir = crate::paths::modules_dir(spool_path);
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    let mut wanted_id: Option<String> = None;
    if trimmed.chars().all(|c| c.is_ascii_digit()) {
        let num: u32 = trimmed.parse().unwrap_or(0);
        wanted_id = Some(format!("{num:03}"));
    }

    for full_name in crate::discovery::list_module_dir_names(spool_path)? {
        // folder format: NNN_name
        let Some((id_part, _)) = full_name.split_once('_') else {
            continue;
        };
        if id_part.len() != 3 || !id_part.chars().all(|c| c.is_ascii_digit()) {
            continue;
        }

        if full_name == trimmed
            || wanted_id.as_deref().is_some_and(|w| w == id_part)
            || trimmed == id_part
        {
            let module_dir = modules_dir.join(&full_name);
            let module_md = module_dir.join("module.md");
            return Ok(Some(ResolvedModule {
                id: id_part.to_string(),
                full_name,
                module_dir,
                module_md,
            }));
        }
    }

    Ok(None)
}

pub fn validate_module(
    spool_path: &Path,
    module_input: &str,
    strict: bool,
) -> Result<(String, ValidationReport)> {
    let resolved = resolve_module(spool_path, module_input)?;
    let Some(r) = resolved else {
        let issues = vec![issue(LEVEL_ERROR, "module", "Module not found")];
        return Ok((
            module_input.to_string(),
            ValidationReport::new(issues, strict),
        ));
    };

    let mut issues: Vec<ValidationIssue> = Vec::new();
    let md = match crate::io::read_to_string_std(&r.module_md) {
        Ok(c) => c,
        Err(_) => {
            issues.push(issue(
                LEVEL_ERROR,
                "file",
                "Module must have a Purpose section",
            ));
            return Ok((r.full_name, ValidationReport::new(issues, strict)));
        }
    };

    let purpose = extract_section(&md, "Purpose");
    if purpose.trim().is_empty() {
        issues.push(issue(
            LEVEL_ERROR,
            "purpose",
            "Module must have a Purpose section",
        ));
    } else if purpose.trim().len() < MIN_MODULE_PURPOSE_LENGTH {
        issues.push(issue(
            LEVEL_ERROR,
            "purpose",
            "Module purpose must be at least 20 characters",
        ));
    }

    let scope = extract_section(&md, "Scope");
    if scope.trim().is_empty() {
        issues.push(issue(
            LEVEL_ERROR,
            "scope",
            "Module must have a Scope section with at least one capability (use \"*\" for unrestricted)",
        ));
    }

    Ok((r.full_name, ValidationReport::new(issues, strict)))
}

fn extract_section(markdown: &str, header: &str) -> String {
    let mut in_section = false;
    let mut out = String::new();
    let normalized = markdown.replace('\r', "");
    for raw in normalized.split('\n') {
        let line = raw.trim_end();
        if let Some(h) = line.strip_prefix("## ") {
            let title = h.trim();
            if title.eq_ignore_ascii_case(header) {
                in_section = true;
                continue;
            }
            if in_section {
                break;
            }
        }
        if in_section {
            out.push_str(line);
            out.push('\n');
        }
    }
    out
}
