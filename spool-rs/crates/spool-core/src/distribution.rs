use miette::{Result, miette};
use spool_templates::{
    commands_files, get_adapter_file, get_command_file, get_skill_file, skills_files,
};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct FileManifest {
    /// Source path relative to embedded assets (e.g., "brainstorming/SKILL.md" for skills)
    pub source: String,
    /// Destination path on disk
    pub dest: PathBuf,
    /// Asset type determines which embedded directory to read from
    pub asset_type: AssetType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AssetType {
    Skill,
    Adapter,
    Command,
}

/// Returns manifest entries for all spool-skills.
/// Source paths are relative to assets/skills/ (e.g., "brainstorming/SKILL.md")
/// Dest paths have spool- prefix added if not already present
/// (e.g., "brainstorming/SKILL.md" -> "spool-brainstorming/SKILL.md")
/// (e.g., "spool/SKILL.md" -> "spool/SKILL.md" - no double prefix)
fn spool_skills_manifests(skills_dir: &Path) -> Vec<FileManifest> {
    let mut manifests = Vec::new();

    // Get all skill files from embedded assets
    for file in skills_files() {
        let rel_path = file.relative_path;
        // Extract skill name from path (e.g., "brainstorming/SKILL.md" -> "brainstorming")
        let parts: Vec<&str> = rel_path.split('/').collect();
        if parts.is_empty() {
            continue;
        }
        let skill_name = parts[0];

        // Build destination path, adding spool- prefix only if not already present
        let dest_skill_name = if skill_name.starts_with("spool") {
            skill_name.to_string()
        } else {
            format!("spool-{}", skill_name)
        };

        let rest = if parts.len() > 1 {
            parts[1..].join("/")
        } else {
            rel_path.to_string()
        };
        let dest = skills_dir.join(format!("{}/{}", dest_skill_name, rest));

        manifests.push(FileManifest {
            source: rel_path.to_string(),
            dest,
            asset_type: AssetType::Skill,
        });
    }

    manifests
}

/// Returns manifest entries for all spool commands.
/// Commands are copied directly to the commands directory with their original names.
fn spool_commands_manifests(commands_dir: &Path) -> Vec<FileManifest> {
    let mut manifests = Vec::new();

    for file in commands_files() {
        let rel_path = file.relative_path;
        manifests.push(FileManifest {
            source: rel_path.to_string(),
            dest: commands_dir.join(rel_path),
            asset_type: AssetType::Command,
        });
    }

    manifests
}

pub fn opencode_manifests(config_dir: &Path) -> Vec<FileManifest> {
    let mut out = Vec::new();

    out.push(FileManifest {
        source: "opencode/spool-skills.js".to_string(),
        dest: config_dir.join("plugins").join("spool-skills.js"),
        asset_type: AssetType::Adapter,
    });

    // Skills go directly under skills/ (flat structure with spool- prefix)
    let skills_dir = config_dir.join("skills");
    out.extend(spool_skills_manifests(&skills_dir));

    // Commands go under commands/
    let commands_dir = config_dir.join("commands");
    out.extend(spool_commands_manifests(&commands_dir));

    out
}

pub fn claude_manifests(project_root: &Path) -> Vec<FileManifest> {
    let mut out = vec![FileManifest {
        source: "claude/session-start.sh".to_string(),
        dest: project_root.join(".claude").join("session-start.sh"),
        asset_type: AssetType::Adapter,
    }];

    // Skills go directly under .claude/skills/ (flat structure with spool- prefix)
    let skills_dir = project_root.join(".claude").join("skills");
    out.extend(spool_skills_manifests(&skills_dir));

    // Commands go under .claude/commands/
    let commands_dir = project_root.join(".claude").join("commands");
    out.extend(spool_commands_manifests(&commands_dir));

    out
}

pub fn codex_manifests(project_root: &Path) -> Vec<FileManifest> {
    let mut out = vec![FileManifest {
        source: "codex/spool-skills-bootstrap.md".to_string(),
        dest: project_root
            .join(".codex")
            .join("instructions")
            .join("spool-skills-bootstrap.md"),
        asset_type: AssetType::Adapter,
    }];

    // Skills go directly under .codex/skills/ (flat structure with spool- prefix)
    let skills_dir = project_root.join(".codex").join("skills");
    out.extend(spool_skills_manifests(&skills_dir));

    // Commands go under .codex/prompts/ (Codex uses "prompts" terminology)
    let commands_dir = project_root.join(".codex").join("prompts");
    out.extend(spool_commands_manifests(&commands_dir));

    out
}

pub fn github_manifests(project_root: &Path) -> Vec<FileManifest> {
    // Skills go directly under .github/skills/ (flat structure with spool- prefix)
    let skills_dir = project_root.join(".github").join("skills");
    let mut out = spool_skills_manifests(&skills_dir);

    // Commands go under .github/prompts/ (GitHub uses "prompts" terminology)
    // Note: GitHub Copilot uses .prompt.md suffix convention
    let prompts_dir = project_root.join(".github").join("prompts");
    for file in commands_files() {
        let rel_path = file.relative_path;
        // Convert spool-apply.md -> spool-apply.prompt.md for GitHub
        let dest_name = if let Some(stripped) = rel_path.strip_suffix(".md") {
            format!("{stripped}.prompt.md")
        } else {
            rel_path.to_string()
        };
        out.push(FileManifest {
            source: rel_path.to_string(),
            dest: prompts_dir.join(dest_name),
            asset_type: AssetType::Command,
        });
    }

    out
}

/// Install manifests from embedded assets to disk.
pub fn install_manifests(manifests: &[FileManifest]) -> Result<()> {
    for manifest in manifests {
        let bytes = match manifest.asset_type {
            AssetType::Skill => get_skill_file(&manifest.source).ok_or_else(|| {
                miette!(
                    "Skill file not found in embedded assets: {}",
                    manifest.source
                )
            })?,
            AssetType::Adapter => get_adapter_file(&manifest.source).ok_or_else(|| {
                miette!(
                    "Adapter file not found in embedded assets: {}",
                    manifest.source
                )
            })?,
            AssetType::Command => get_command_file(&manifest.source).ok_or_else(|| {
                miette!(
                    "Command file not found in embedded assets: {}",
                    manifest.source
                )
            })?,
        };

        if let Some(parent) = manifest.dest.parent() {
            crate::io::create_dir_all(parent)?;
        }
        crate::io::write(&manifest.dest, bytes)?;
    }
    Ok(())
}
