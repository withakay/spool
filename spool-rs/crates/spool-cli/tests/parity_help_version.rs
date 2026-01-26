use insta::assert_snapshot;
use spool_test_support::{run_rust_candidate, run_ts_oracle};

fn make_fixture_repo() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("tempdir");

    // Minimal spool repo layout.
    let m0 = td.path().join(".spool/modules/000_ungrouped");
    let m6 = td.path().join(".spool/modules/006_spool-rs-port");
    std::fs::create_dir_all(&m0).unwrap();
    std::fs::create_dir_all(&m6).unwrap();
    std::fs::write(m0.join("module.md"), "# 000_ungrouped\n").unwrap();
    std::fs::write(m6.join("module.md"), "# 006_spool-rs-port\n").unwrap();
    std::fs::create_dir_all(td.path().join(".spool/changes")).unwrap();

    td
}

#[test]
fn parity_version_matches_oracle() {
    let repo = make_fixture_repo();
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let ts = run_ts_oracle(&["--version"], repo.path(), home.path()).normalized(home.path());
    let rs = run_rust_candidate(rust_path, &["--version"], repo.path(), home.path())
        .normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    assert_snapshot!("parity_version", rs.stdout);
}

#[test]
fn parity_help_matches_oracle() {
    let repo = make_fixture_repo();
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let ts = run_ts_oracle(&["--help"], repo.path(), home.path()).normalized(home.path());
    let rs = run_rust_candidate(rust_path, &["--help"], repo.path(), home.path())
        .normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    assert_snapshot!("parity_help", rs.stdout);
}
