use std::path::Path;

use spool_test_support::run_rust_candidate;

fn write(path: impl AsRef<Path>, contents: &str) {
    let path = path.as_ref();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).unwrap();
    }
    std::fs::write(path, contents).unwrap();
}

fn write_local_spool_skills(root: &Path) {
    // `spool update` installs adapter files for all tool ids, which in turn
    // installs spool-skills assets. In tests we avoid network fetches by
    // providing a local `spool-skills/` directory.
    let base = root.join("spool-skills");

    // Minimal adapter files.
    write(
        base.join("adapters/opencode/spool-skills.js"),
        "// test plugin\n",
    );
    write(
        base.join("adapters/claude/session-start.sh"),
        "#!/usr/bin/env sh\necho test\n",
    );
    write(
        base.join(".codex/spool-skills-bootstrap.md"),
        "# Bootstrap\n",
    );

    // Must match spool-core `distribution.rs` SPOOL_SKILLS list.
    let skills = [
        "brainstorming",
        "dispatching-parallel-agents",
        "finishing-a-development-branch",
        "receiving-code-review",
        "requesting-code-review",
        "research",
        "subagent-driven-development",
        "systematic-debugging",
        "test-driven-development",
        "using-git-worktrees",
        "using-spool-skills",
        "verification-before-completion",
        "writing-skills",
    ];
    for skill in skills {
        write(
            base.join(format!("skills/{skill}/SKILL.md")),
            &format!("# {skill}\n"),
        );
    }
}

#[test]
fn update_installs_adapter_files_from_local_spool_skills() {
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    write(repo.path().join("README.md"), "# temp\n");
    write_local_spool_skills(repo.path());

    // Update should succeed without network when local spool-skills is present.
    let out = run_rust_candidate(rust_path, &["update", "."], repo.path(), home.path());
    assert_eq!(out.code, 0, "stderr={}", out.stderr);

    // Spot-check adapter outputs.
    assert!(
        repo.path()
            .join(".opencode/plugins/spool-skills.js")
            .exists()
    );
    assert!(repo.path().join(".claude/session-start.sh").exists());
    assert!(
        repo.path()
            .join(".codex/instructions/spool-skills-bootstrap.md")
            .exists()
    );
    assert!(
        repo.path()
            .join(".opencode/skills/spool-brainstorming/SKILL.md")
            .exists()
    );
}
