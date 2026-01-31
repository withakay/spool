use predicates::str::contains;

#[test]
fn help_prints_usage() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("--help")
        .assert()
        .success()
        .stdout(contains("Usage:"));
}

#[test]
fn help_shows_navigation_footer() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("--help")
        .assert()
        .success()
        .stdout(contains("spool help --all"));
}

#[test]
fn agent_instruction_help_shows_instruction_details() {
    // This tests that subcommand help routing works correctly
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.args(["agent", "instruction", "-h"])
        .assert()
        .success()
        // Should show instruction help (with Artifacts section), not agent help
        .stdout(contains("Artifacts:"))
        .stdout(contains("bootstrap"))
        .stdout(contains("apply"));
}

#[test]
fn help_all_shows_complete_reference() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.args(["help", "--all"])
        .assert()
        .success()
        .stdout(contains("SPOOL CLI REFERENCE"))
        .stdout(contains("spool init"))
        .stdout(contains("spool list"))
        .stdout(contains("spool agent instruction"));
}

#[test]
fn help_all_global_flag_works() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("--help-all")
        .assert()
        .success()
        .stdout(contains("SPOOL CLI REFERENCE"));
}

#[test]
fn help_all_json_outputs_valid_json() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    let output = cmd
        .args(["help", "--all", "--json"])
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let json: serde_json::Value =
        serde_json::from_slice(&output).expect("help --all --json should output valid JSON");

    assert!(json.get("version").is_some());
    assert!(json.get("commands").is_some());
    let commands = json.get("commands").unwrap().as_array().unwrap();
    assert!(!commands.is_empty());
}
