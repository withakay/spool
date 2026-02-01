use spool_core::distribution::{
    FileManifest, SourceMode, detect_source_mode, fetch_or_cache, install_manifests,
};
use std::path::Path;
use std::sync::{Mutex, OnceLock};

static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

struct EnvVarGuard {
    key: &'static str,
    prev: Option<std::ffi::OsString>,
}

impl EnvVarGuard {
    fn set(key: &'static str, value: &std::ffi::OsStr) -> Self {
        let prev = std::env::var_os(key);
        // Rust marks env mutation as unsafe in this toolchain.
        unsafe {
            std::env::set_var(key, value);
        }
        Self { key, prev }
    }

    fn unset(key: &'static str) -> Self {
        let prev = std::env::var_os(key);
        unsafe {
            std::env::remove_var(key);
        }
        Self { key, prev }
    }
}

impl Drop for EnvVarGuard {
    fn drop(&mut self) {
        match &self.prev {
            Some(v) => unsafe {
                std::env::set_var(self.key, v);
            },
            None => unsafe {
                std::env::remove_var(self.key);
            },
        }
    }
}

fn write(path: &Path, contents: &str) {
    let Some(parent) = path.parent() else {
        panic!("path has no parent: {}", path.display());
    };
    std::fs::create_dir_all(parent).unwrap();
    std::fs::write(path, contents).unwrap();
}

#[test]
fn detect_source_mode_prefers_local_when_spool_skills_exists() {
    let td = tempfile::tempdir().unwrap();
    let repo_root = td.path();
    std::fs::create_dir_all(repo_root.join("spool-skills")).unwrap();

    let mode = detect_source_mode(repo_root, "0.0.0-test");
    match mode {
        SourceMode::Local(p) => {
            assert!(p.ends_with("spool-skills"));
        }
        SourceMode::Remote { .. } => panic!("expected Local"),
    }
}

#[test]
fn fetch_or_cache_local_reads_bytes() {
    let td = tempfile::tempdir().unwrap();
    let repo_root = td.path();
    let base = repo_root.join("spool-skills");

    write(
        &base.join("skills").join("brainstorming").join("SKILL.md"),
        "# Brainstorming\n",
    );

    let mode = SourceMode::Local(base);
    let bytes = fetch_or_cache(&mode, "skills/brainstorming/SKILL.md", "0.0.0-test").unwrap();
    assert!(String::from_utf8(bytes).unwrap().contains("Brainstorming"));
}

#[test]
fn install_manifests_local_writes_skill_files_under_target_dir() {
    let td = tempfile::tempdir().unwrap();
    let repo_root = td.path();
    let base = repo_root.join("spool-skills");

    write(
        &base.join("skills").join("brainstorming").join("SKILL.md"),
        "# Brainstorming\n",
    );
    write(
        &base
            .join("adapters")
            .join("opencode")
            .join("spool-skills.js"),
        "// plugin\n",
    );

    let out_root = tempfile::tempdir().unwrap();
    let config_dir = out_root.path().join(".opencode");
    // Use a minimal manifest set so the test only needs to create one skill.
    let manifests = vec![
        FileManifest {
            source: "adapters/opencode/spool-skills.js".to_string(),
            dest: config_dir.join("plugins").join("spool-skills.js"),
            is_dir: false,
        },
        FileManifest {
            source: "skills/brainstorming/SKILL.md".to_string(),
            dest: config_dir
                .join("skills")
                .join("spool-brainstorming")
                .join("SKILL.md"),
            is_dir: false,
        },
    ];

    let mode = SourceMode::Local(base);
    install_manifests(&manifests, &mode, "0.0.0-test").unwrap();

    assert!(config_dir.join("plugins").join("spool-skills.js").exists());
    assert!(
        config_dir
            .join("skills")
            .join("spool-brainstorming")
            .join("SKILL.md")
            .exists()
    );
}

#[test]
fn detect_source_mode_remote_when_spool_skills_missing() {
    let td = tempfile::tempdir().unwrap();
    let repo_root = td.path();

    let mode = detect_source_mode(repo_root, "1.2.3");
    match mode {
        SourceMode::Local(_) => panic!("expected Remote"),
        SourceMode::Remote { tag } => {
            assert_eq!(tag, "v1.2.3");
        }
    }
}

#[test]
fn fetch_or_cache_remote_uses_cache_when_present() {
    // Avoid calling curl by priming the cache.
    let _lock = ENV_LOCK.get_or_init(|| Mutex::new(())).lock().unwrap();

    let home = tempfile::tempdir().unwrap();
    let _guard = EnvVarGuard::set("HOME", home.path().as_os_str());

    let version = "0.0.0-test";
    let rel = "skills/brainstorming/SKILL.md";
    let cache = spool_core::distribution::cache_dir(version).unwrap();
    std::fs::create_dir_all(cache.join("skills/brainstorming")).unwrap();
    std::fs::write(cache.join(rel), "# Cached\n").unwrap();

    let mode = SourceMode::Remote {
        tag: "v0.0.0-test".to_string(),
    };
    let bytes = fetch_or_cache(&mode, rel, version).unwrap();
    assert!(String::from_utf8(bytes).unwrap().contains("Cached"));
}

#[test]
fn build_github_url_formats_expected() {
    let url = spool_core::distribution::build_github_url("v1.2.3", "skills/foo/SKILL.md");
    assert!(url.contains("raw.githubusercontent.com"));
    assert!(url.contains("withakay/spool"));
    assert!(url.contains("/v1.2.3/"));
    assert!(url.ends_with("/spool-skills/skills/foo/SKILL.md"));
}

#[test]
fn copy_dir_recursive_errors_when_source_missing() {
    let td = tempfile::tempdir().unwrap();
    let missing = td.path().join("nope");
    let dest = td.path().join("out");

    let err = spool_core::distribution::copy_dir_recursive(&missing, &dest)
        .unwrap_err()
        .to_string();
    assert!(err.contains("Source directory does not exist"));
}

#[test]
fn cache_dir_errors_when_home_not_set() {
    let _lock = ENV_LOCK.get_or_init(|| Mutex::new(())).lock().unwrap();

    let _guard = EnvVarGuard::unset("HOME");
    let err = spool_core::distribution::cache_dir("0.0.0-test")
        .unwrap_err()
        .to_string();
    assert!(err.contains("HOME not set"));
}
