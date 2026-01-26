use spool_test_support::{run_rust_candidate, run_ts_oracle};

fn make_fixture_repo() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("tempdir");

    // Minimal spool repo layout for `list --modules --json`.
    let m0 = td.path().join(".spool/modules/000_ungrouped");
    let m6 = td.path().join(".spool/modules/006_spool-rs-port");
    std::fs::create_dir_all(&m0).unwrap();
    std::fs::create_dir_all(&m6).unwrap();
    std::fs::write(m0.join("module.md"), "# 000_ungrouped\n").unwrap();
    std::fs::write(m6.join("module.md"), "# 006_spool-rs-port\n").unwrap();
    std::fs::create_dir_all(td.path().join(".spool/changes")).unwrap();

    // Subdir used to verify spool path behavior matches TS.
    std::fs::create_dir_all(td.path().join("subdir")).unwrap();

    // Changes for module counts (prefix-based).
    let c0 = td.path().join(".spool/changes/000-01_fixture");
    let c611 = td.path().join(".spool/changes/006-11_fixture");
    let c612 = td.path().join(".spool/changes/006-12_fixture");
    std::fs::create_dir_all(&c0).unwrap();
    std::fs::create_dir_all(&c611).unwrap();
    std::fs::create_dir_all(&c612).unwrap();

    // TS oracle considers a change "active" only if proposal.md exists.
    std::fs::write(c0.join("proposal.md"), "# fixture\n").unwrap();
    std::fs::write(c611.join("proposal.md"), "# fixture\n").unwrap();
    std::fs::write(c612.join("proposal.md"), "# fixture\n").unwrap();

    td
}

#[test]
fn parity_list_modules_json_matches_oracle() {
    let repo = make_fixture_repo();
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let ts = run_ts_oracle(&["list", "--modules", "--json"], repo.path(), home.path())
        .normalized(home.path());
    let rs = run_rust_candidate(
        rust_path,
        &["list", "--modules", "--json"],
        repo.path(),
        home.path(),
    )
    .normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    insta::assert_snapshot!("parity_list_modules_json", rs.stdout);
}

#[test]
fn parity_list_modules_from_subdir_matches_oracle() {
    let repo = make_fixture_repo();
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let cwd = repo.path().join("subdir");

    let ts =
        run_ts_oracle(&["list", "--modules", "--json"], &cwd, home.path()).normalized(home.path());
    let rs = run_rust_candidate(
        rust_path,
        &["list", "--modules", "--json"],
        &cwd,
        home.path(),
    )
    .normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    insta::assert_snapshot!("parity_list_modules_json_subdir", rs.stdout);
}
