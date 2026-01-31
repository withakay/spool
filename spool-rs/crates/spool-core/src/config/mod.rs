use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::Value;

const REPO_CONFIG_FILE_NAME: &str = "spool.json";
const REPO_DOT_CONFIG_FILE_NAME: &str = ".spool.json";
const SPOOL_DIR_CONFIG_FILE_NAME: &str = "config.json";

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct GlobalConfig {
    #[serde(rename = "projectPath")]
    pub project_path: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProjectConfig {
    #[serde(rename = "projectPath")]
    pub project_path: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct ConfigContext {
    pub xdg_config_home: Option<PathBuf>,
    pub home_dir: Option<PathBuf>,
    pub project_dir: Option<PathBuf>,
}

impl ConfigContext {
    pub fn from_process_env() -> Self {
        let xdg_config_home = std::env::var_os("XDG_CONFIG_HOME").map(PathBuf::from);

        // Use HOME consistently across platforms for tests.
        let home_dir = std::env::var_os("HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("USERPROFILE").map(PathBuf::from));

        let project_dir = std::env::var_os("PROJECT_DIR").map(PathBuf::from);
        let project_dir = project_dir.map(|p| {
            if p.is_absolute() {
                return p;
            }
            let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
            cwd.join(p)
        });

        Self {
            xdg_config_home,
            home_dir,
            project_dir,
        }
    }
}

pub fn load_project_config(project_root: &Path) -> Option<ProjectConfig> {
    let path = project_root.join(REPO_CONFIG_FILE_NAME);
    let contents = crate::io::read_to_string_optional(&path).ok().flatten()?;

    match serde_json::from_str(&contents) {
        Ok(v) => Some(v),
        Err(_) => {
            eprintln!(
                "Warning: Invalid JSON in {}, ignoring project config",
                path.display()
            );
            None
        }
    }
}

fn load_json_object(path: &Path) -> Option<Value> {
    let Some(contents) = crate::io::read_to_string_optional(path).ok().flatten() else {
        return None;
    };

    let v: Value = match serde_json::from_str(&contents) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("Warning: Invalid JSON in {}, ignoring", path.display());
            return None;
        }
    };

    match v {
        Value::Object(_) => Some(v),
        _ => {
            eprintln!(
                "Warning: Expected JSON object in {}, ignoring",
                path.display()
            );
            None
        }
    }
}

fn merge_json(base: &mut Value, overlay: Value) {
    match (base, overlay) {
        (Value::Object(base_map), Value::Object(overlay_map)) => {
            for (k, v) in overlay_map {
                let entry = base_map.get_mut(&k);
                if let Some(base_v) = entry {
                    merge_json(base_v, v);
                    continue;
                }
                base_map.insert(k, v);
            }
        }
        (base_v, overlay_v) => {
            *base_v = overlay_v;
        }
    }
}

fn project_path_from_json(v: &Value) -> Option<String> {
    let Value::Object(map) = v else {
        return None;
    };
    let Some(Value::String(s)) = map.get("projectPath") else {
        return None;
    };
    if s.trim().is_empty() {
        return None;
    }
    Some(s.clone())
}

/// Returns a repo-local `projectPath` override (Spool working directory name).
///
/// Precedence (low -> high): `spool.json`, then `.spool.json`.
///
/// NOTE: This does *not* consult `<spoolDir>/config.json` to avoid cycles.
pub fn load_repo_project_path_override(project_root: &Path) -> Option<String> {
    let mut out = None;

    let repo = project_root.join(REPO_CONFIG_FILE_NAME);
    if let Some(v) = load_json_object(&repo)
        && let Some(p) = project_path_from_json(&v)
    {
        out = Some(p);
    }

    let repo = project_root.join(REPO_DOT_CONFIG_FILE_NAME);
    if let Some(v) = load_json_object(&repo)
        && let Some(p) = project_path_from_json(&v)
    {
        out = Some(p);
    }

    out
}

#[derive(Debug, Clone)]
pub struct CascadingProjectConfig {
    pub merged: Value,
    pub loaded_from: Vec<PathBuf>,
}

pub fn project_config_paths(project_root: &Path, spool_path: &Path, ctx: &ConfigContext) -> Vec<PathBuf> {
    let mut out: Vec<PathBuf> = Vec::new();

    out.push(project_root.join(REPO_CONFIG_FILE_NAME));
    out.push(project_root.join(REPO_DOT_CONFIG_FILE_NAME));
    out.push(spool_path.join(SPOOL_DIR_CONFIG_FILE_NAME));
    if let Some(p) = &ctx.project_dir {
        out.push(p.join(SPOOL_DIR_CONFIG_FILE_NAME));
    }

    out
}

/// Load and merge project configuration sources in precedence order.
///
/// Precedence (low -> high):
/// 1) `<repo-root>/spool.json`
/// 2) `<repo-root>/.spool.json`
/// 3) `<spoolDir>/config.json`
/// 4) `$PROJECT_DIR/config.json` (when set)
pub fn load_cascading_project_config(
    project_root: &Path,
    spool_path: &Path,
    ctx: &ConfigContext,
) -> CascadingProjectConfig {
    let mut merged = Value::Object(serde_json::Map::new());
    let mut loaded_from: Vec<PathBuf> = Vec::new();

    let paths = project_config_paths(project_root, spool_path, ctx);
    for path in paths {
        let Some(v) = load_json_object(&path) else {
            continue;
        };
        merge_json(&mut merged, v);
        loaded_from.push(path);
    }

    CascadingProjectConfig { merged, loaded_from }
}

pub fn global_config_path(ctx: &ConfigContext) -> Option<PathBuf> {
    spool_config_dir(ctx).map(|d| d.join("config.json"))
}

pub fn spool_config_dir(ctx: &ConfigContext) -> Option<PathBuf> {
    #[cfg(windows)]
    {
        // TS uses APPDATA on Windows. We accept HOME/USERPROFILE for tests but prefer APPDATA.
        let appdata = std::env::var_os("APPDATA").map(PathBuf::from);
        let base = appdata
            .or_else(|| ctx.xdg_config_home.clone())
            .or_else(|| ctx.home_dir.clone());
        return base.map(|b| b.join("spool"));
    }

    #[cfg(not(windows))]
    {
        let base = if let Some(xdg) = &ctx.xdg_config_home {
            xdg.clone()
        } else if let Some(home) = &ctx.home_dir {
            home.join(".config")
        } else {
            return None;
        };

        Some(base.join("spool"))
    }
}

pub fn load_global_config(ctx: &ConfigContext) -> GlobalConfig {
    let Some(path) = global_config_path(ctx) else {
        return GlobalConfig::default();
    };

    let Some(contents) = crate::io::read_to_string_optional(&path).ok().flatten() else {
        return GlobalConfig::default();
    };

    match serde_json::from_str(&contents) {
        Ok(v) => v,
        Err(_) => {
            eprintln!(
                "Warning: Invalid JSON in {}, using defaults",
                path.display()
            );
            GlobalConfig::default()
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cascading_project_config_merges_sources_in_order_with_scalar_override() {
        let repo = tempfile::tempdir().unwrap();

        crate::io::write_std(
            &repo.path().join("spool.json"),
            "{\"obj\":{\"a\":1},\"arr\":[1],\"x\":\"repo\"}",
        )
        .unwrap();
        crate::io::write_std(
            &repo.path().join(".spool.json"),
            "{\"obj\":{\"b\":2},\"arr\":[2],\"y\":\"dot\"}",
        )
        .unwrap();

        let project_dir = tempfile::tempdir().unwrap();
        crate::io::write_std(
            &project_dir.path().join("config.json"),
            "{\"obj\":{\"c\":3},\"x\":\"project_dir\"}",
        )
        .unwrap();

        let ctx = ConfigContext {
            xdg_config_home: None,
            home_dir: None,
            project_dir: Some(project_dir.path().to_path_buf()),
        };
        let spool_path = crate::spool_dir::get_spool_path(repo.path(), &ctx);
        crate::io::create_dir_all_std(&spool_path).unwrap();
        crate::io::write_std(
            &spool_path.join("config.json"),
            "{\"obj\":{\"a\":9},\"z\":\"spool_dir\"}",
        )
        .unwrap();

        let r = load_cascading_project_config(repo.path(), &spool_path, &ctx);

        assert_eq!(
            r.merged,
            serde_json::json!({
                "obj": {"a": 9, "b": 2, "c": 3},
                "arr": [2],
                "x": "project_dir",
                "y": "dot",
                "z": "spool_dir"
            })
        );

        assert_eq!(
            r.loaded_from,
            vec![
                repo.path().join("spool.json"),
                repo.path().join(".spool.json"),
                spool_path.join("config.json"),
                project_dir.path().join("config.json"),
            ]
        );
    }

    #[test]
    fn cascading_project_config_ignores_invalid_json_sources() {
        let repo = tempfile::tempdir().unwrap();

        crate::io::write_std(
            &repo.path().join("spool.json"),
            "{\"a\":1}",
        )
        .unwrap();
        crate::io::write_std(&repo.path().join(".spool.json"), "not-json").unwrap();

        let ctx = ConfigContext::default();
        let spool_path = crate::spool_dir::get_spool_path(repo.path(), &ctx);

        let r = load_cascading_project_config(repo.path(), &spool_path, &ctx);
        assert_eq!(r.merged, serde_json::json!({"a": 1}));

        assert_eq!(r.loaded_from, vec![repo.path().join("spool.json")]);
    }

    #[test]
    fn global_config_path_prefers_xdg() {
        let ctx = ConfigContext {
            xdg_config_home: Some(PathBuf::from("/tmp/xdg")),
            home_dir: Some(PathBuf::from("/tmp/home")),
            project_dir: None,
        };
        #[cfg(not(windows))]
        assert_eq!(
            global_config_path(&ctx).unwrap(),
            PathBuf::from("/tmp/xdg/spool/config.json")
        );
    }

    #[test]
    fn spool_config_dir_prefers_xdg() {
        let ctx = ConfigContext {
            xdg_config_home: Some(PathBuf::from("/tmp/xdg")),
            home_dir: Some(PathBuf::from("/tmp/home")),
            project_dir: None,
        };
        #[cfg(not(windows))]
        assert_eq!(
            spool_config_dir(&ctx).unwrap(),
            PathBuf::from("/tmp/xdg/spool")
        );
    }

    // spool_dir tests live in crate::spool_dir.
}
