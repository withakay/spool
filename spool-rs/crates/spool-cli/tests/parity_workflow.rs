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
fn parity_workflow_init_list_show_match_oracle() {
    let base = make_base_repo();
    let repo = tempfile::tempdir().expect("work");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let init = ["workflow", "init"];
    let list = ["workflow", "list"];
    let show = ["workflow", "show", "research"];

    reset_repo(repo.path(), base.path());
    let ts_init = run_ts_oracle(&init, repo.path(), home.path()).normalized(home.path());
    let ts_fs_init = collect_file_bytes(repo.path());
    let ts_list = run_ts_oracle(&list, repo.path(), home.path()).normalized(home.path());
    let ts_show = run_ts_oracle(&show, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    let rs_init =
        run_rust_candidate(rust_path, &init, repo.path(), home.path()).normalized(home.path());
    let rs_fs_init = collect_file_bytes(repo.path());
    let rs_list =
        run_rust_candidate(rust_path, &list, repo.path(), home.path()).normalized(home.path());
    let rs_show =
        run_rust_candidate(rust_path, &show, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs_init.code, ts_init.code);
    assert_eq!(rs_init.stdout, ts_init.stdout);
    assert_eq!(rs_init.stderr, ts_init.stderr);
    assert_eq!(rs_fs_init, ts_fs_init);

    assert_eq!(rs_list.code, ts_list.code);
    assert_eq!(rs_list.stdout, ts_list.stdout);
    assert_eq!(rs_list.stderr, ts_list.stderr);

    assert_eq!(rs_show.code, ts_show.code);
    assert_eq!(rs_show.stdout, ts_show.stdout);
    assert_eq!(rs_show.stderr, ts_show.stderr);
}
