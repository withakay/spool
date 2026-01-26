use predicates::str::contains;

#[test]
fn help_prints_usage() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("--help")
        .assert()
        .success()
        .stdout(contains("Usage:"));
}
