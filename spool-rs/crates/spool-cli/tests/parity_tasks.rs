use std::collections::BTreeMap;
use std::path::Path;

use spool_test_support::{copy_dir_all, run_rust_candidate, run_ts_oracle};

fn collect_file_bytes(root: &Path) -> BTreeMap<String, Vec<u8>> {
    fn walk(base: &Path, dir: &Path, out: &mut BTreeMap<String, Vec<u8>>) {
        let Ok(entries) = std::fs::read_dir(dir) else {
            return;
        };
        for e in entries.flatten() {
            let Ok(ft) = e.file_type() else {
                continue;
            };
            let p = e.path();
            if ft.is_dir() {
                walk(base, &p, out);
                continue;
            }
            if !ft.is_file() {
                continue;
            }
            let rel = p
                .strip_prefix(base)
                .unwrap_or(&p)
                .to_string_lossy()
                .replace('\\', "/");
            let bytes = std::fs::read(&p).unwrap_or_default();
            out.insert(rel, bytes);
        }
    }

    let mut out: BTreeMap<String, Vec<u8>> = BTreeMap::new();
    walk(root, root, &mut out);
    out
}

fn make_base_repo() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("repo");
    std::fs::write(td.path().join("README.md"), "# temp\n").unwrap();
    // Minimal scaffolded change directory.
    let change_dir = td.path().join(".spool").join("changes").join("test-change");
    std::fs::create_dir_all(&change_dir).unwrap();
    td
}

fn reset_repo(dst: &Path, src: &Path) {
    if let Ok(entries) = std::fs::read_dir(dst) {
        for e in entries.flatten() {
            let p = e.path();
            if let Ok(ft) = e.file_type() {
                if ft.is_dir() {
                    let _ = std::fs::remove_dir_all(&p);
                } else {
                    let _ = std::fs::remove_file(&p);
                }
            }
        }
    }
    copy_dir_all(src, dst).unwrap();
}

#[test]
fn parity_tasks_init_writes_same_file() {
    let base = make_base_repo();
    let repo = tempfile::tempdir().expect("work");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["tasks", "init", "test-change"];

    reset_repo(repo.path(), base.path());
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());
    let ts_fs = collect_file_bytes(repo.path());

    reset_repo(repo.path(), base.path());
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());
    let rs_fs = collect_file_bytes(repo.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
    assert_eq!(rs_fs, ts_fs);
}

#[test]
fn parity_tasks_status_next_start_complete_match_oracle() {
    let base = make_base_repo();
    let repo = tempfile::tempdir().expect("work");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    // Init first.
    let init_args = ["tasks", "init", "test-change"];
    reset_repo(repo.path(), base.path());
    let ts_init = run_ts_oracle(&init_args, repo.path(), home.path()).normalized(home.path());
    assert_eq!(ts_init.code, 0);

    reset_repo(repo.path(), base.path());
    let rs_init =
        run_rust_candidate(rust_path, &init_args, repo.path(), home.path()).normalized(home.path());
    assert_eq!(rs_init.code, 0);

    // Status output.
    let status_args = ["tasks", "status", "test-change"];
    reset_repo(repo.path(), base.path());
    run_ts_oracle(&init_args, repo.path(), home.path());
    let ts = run_ts_oracle(&status_args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    run_rust_candidate(rust_path, &init_args, repo.path(), home.path());
    let rs = run_rust_candidate(rust_path, &status_args, repo.path(), home.path())
        .normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    // Next output.
    let next_args = ["tasks", "next", "test-change"];
    reset_repo(repo.path(), base.path());
    run_ts_oracle(&init_args, repo.path(), home.path());
    let ts = run_ts_oracle(&next_args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    run_rust_candidate(rust_path, &init_args, repo.path(), home.path());
    let rs =
        run_rust_candidate(rust_path, &next_args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    // Start 1.1.
    let start_args = ["tasks", "start", "test-change", "1.1"];
    reset_repo(repo.path(), base.path());
    run_ts_oracle(&init_args, repo.path(), home.path());
    let ts = run_ts_oracle(&start_args, repo.path(), home.path()).normalized(home.path());
    let ts_fs = collect_file_bytes(repo.path());

    reset_repo(repo.path(), base.path());
    run_rust_candidate(rust_path, &init_args, repo.path(), home.path());
    let rs = run_rust_candidate(rust_path, &start_args, repo.path(), home.path())
        .normalized(home.path());
    let rs_fs = collect_file_bytes(repo.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
    assert_eq!(rs_fs, ts_fs);

    // Complete 1.1.
    let complete_args = ["tasks", "complete", "test-change", "1.1"];
    reset_repo(repo.path(), base.path());
    run_ts_oracle(&init_args, repo.path(), home.path());
    run_ts_oracle(&start_args, repo.path(), home.path());
    let ts = run_ts_oracle(&complete_args, repo.path(), home.path()).normalized(home.path());
    let ts_fs = collect_file_bytes(repo.path());

    reset_repo(repo.path(), base.path());
    run_rust_candidate(rust_path, &init_args, repo.path(), home.path());
    run_rust_candidate(rust_path, &start_args, repo.path(), home.path());
    let rs = run_rust_candidate(rust_path, &complete_args, repo.path(), home.path())
        .normalized(home.path());
    let rs_fs = collect_file_bytes(repo.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
    assert_eq!(rs_fs, ts_fs);
}
