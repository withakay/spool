use spool_test_support::{run_rust_candidate, run_ts_oracle};

fn make_repo_with_dot_spool() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("tempdir");

    // `.spool/` exists at repo root.
    let m6 = td.path().join(".spool/modules/006_spool-rs-port");
    std::fs::create_dir_all(&m6).unwrap();
    std::fs::write(m6.join("module.md"), "# 006_spool-rs-port\n").unwrap();
    std::fs::create_dir_all(td.path().join(".spool/changes")).unwrap();

    // Subdir that is NOT a Spool root.
    std::fs::create_dir_all(td.path().join("src")).unwrap();

    td
}

#[test]
fn parity_list_modules_from_subdir_matches_oracle() {
    let repo = make_repo_with_dot_spool();
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let subdir = repo.path().join("src");

    let ts = run_ts_oracle(&["list", "--modules", "--json"], &subdir, home.path())
        .normalized(home.path());
    let rs = run_rust_candidate(
        rust_path,
        &["list", "--modules", "--json"],
        &subdir,
        home.path(),
    )
    .normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
}

fn make_repo_with_spool_json_override() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("tempdir");

    // spool.json sets projectPath.
    std::fs::write(
        td.path().join("spool.json"),
        "{\"projectPath\":\".altspool\"}\n",
    )
    .unwrap();

    let m6 = td.path().join(".altspool/modules/006_spool-rs-port");
    std::fs::create_dir_all(&m6).unwrap();
    std::fs::write(m6.join("module.md"), "# 006_spool-rs-port\n").unwrap();
    std::fs::create_dir_all(td.path().join(".altspool/changes")).unwrap();

    td
}

#[test]
fn parity_list_modules_respects_repo_project_path() {
    let repo = make_repo_with_spool_json_override();
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
}

fn make_repo_with_global_config_override(home: &std::path::Path) -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("tempdir");

    let cfg_dir = home.join(".config/spool");
    std::fs::create_dir_all(&cfg_dir).unwrap();
    std::fs::write(
        cfg_dir.join("config.json"),
        "{\"projectPath\":\".globalspool\"}\n",
    )
    .unwrap();

    let m6 = td.path().join(".globalspool/modules/006_spool-rs-port");
    std::fs::create_dir_all(&m6).unwrap();
    std::fs::write(m6.join("module.md"), "# 006_spool-rs-port\n").unwrap();
    std::fs::create_dir_all(td.path().join(".globalspool/changes")).unwrap();

    td
}

#[test]
fn parity_list_modules_respects_global_project_path() {
    let home = tempfile::tempdir().expect("home");
    let repo = make_repo_with_global_config_override(home.path());
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
}
