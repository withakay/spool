use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

const PROJECT_CONFIG_FILE_NAME: &str = "spool.json";

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
}

impl ConfigContext {
    pub fn from_process_env() -> Self {
        let xdg_config_home = std::env::var_os("XDG_CONFIG_HOME").map(PathBuf::from);

        // Use HOME consistently across platforms for tests.
        let home_dir = std::env::var_os("HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("USERPROFILE").map(PathBuf::from));

        Self {
            xdg_config_home,
            home_dir,
        }
    }
}

pub fn load_project_config(project_root: &Path) -> Option<ProjectConfig> {
    let path = project_root.join(PROJECT_CONFIG_FILE_NAME);
    let Ok(contents) = std::fs::read_to_string(&path) else {
        return None;
    };

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

pub fn global_config_path(ctx: &ConfigContext) -> Option<PathBuf> {
    #[cfg(windows)]
    {
        // TS uses APPDATA on Windows. We accept HOME/USERPROFILE for tests but prefer APPDATA.
        let appdata = std::env::var_os("APPDATA").map(PathBuf::from);
        let base = appdata
            .or_else(|| ctx.xdg_config_home.clone())
            .or_else(|| ctx.home_dir.clone());
        return base.map(|b| b.join("spool").join("config.json"));
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

        Some(base.join("spool").join("config.json"))
    }
}

pub fn load_global_config(ctx: &ConfigContext) -> GlobalConfig {
    let Some(path) = global_config_path(ctx) else {
        return GlobalConfig::default();
    };

    let Ok(contents) = std::fs::read_to_string(&path) else {
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
    fn global_config_path_prefers_xdg() {
        let ctx = ConfigContext {
            xdg_config_home: Some(PathBuf::from("/tmp/xdg")),
            home_dir: Some(PathBuf::from("/tmp/home")),
        };
        #[cfg(not(windows))]
        assert_eq!(
            global_config_path(&ctx).unwrap(),
            PathBuf::from("/tmp/xdg/spool/config.json")
        );
    }

    // spool_dir tests live in crate::spool_dir.
}
