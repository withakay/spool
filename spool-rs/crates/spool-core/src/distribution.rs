use miette::{miette, Result};
use std::path::{Path, PathBuf};

const GITHUB_REPO: &str = "withakay/spool";
const SPOOL_SKILLS_PATH: &str = "spool-skills";

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SourceMode {
    Local(PathBuf),
    Remote { tag: String },
}

#[derive(Debug, Clone)]
pub struct FileManifest {
    pub source: String,
    pub dest: PathBuf,
    pub is_dir: bool,
}

pub fn detect_source_mode(repo_root: &Path, version: &str) -> SourceMode {
    let local_skills = repo_root.join(SPOOL_SKILLS_PATH);
    if local_skills.exists() && local_skills.is_dir() {
        return SourceMode::Local(local_skills);
    }
    SourceMode::Remote {
        tag: format!("v{}", version),
    }
}

pub fn cache_dir(version: &str) -> Result<PathBuf> {
    let home = std::env::var("HOME").map_err(|_| miette!("HOME not set"))?;
    let cache = PathBuf::from(home)
        .join(".config")
        .join("spool")
        .join("cache")
        .join(SPOOL_SKILLS_PATH)
        .join(version);
    Ok(cache)
}

pub fn build_github_url(tag: &str, path: &str) -> String {
    format!(
        "https://raw.githubusercontent.com/{}/{}/{}/{}",
        GITHUB_REPO, tag, SPOOL_SKILLS_PATH, path
    )
}

pub fn fetch_file(url: &str) -> Result<Vec<u8>> {
    let output = std::process::Command::new("curl")
        .arg("-fsSL")
        .arg(url)
        .output()
        .map_err(|e| miette!("Failed to execute curl: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(miette!("curl failed: {}", stderr));
    }

    Ok(output.stdout)
}

pub fn fetch_or_cache(mode: &SourceMode, rel_path: &str, version: &str) -> Result<Vec<u8>> {
    match mode {
        SourceMode::Local(base) => {
            let src = base.join(rel_path);
            std::fs::read(&src)
                .map_err(|e| miette!("Failed to read local file {}: {}", src.display(), e))
        }
        SourceMode::Remote { tag } => {
            let cache = cache_dir(version)?;
            let cached_file = cache.join(rel_path);

            if cached_file.exists() {
                return std::fs::read(&cached_file)
                    .map_err(|e| miette!("Failed to read cached file: {}", e));
            }

            let url = build_github_url(tag, rel_path);
            let bytes = fetch_file(&url).or_else(|_| {
                let fallback_url = build_github_url("main", rel_path);
                fetch_file(&fallback_url)
            })?;

            if let Some(parent) = cached_file.parent() {
                crate::io::create_dir_all(parent)?;
            }
            crate::io::write(&cached_file, &bytes)?;

            Ok(bytes)
        }
    }
}

pub fn copy_dir_recursive(src: &Path, dest: &Path) -> Result<()> {
    if !src.exists() {
        return Err(miette!(
            "Source directory does not exist: {}",
            src.display()
        ));
    }

    crate::io::create_dir_all(dest)?;

    let entries = std::fs::read_dir(src)
        .map_err(|e| miette!("Failed to read directory {}: {}", src.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| miette!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let file_name = entry.file_name();
        let dest_path = dest.join(&file_name);

        if path.is_dir() {
            copy_dir_recursive(&path, &dest_path)?;
        } else {
            let bytes = std::fs::read(&path)
                .map_err(|e| miette!("Failed to read {}: {}", path.display(), e))?;
            crate::io::write(&dest_path, &bytes)?;
        }
    }

    Ok(())
}

pub fn opencode_manifests(config_dir: &Path) -> Vec<FileManifest> {
    vec![
        FileManifest {
            source: "adapters/opencode/spool-skills.js".to_string(),
            dest: config_dir.join("plugins").join("spool-skills.js"),
            is_dir: false,
        },
        FileManifest {
            source: "skills".to_string(),
            dest: config_dir.join("skills").join("spool-skills"),
            is_dir: true,
        },
    ]
}

pub fn claude_manifests(project_root: &Path) -> Vec<FileManifest> {
    vec![FileManifest {
        source: "adapters/claude/session-start.sh".to_string(),
        dest: project_root.join(".claude").join("session-start.sh"),
        is_dir: false,
    }]
}

pub fn codex_manifests() -> Result<Vec<FileManifest>> {
    let home = std::env::var("HOME").map_err(|_| miette!("HOME not set"))?;
    let codex_dir = PathBuf::from(home).join(".codex").join("instructions");
    Ok(vec![FileManifest {
        source: ".codex/spool-skills-bootstrap.md".to_string(),
        dest: codex_dir.join("spool-skills-bootstrap.md"),
        is_dir: false,
    }])
}

pub fn install_manifests(
    manifests: &[FileManifest],
    mode: &SourceMode,
    version: &str,
) -> Result<()> {
    for manifest in manifests {
        if manifest.is_dir {
            match mode {
                SourceMode::Local(base) => {
                    let src = base.join(&manifest.source);
                    copy_dir_recursive(&src, &manifest.dest)?;
                }
                SourceMode::Remote { .. } => {
                    return Err(miette!(
                        "Directory installation from remote not yet implemented: {}",
                        manifest.source
                    ));
                }
            }
        } else {
            let bytes = fetch_or_cache(mode, &manifest.source, version)?;
            if let Some(parent) = manifest.dest.parent() {
                crate::io::create_dir_all(parent)?;
            }
            crate::io::write(&manifest.dest, &bytes)?;
        }
    }
    Ok(())
}
