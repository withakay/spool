use assert_cmd::Command;
use predicates::str::contains;

fn make_repo() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("repo");
    std::fs::write(td.path().join("README.md"), "# temp\n").unwrap();
    td
}

#[test]
fn stats_counts_command_end_events() {
    let repo = make_repo();
    let home = tempfile::tempdir().expect("home");
    let xdg = home.path().join("xdg");
    std::fs::create_dir_all(&xdg).unwrap();

    let sessions_dir = xdg
        .join("spool")
        .join("logs")
        .join("execution")
        .join("v1")
        .join("projects")
        .join("p1")
        .join("sessions");
    std::fs::create_dir_all(&sessions_dir).unwrap();

    let log_path = sessions_dir.join("s1.jsonl");
    let line = "{\"event_version\":1,\"event_id\":\"00000000-0000-0000-0000-000000000000\",\"timestamp\":\"2026-01-31T00:00:00Z\",\"event_type\":\"command_end\",\"spool_version\":\"0.0.0\",\"command_id\":\"spool.tasks.status\",\"session_id\":\"s1\",\"project_id\":\"p1\",\"pid\":1,\"outcome\":\"success\",\"duration_ms\":1}\n";
    std::fs::write(&log_path, line).unwrap();

    let mut cmd = Command::cargo_bin("spool").unwrap();
    cmd.current_dir(repo.path())
        .arg("stats")
        .env("CI", "1")
        .env("NO_COLOR", "1")
        .env("SPOOL_INTERACTIVE", "0")
        .env("TERM", "dumb")
        .env("HOME", home.path())
        .env("XDG_CONFIG_HOME", &xdg)
        .env("SPOOL_DISABLE_LOGGING", "1")
        .assert()
        .success()
        .stdout(contains("command_id: count"))
        .stdout(contains("spool.tasks.status: 1"))
        .stdout(contains("spool.init: 0"));
}
