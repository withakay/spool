use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use assert_cmd::cargo::cargo_bin;
use spool_test_support::pty::run_pty_interactive;
use spool_test_support::repo_root;

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
                "{label}: file differs: {k}\nA len={}\nB len={}\n",
                a_bytes.len(),
                b_bytes.len()
            );
        }
    }
}

#[test]
fn parity_init_interactive_matches_ts_oracle_for_basic_selection() {
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
    let ts_project = tmp.path().join("ts-project");
    let rs_project = tmp.path().join("rs-project");
    fs::create_dir_all(&ts_home).unwrap();
    fs::create_dir_all(&rs_home).unwrap();
    fs::create_dir_all(&ts_project).unwrap();
    fs::create_dir_all(&rs_project).unwrap();

    // Drive both interactive prompts with the same keystrokes:
    // - Enter continues from the intro screen
    // - Space toggles the first tool
    // - Enter proceeds to review
    // - Enter confirms
    let input = "\n \n\n";

    // TS oracle via node + spool.js.
    let script: PathBuf = repo.join("bin").join("spool.js");
    let ts_args_owned = vec![
        script.to_string_lossy().to_string(),
        "init".to_string(),
        "--force".to_string(),
        ts_project.to_string_lossy().to_string(),
    ];
    let ts_args: Vec<&str> = ts_args_owned.iter().map(|s| s.as_str()).collect();
    let ts_out = run_pty_interactive(Path::new("node"), &ts_args, &repo, &ts_home, input);
    if ts_out.code != 0 {
        panic!("ts init failed (code={})\n{}", ts_out.code, ts_out.stdout);
    }

    // Rust candidate.
    let program: PathBuf = cargo_bin("spool");
    let rs_args_owned = vec![
        "init".to_string(),
        "--force".to_string(),
        rs_project.to_string_lossy().to_string(),
    ];
    let rs_args: Vec<&str> = rs_args_owned.iter().map(|s| s.as_str()).collect();
    let rs_out = run_pty_interactive(&program, &rs_args, &repo, &rs_home, input);
    if rs_out.code != 0 {
        panic!("rs init failed (code={})\n{}", rs_out.code, rs_out.stdout);
    }

    assert_trees_equal(
        "project tree",
        &collect_tree(&ts_project),
        &collect_tree(&rs_project),
    );
}
