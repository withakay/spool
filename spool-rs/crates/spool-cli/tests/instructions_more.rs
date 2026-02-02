#[path = "support/mod.rs"]
mod fixtures;

use spool_test_support::run_rust_candidate;

#[test]
fn agent_instruction_text_output_renders_artifact_envelope() {
    let base = fixtures::make_repo_with_spec_change_fixture();
    let repo = tempfile::tempdir().expect("work");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    fixtures::reset_repo(repo.path(), base.path());

    let out = run_rust_candidate(
        rust_path,
        &[
            "agent",
            "instruction",
            "proposal",
            "--change",
            "000-01_test-change",
        ],
        repo.path(),
        home.path(),
    );

    assert_eq!(out.code, 0);
    assert!(out.stdout.contains("<artifact id=\"proposal\""));
    assert!(out.stdout.contains("Write to:"));
}
