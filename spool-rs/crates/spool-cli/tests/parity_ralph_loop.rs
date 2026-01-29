use spool_test_support::{copy_dir_all, run_rust_candidate, run_ts_oracle};
use std::path::Path;
use std::sync::Mutex;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

static ENV_LOCK: Mutex<()> = Mutex::new(());

fn make_fixture_repo() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("tempdir");

    // Minimal spool repo layout for ralph.
    let m6 = td.path().join(".spool/modules/006_spool-rs-port");
    std::fs::create_dir_all(&m6).unwrap();
    std::fs::write(m6.join("module.md"), "# 006_spool-rs-port\n").unwrap();

    let changes_dir = td.path().join(".spool/changes");
    std::fs::create_dir_all(&changes_dir).unwrap();

    let change_id = "006-09_fixture";
    let c = changes_dir.join(change_id);
    std::fs::create_dir_all(&c).unwrap();
    std::fs::write(c.join("proposal.md"), "# fixture\n").unwrap();

    td
}

fn make_opencode_stub_bin() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("tempdir");
    let bin = td.path().join("bin");
    std::fs::create_dir_all(&bin).unwrap();
    let opencode = bin.join("opencode");

    // Deterministic stub: always emits completion promise.
    let script = r#"#!/bin/sh
echo "stub opencode"
echo "<promise>COMPLETE</promise>"
exit 0
"#;
    std::fs::write(&opencode, script).unwrap();

    #[cfg(unix)]
    {
        let mut perms = std::fs::metadata(&opencode).unwrap().permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&opencode, perms).unwrap();
    }

    td
}

fn with_path_prefix<T>(prefix: &Path, f: impl FnOnce() -> T) -> T {
    let _guard = ENV_LOCK.lock().expect("env lock");
    let old = std::env::var_os("PATH").unwrap_or_default();
    let sep = if cfg!(windows) { ";" } else { ":" };
    let combined = format!(
        "{p}{sep}{old}",
        p = prefix.to_string_lossy(),
        sep = sep,
        old = old.to_string_lossy()
    );
    // Rust 1.93+ marks `set_var` unsafe due to potential UB when racing.
    unsafe {
        std::env::set_var("PATH", combined);
    }
    let out = f();
    unsafe {
        std::env::set_var("PATH", old);
    }
    out
}

fn normalize_state_json(bytes: &[u8]) -> serde_json::Value {
    let mut v: serde_json::Value = serde_json::from_slice(bytes).expect("valid json");
    if let Some(obj) = v.as_object_mut() {
        if let Some(hist) = obj.get_mut("history").and_then(|h| h.as_array_mut()) {
            for entry in hist.iter_mut() {
                if let Some(e) = entry.as_object_mut() {
                    e.insert(
                        "timestamp".to_string(),
                        serde_json::Value::String("<ts>".to_string()),
                    );
                    e.insert(
                        "duration".to_string(),
                        serde_json::Value::String("<dur>".to_string()),
                    );
                }
            }
        }
    }
    v
}

#[test]
fn parity_ralph_min_iterations_and_state_layout_match_oracle() {
    let base = make_fixture_repo();
    let repo_ts = tempfile::tempdir().expect("repo");
    let repo_rs = tempfile::tempdir().expect("repo");
    copy_dir_all(base.path(), repo_ts.path()).unwrap();
    copy_dir_all(base.path(), repo_rs.path()).unwrap();

    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let stub = make_opencode_stub_bin();
    let stub_bin = stub.path().join("bin");

    with_path_prefix(&stub_bin, || {
        let args = [
            "ralph",
            "--harness",
            "opencode",
            "--change",
            "006-09_fixture",
            "--no-interactive",
            "--no-commit",
            "--min-iterations",
            "2",
            "--max-iterations",
            "3",
            "--completion-promise",
            "COMPLETE",
            "do the thing",
        ];

        let ts = run_ts_oracle(&args, repo_ts.path(), home.path()).normalized(home.path());
        let rs = run_rust_candidate(rust_path, &args, repo_rs.path(), home.path())
            .normalized(home.path());

        assert_eq!(rs.code, ts.code);
        assert_eq!(rs.stdout, ts.stdout);
        assert_eq!(rs.stderr, ts.stderr);

        // Validate state layout and contents.
        let p_ts = repo_ts
            .path()
            .join(".spool/.state/ralph/006-09_fixture/state.json");
        let p_rs = repo_rs
            .path()
            .join(".spool/.state/ralph/006-09_fixture/state.json");
        assert!(p_ts.exists());
        assert!(p_rs.exists());

        let v_ts = normalize_state_json(&std::fs::read(&p_ts).unwrap());
        let v_rs = normalize_state_json(&std::fs::read(&p_rs).unwrap());
        assert_eq!(v_rs, v_ts);

        let iter = v_rs.get("iteration").and_then(|v| v.as_u64()).unwrap_or(0);
        assert_eq!(iter, 2);

        insta::assert_snapshot!("parity_ralph_stdout", rs.stdout);
    });
}
