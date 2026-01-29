use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use assert_cmd::cargo::cargo_bin;
use spool_test_support::repo_root;
use spool_test_support::ts_oracle_command;

fn with_common_env(cmd: &mut Command, cwd: &Path, home: &Path, codex_home: &Path) {
    cmd.current_dir(cwd);

    // Determinism knobs.
    cmd.env("CI", "1");
    cmd.env("NO_COLOR", "1");
    cmd.env("SPOOL_INTERACTIVE", "0");
    cmd.env("TERM", "dumb");
    cmd.env("HOME", home);
    cmd.env("CODEX_HOME", codex_home);
}

fn run_ok(mut cmd: Command) {
    let out = cmd.output().expect("run command");
    if !out.status.success() {
        panic!(
            "command failed (code={:?})\nstdout:\n{}\nstderr:\n{}",
            out.status.code(),
            String::from_utf8_lossy(&out.stdout),
            String::from_utf8_lossy(&out.stderr)
        );
    }
}

fn collect_tree(root: &Path) -> BTreeMap<String, Vec<u8>> {
    let mut out = BTreeMap::new();
    if !root.exists() {
        return out;
    }
    collect_tree_inner(root, root, &mut out);
    out
}

fn collect_tree_inner(base: &Path, dir: &Path, out: &mut BTreeMap<String, Vec<u8>>) {
    for entry in fs::read_dir(dir).expect("read_dir") {
        let entry = entry.expect("dir entry");
        let ty = entry.file_type().expect("file_type");
        let path = entry.path();

        if ty.is_dir() {
            collect_tree_inner(base, &path, out);
        } else if ty.is_file() {
            let rel = path.strip_prefix(base).expect("strip_prefix");
            let rel = rel.to_string_lossy().replace('\\', "/");
            out.insert(rel, fs::read(&path).expect("read file"));
        }
    }
}

fn assert_trees_equal(label: &str, a: &BTreeMap<String, Vec<u8>>, b: &BTreeMap<String, Vec<u8>>) {
    if a.keys().collect::<Vec<_>>() != b.keys().collect::<Vec<_>>() {
        let a_keys: Vec<_> = a.keys().cloned().collect();
        let b_keys: Vec<_> = b.keys().cloned().collect();
        panic!("{label}: file list differs\nA: {a_keys:#?}\nB: {b_keys:#?}");
    }

    for (k, a_bytes) in a {
        let b_bytes = b.get(k).expect("key exists");
        if a_bytes != b_bytes {
            panic!(
                "{label}: file differs: {k}\nA len={}\nB len={}",
                a_bytes.len(),
                b_bytes.len()
            );
        }
    }
}

fn parity_init_tree_for_tools(tools: &str) {
    let repo = repo_root();

    // Use a repo-local temp directory to avoid platform/CI permission issues.
    let tmp_base = repo.join("spool-rs").join("target").join("tmp");
    fs::create_dir_all(&tmp_base).unwrap();
    let tmp = tempfile::Builder::new()
        .prefix("spool-parity-")
        .tempdir_in(&tmp_base)
        .expect("tmp");

    let ts_home = tmp.path().join("ts-home");
    let rs_home = tmp.path().join("rs-home");
    let ts_codex = tmp.path().join("ts-codex-home");
    let rs_codex = tmp.path().join("rs-codex-home");
    let ts_project = tmp.path().join("ts-project");
    let rs_project = tmp.path().join("rs-project");
    fs::create_dir_all(&ts_home).unwrap();
    fs::create_dir_all(&rs_home).unwrap();
    fs::create_dir_all(&ts_codex).unwrap();
    fs::create_dir_all(&rs_codex).unwrap();
    fs::create_dir_all(&ts_project).unwrap();
    fs::create_dir_all(&rs_project).unwrap();

    // TS oracle.
    let mut ts = ts_oracle_command();
    ts.args([
        "init",
        "--tools",
        tools,
        "--force",
        ts_project.to_string_lossy().as_ref(),
    ]);
    with_common_env(&mut ts, &repo, &ts_home, &ts_codex);
    run_ok(ts);

    // Rust candidate.
    let program: PathBuf = cargo_bin("spool");
    let mut rs = Command::new(&program);
    rs.args([
        "init",
        "--tools",
        tools,
        "--force",
        rs_project.to_string_lossy().as_ref(),
    ]);
    with_common_env(&mut rs, &repo, &rs_home, &rs_codex);
    run_ok(rs);

    assert_trees_equal(
        "project tree",
        &collect_tree(&ts_project),
        &collect_tree(&rs_project),
    );
    assert_trees_equal(
        "codex home tree",
        &collect_tree(&ts_codex),
        &collect_tree(&rs_codex),
    );
}

#[test]
fn parity_init_tree_tools_none_matches_ts_oracle() {
    parity_init_tree_for_tools("none");
}

#[test]
fn parity_init_tree_tools_subset_matches_ts_oracle() {
    parity_init_tree_for_tools("claude");
}

#[test]
fn parity_init_tree_matches_ts_oracle() {
    let repo = repo_root();

    // Use a repo-local temp directory to avoid platform/CI permission issues.
    let tmp_base = repo.join("spool-rs").join("target").join("tmp");
    fs::create_dir_all(&tmp_base).unwrap();
    let tmp = tempfile::Builder::new()
        .prefix("spool-parity-")
        .tempdir_in(&tmp_base)
        .expect("tmp");

    let ts_home = tmp.path().join("ts-home");
    let rs_home = tmp.path().join("rs-home");
    let ts_codex = tmp.path().join("ts-codex-home");
    let rs_codex = tmp.path().join("rs-codex-home");
    let ts_project = tmp.path().join("ts-project");
    let rs_project = tmp.path().join("rs-project");
    fs::create_dir_all(&ts_home).unwrap();
    fs::create_dir_all(&rs_home).unwrap();
    fs::create_dir_all(&ts_codex).unwrap();
    fs::create_dir_all(&rs_codex).unwrap();
    fs::create_dir_all(&ts_project).unwrap();
    fs::create_dir_all(&rs_project).unwrap();

    // TS oracle.
    let mut ts = ts_oracle_command();
    ts.args([
        "init",
        "--tools",
        "all",
        "--force",
        ts_project.to_string_lossy().as_ref(),
    ]);
    with_common_env(&mut ts, &repo, &ts_home, &ts_codex);
    run_ok(ts);

    // Rust candidate.
    let program: PathBuf = cargo_bin("spool");
    let mut rs = Command::new(&program);
    rs.args([
        "init",
        "--tools",
        "all",
        "--force",
        rs_project.to_string_lossy().as_ref(),
    ]);
    with_common_env(&mut rs, &repo, &rs_home, &rs_codex);
    run_ok(rs);

    assert_trees_equal(
        "project tree",
        &collect_tree(&ts_project),
        &collect_tree(&rs_project),
    );
    assert_trees_equal(
        "codex home tree",
        &collect_tree(&ts_codex),
        &collect_tree(&rs_codex),
    );
}

#[test]
fn parity_update_preserves_outside_markers_like_ts_oracle() {
    let repo = repo_root();

    // Use a repo-local temp directory to avoid platform/CI permission issues.
    let tmp_base = repo.join("spool-rs").join("target").join("tmp");
    fs::create_dir_all(&tmp_base).unwrap();
    let tmp = tempfile::Builder::new()
        .prefix("spool-parity-")
        .tempdir_in(&tmp_base)
        .expect("tmp");

    let ts_home = tmp.path().join("ts-home");
    let rs_home = tmp.path().join("rs-home");
    let ts_codex = tmp.path().join("ts-codex-home");
    let rs_codex = tmp.path().join("rs-codex-home");
    let ts_project = tmp.path().join("ts-project");
    let rs_project = tmp.path().join("rs-project");
    fs::create_dir_all(&ts_home).unwrap();
    fs::create_dir_all(&rs_home).unwrap();
    fs::create_dir_all(&ts_codex).unwrap();
    fs::create_dir_all(&rs_codex).unwrap();
    fs::create_dir_all(&ts_project).unwrap();
    fs::create_dir_all(&rs_project).unwrap();

    // Seed both trees with init.
    let mut ts_init = ts_oracle_command();
    ts_init.args([
        "init",
        "--tools",
        "all",
        "--force",
        ts_project.to_string_lossy().as_ref(),
    ]);
    with_common_env(&mut ts_init, &repo, &ts_home, &ts_codex);
    run_ok(ts_init);

    let program: PathBuf = cargo_bin("spool");
    let mut rs_init = Command::new(&program);
    rs_init.args([
        "init",
        "--tools",
        "all",
        "--force",
        rs_project.to_string_lossy().as_ref(),
    ]);
    with_common_env(&mut rs_init, &repo, &rs_home, &rs_codex);
    run_ok(rs_init);

    // Add user content outside markers in a marker-managed file.
    for root in [&ts_project, &rs_project] {
        let p = root.join("AGENTS.md");
        let mut s = fs::read_to_string(&p).expect("read AGENTS");
        s.push_str("\n\nUSER_NOTE: keep me\n");
        fs::write(&p, s).expect("write AGENTS");
    }

    // Update both.
    let mut ts_up = ts_oracle_command();
    ts_up.args(["update", ts_project.to_string_lossy().as_ref()]);
    with_common_env(&mut ts_up, &repo, &ts_home, &ts_codex);
    run_ok(ts_up);

    let mut rs_up = Command::new(&program);
    rs_up.args(["update", rs_project.to_string_lossy().as_ref()]);
    with_common_env(&mut rs_up, &repo, &rs_home, &rs_codex);
    run_ok(rs_up);

    // Ensure our outside-marker content is preserved and trees match.
    let ts_agents = fs::read_to_string(ts_project.join("AGENTS.md")).expect("read ts AGENTS");
    let rs_agents = fs::read_to_string(rs_project.join("AGENTS.md")).expect("read rs AGENTS");
    assert!(ts_agents.contains("USER_NOTE: keep me"));
    assert!(rs_agents.contains("USER_NOTE: keep me"));
    assert_eq!(ts_agents, rs_agents);

    assert_trees_equal(
        "project tree after update",
        &collect_tree(&ts_project),
        &collect_tree(&rs_project),
    );
    assert_trees_equal(
        "codex home tree after update",
        &collect_tree(&ts_codex),
        &collect_tree(&rs_codex),
    );
}
