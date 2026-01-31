use predicates::str::contains;

#[test]
fn bootstrap_requires_tool_flag() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("agent")
        .arg("instruction")
        .arg("bootstrap")
        .assert()
        .failure()
        .stderr(contains("Missing required option --tool"));
}

#[test]
fn bootstrap_rejects_invalid_tool() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("agent")
        .arg("instruction")
        .arg("bootstrap")
        .arg("--tool")
        .arg("invalid")
        .assert()
        .failure()
        .stderr(contains("Invalid tool 'invalid'"))
        .stderr(contains("Valid tools: opencode, claude, codex"));
}

#[test]
fn bootstrap_opencode_success() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("agent")
        .arg("instruction")
        .arg("bootstrap")
        .arg("--tool")
        .arg("opencode")
        .assert()
        .success()
        .stdout(contains("Spool Bootstrap Instructions"))
        .stdout(contains("Tool-Specific Notes: OpenCode"))
        .stdout(contains("MCP (Model Context Protocol)"))
        .stdout(contains("spool agent instruction proposal"))
        .stdout(contains("spool agent instruction apply"))
        .stdout(contains("spool agent instruction review"))
        .stdout(contains("spool agent instruction archive"));
}

#[test]
fn bootstrap_claude_success() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("agent")
        .arg("instruction")
        .arg("bootstrap")
        .arg("--tool")
        .arg("claude")
        .assert()
        .success()
        .stdout(contains("Spool Bootstrap Instructions"))
        .stdout(contains("Tool-Specific Notes: Claude Code"))
        .stdout(contains("comprehensive toolkit"))
        .stdout(contains("spool agent instruction proposal"))
        .stdout(contains("spool agent instruction apply"))
        .stdout(contains("spool agent instruction review"))
        .stdout(contains("spool agent instruction archive"));
}

#[test]
fn bootstrap_codex_success() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("agent")
        .arg("instruction")
        .arg("bootstrap")
        .arg("--tool")
        .arg("codex")
        .assert()
        .success()
        .stdout(contains("Spool Bootstrap Instructions"))
        .stdout(contains("Tool-Specific Notes: Codex"))
        .stdout(contains("shell-first environment"))
        .stdout(contains("spool agent instruction proposal"))
        .stdout(contains("spool agent instruction apply"))
        .stdout(contains("spool agent instruction review"))
        .stdout(contains("spool agent instruction archive"));
}

#[test]
fn bootstrap_json_output() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("agent")
        .arg("instruction")
        .arg("bootstrap")
        .arg("--tool")
        .arg("opencode")
        .arg("--json")
        .assert()
        .success()
        .stdout(contains(r#""artifactId": "bootstrap""#))
        .stdout(contains(r#""instruction":"#));
}

#[test]
fn bootstrap_output_is_short() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    let output = cmd
        .arg("agent")
        .arg("instruction")
        .arg("bootstrap")
        .arg("--tool")
        .arg("opencode")
        .output()
        .expect("command should execute");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let line_count = stdout.lines().count();

    assert!(
        line_count < 100,
        "Bootstrap output should be short (< 100 lines), got {} lines",
        line_count
    );
}

#[test]
fn bootstrap_contains_artifact_pointers() {
    let mut cmd = assert_cmd::cargo::cargo_bin_cmd!("spool");
    cmd.arg("agent")
        .arg("instruction")
        .arg("bootstrap")
        .arg("--tool")
        .arg("opencode")
        .assert()
        .success()
        .stdout(contains("proposal"))
        .stdout(contains("specs"))
        .stdout(contains("tasks"))
        .stdout(contains("apply"))
        .stdout(contains("review"))
        .stdout(contains("archive"));
}
