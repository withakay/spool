use std::path::{Path, PathBuf};

use crate::config::{ConfigContext, load_global_config, load_project_config};

pub fn get_spool_dir_name(project_root: &Path, ctx: &ConfigContext) -> String {
    // Priority order matches TS:
    // 1. Repo-level spool.json projectPath
    // 2. Global config (~/.config/spool/config.json) projectPath
    // 3. Default: '.spool'
    if let Some(project_path) = load_project_config(project_root)
        .and_then(|c| c.project_path)
        .filter(|s| !s.trim().is_empty())
    {
        return project_path;
    }

    if let Some(project_path) = load_global_config(ctx)
        .project_path
        .filter(|s| !s.trim().is_empty())
    {
        return project_path;
    }

    ".spool".to_string()
}

pub fn get_spool_path(project_root: &Path, ctx: &ConfigContext) -> PathBuf {
    let root = absolutize_and_normalize(project_root);
    root.join(get_spool_dir_name(&root, ctx))
}

fn absolutize_and_normalize(input: &Path) -> PathBuf {
    let abs = if input.is_absolute() {
        input.to_path_buf()
    } else {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(input)
    };

    lexical_normalize(&abs)
}

fn lexical_normalize(path: &Path) -> PathBuf {
    use std::path::Component;

    let mut out = PathBuf::new();
    let mut stack: Vec<std::ffi::OsString> = Vec::new();
    let mut rooted = false;

    for c in path.components() {
        match c {
            Component::Prefix(p) => {
                out.push(p.as_os_str());
            }
            Component::RootDir => {
                rooted = true;
            }
            Component::CurDir => {}
            Component::ParentDir => {
                if let Some(last) = stack.last()
                    && last != ".."
                {
                    stack.pop();
                    continue;
                }
                if !rooted {
                    stack.push(std::ffi::OsString::from(".."));
                }
            }
            Component::Normal(seg) => {
                stack.push(seg.to_os_string());
            }
        }
    }

    if rooted {
        out.push(std::path::MAIN_SEPARATOR.to_string());
    }
    for seg in stack {
        out.push(seg);
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_spool_dir_name_defaults_to_dot_spool() {
        let td = tempfile::tempdir().unwrap();
        let ctx = ConfigContext::default();
        assert_eq!(get_spool_dir_name(td.path(), &ctx), ".spool");
    }

    #[test]
    fn repo_config_overrides_global_config() {
        let td = tempfile::tempdir().unwrap();
        crate::io::write_std(
            &td.path().join("spool.json"),
            "{\"projectPath\":\".repo-spool\"}",
        )
        .unwrap();

        let home = tempfile::tempdir().unwrap();
        let cfg_dir = home.path().join(".config/spool");
        crate::io::create_dir_all_std(&cfg_dir).unwrap();
        crate::io::write_std(
            &cfg_dir.join("config.json"),
            "{\"projectPath\":\".global-spool\"}",
        )
        .unwrap();

        let ctx = ConfigContext {
            xdg_config_home: None,
            home_dir: Some(home.path().to_path_buf()),
        };

        assert_eq!(get_spool_dir_name(td.path(), &ctx), ".repo-spool");
    }

    #[test]
    fn get_spool_path_normalizes_dotdot_segments() {
        let td = tempfile::tempdir().unwrap();
        let repo = td.path();
        crate::io::create_dir_all_std(&repo.join("a")).unwrap();
        crate::io::create_dir_all_std(&repo.join("b")).unwrap();

        let ctx = ConfigContext::default();
        let p = repo.join("a/../b");

        let spool_path = get_spool_path(&p, &ctx);
        assert!(spool_path.ends_with("b/.spool"));
    }
}
