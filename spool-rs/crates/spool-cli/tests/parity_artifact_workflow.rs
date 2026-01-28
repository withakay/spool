use std::collections::BTreeMap;
use std::path::Path;

use spool_test_support::{copy_dir_all, run_rust_candidate, run_ts_oracle};

fn normalize_change_allocations_json(bytes: &[u8]) -> serde_json::Value {
    let mut v: serde_json::Value = serde_json::from_slice(bytes).expect("valid json");
    if let Some(mods) = v.get_mut("modules").and_then(|m| m.as_object_mut()) {
        for (_k, mod_state) in mods.iter_mut() {
            if let Some(obj) = mod_state.as_object_mut() {
                // Timestamp is inherently non-deterministic between oracle and candidate.
                obj.insert(
                    "updatedAt".to_string(),
                    serde_json::Value::String("<ts>".to_string()),
                );
            }
        }
    }
    v
}

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

fn make_empty_repo() -> tempfile::TempDir {
    let td = tempfile::tempdir().expect("tempdir");
    std::fs::write(td.path().join("README.md"), "# temp\n").unwrap();
    td
}

fn reset_repo(dst: &Path, src: &Path) {
    // Remove all existing children so absolute paths stay stable across runs.
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

fn setup_spec_driven_change(repo: &Path, change_id: &str, complete: bool) {
    let change_dir = repo.join(".spool").join("changes").join(change_id);
    std::fs::create_dir_all(&change_dir).unwrap();
    std::fs::write(
        change_dir.join(".spool.yaml"),
        "schema: spec-driven\ncreated: 2026-01-28\n",
    )
    .unwrap();

    // Only the existence matters for status.
    if complete {
        std::fs::write(change_dir.join("proposal.md"), "# proposal\n").unwrap();
        std::fs::write(change_dir.join("design.md"), "# design\n").unwrap();
        std::fs::write(change_dir.join("tasks.md"), "- [ ] task\n").unwrap();

        let specs_dir = change_dir.join("specs").join("01_spec");
        std::fs::create_dir_all(&specs_dir).unwrap();
        std::fs::write(specs_dir.join("spec.md"), "# spec\n").unwrap();
    } else {
        // Leave proposal missing so downstream artifacts are blocked.
        std::fs::write(change_dir.join("design.md"), "# design\n").unwrap();
    }
}

fn setup_scaffolded_change(repo: &Path, change_name: &str) {
    let change_dir = repo.join(".spool").join("changes").join(change_name);
    std::fs::create_dir_all(&change_dir).unwrap();
}

fn setup_change_with_schema(repo: &Path, change_name: &str, schema: &str) {
    let change_dir = repo.join(".spool").join("changes").join(change_name);
    std::fs::create_dir_all(&change_dir).unwrap();
    std::fs::write(
        change_dir.join(".spool.yaml"),
        format!("schema: {schema}\ncreated: 2026-01-28\n"),
    )
    .unwrap();
}

fn setup_spec_driven_tasks_all_done(repo: &Path, change_name: &str) {
    setup_change_with_schema(repo, change_name, "spec-driven");
    let change_dir = repo.join(".spool").join("changes").join(change_name);
    std::fs::write(change_dir.join("tasks.md"), "- [x] do the thing\n").unwrap();
}

fn setup_user_schema_no_apply(home: &Path) {
    let schema_dir = home.join("spool").join("schemas").join("no-apply");
    std::fs::create_dir_all(schema_dir.join("templates")).unwrap();
    std::fs::write(
        schema_dir.join("schema.yaml"),
        r#"name: no-apply
version: 1

description: Schema without apply configuration

artifacts:
  - id: proposal
    description: Proposal document
    template: proposal.md
    generates: proposal.md

  - id: tasks
    description: Task list
    template: tasks.md
    generates: tasks.md
    requires: [proposal]
"#,
    )
    .unwrap();
    std::fs::write(
        schema_dir.join("templates").join("proposal.md"),
        "# Proposal\n",
    )
    .unwrap();
    std::fs::write(schema_dir.join("templates").join("tasks.md"), "# Tasks\n").unwrap();
}

#[test]
fn parity_create_module_matches_oracle_output_and_writes() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["create", "module", "my-module"];
    reset_repo(repo.path(), base.path());
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());
    let ts_spool = collect_file_bytes(&repo.path().join(".spool"));

    reset_repo(repo.path(), base.path());
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());
    let rs_spool = collect_file_bytes(&repo.path().join(".spool"));

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    assert_eq!(rs_spool, ts_spool);
}

#[test]
fn parity_create_change_matches_oracle_output_and_writes() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    // Create a module first so numbering and module updates match.
    let create_module = ["create", "module", "my-module"];
    reset_repo(repo.path(), base.path());
    let ts_m = run_ts_oracle(&create_module, repo.path(), home.path()).normalized(home.path());

    // Now create a change with a description to exercise README content.
    let args = [
        "create",
        "change",
        "my-change",
        "--module",
        "001",
        "--schema",
        "spec-driven",
        "--description",
        "hello world",
    ];
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());
    let mut ts_spool = collect_file_bytes(&repo.path().join(".spool"));

    reset_repo(repo.path(), base.path());
    let rs_m = run_rust_candidate(rust_path, &create_module, repo.path(), home.path())
        .normalized(home.path());
    assert_eq!(rs_m.code, ts_m.code);
    assert_eq!(rs_m.stdout, ts_m.stdout);
    assert_eq!(rs_m.stderr, ts_m.stderr);

    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());
    let mut rs_spool = collect_file_bytes(&repo.path().join(".spool"));

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    let ts_alloc = ts_spool
        .remove("workflows/.state/change-allocations.json")
        .expect("ts wrote allocations");
    let rs_alloc = rs_spool
        .remove("workflows/.state/change-allocations.json")
        .expect("rs wrote allocations");
    assert_eq!(
        normalize_change_allocations_json(&rs_alloc),
        normalize_change_allocations_json(&ts_alloc)
    );

    assert_eq!(rs_spool, ts_spool);
}

#[test]
fn parity_status_text_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["status", "--change", "000-01_demo"]; // text output

    reset_repo(repo.path(), base.path());
    setup_spec_driven_change(repo.path(), "000-01_demo", false);
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_spec_driven_change(repo.path(), "000-01_demo", false);
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
}

#[test]
fn parity_status_json_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["status", "--change", "000-01_demo", "--json"];

    reset_repo(repo.path(), base.path());
    setup_spec_driven_change(repo.path(), "000-01_demo", true);
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_spec_driven_change(repo.path(), "000-01_demo", true);
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
}

#[test]
fn parity_templates_text_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["templates"]; // text

    reset_repo(repo.path(), base.path());
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
}

#[test]
fn parity_templates_json_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["templates", "--json"];

    reset_repo(repo.path(), base.path());
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stderr, ts.stderr);

    let ts_v: serde_json::Value = serde_json::from_str(&ts.stdout).expect("ts json");
    let rs_v: serde_json::Value = serde_json::from_str(&rs.stdout).expect("rs json");
    assert_eq!(rs_v, ts_v);
}

#[test]
fn parity_instructions_text_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["instructions", "proposal", "--change", "scaffolded-change"]; // text

    reset_repo(repo.path(), base.path());
    setup_scaffolded_change(repo.path(), "scaffolded-change");
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_scaffolded_change(repo.path(), "scaffolded-change");
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
}

#[test]
fn parity_instructions_json_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = [
        "instructions",
        "design",
        "--change",
        "scaffolded-change",
        "--json",
    ];

    reset_repo(repo.path(), base.path());
    setup_scaffolded_change(repo.path(), "scaffolded-change");
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_scaffolded_change(repo.path(), "scaffolded-change");
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stderr, ts.stderr);

    let ts_v: serde_json::Value = serde_json::from_str(&ts.stdout).expect("ts json");
    let rs_v: serde_json::Value = serde_json::from_str(&rs.stdout).expect("rs json");
    assert_eq!(rs_v, ts_v);
}

#[test]
fn parity_instructions_apply_blocked_text_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["instructions", "apply", "--change", "scaffolded-change"]; // text

    reset_repo(repo.path(), base.path());
    setup_scaffolded_change(repo.path(), "scaffolded-change");
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_scaffolded_change(repo.path(), "scaffolded-change");
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
}

#[test]
fn parity_instructions_apply_all_done_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    let args = ["instructions", "apply", "--change", "done-change", "--json"];

    reset_repo(repo.path(), base.path());
    setup_spec_driven_tasks_all_done(repo.path(), "done-change");
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_spec_driven_tasks_all_done(repo.path(), "done-change");
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stderr, ts.stderr);
    let ts_v: serde_json::Value = serde_json::from_str(&ts.stdout).expect("ts json");
    let rs_v: serde_json::Value = serde_json::from_str(&rs.stdout).expect("rs json");
    assert_eq!(rs_v, ts_v);
}

#[test]
fn parity_instructions_apply_no_apply_schema_matches_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    setup_user_schema_no_apply(home.path());

    let args = [
        "instructions",
        "apply",
        "--change",
        "no-apply-change",
        "--schema",
        "no-apply",
        "--json",
    ];

    reset_repo(repo.path(), base.path());
    setup_change_with_schema(repo.path(), "no-apply-change", "no-apply");
    let change_dir = repo
        .path()
        .join(".spool")
        .join("changes")
        .join("no-apply-change");
    std::fs::write(change_dir.join("proposal.md"), "# Proposal\n").unwrap();
    std::fs::write(change_dir.join("tasks.md"), "- [ ] Task\n").unwrap();
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_change_with_schema(repo.path(), "no-apply-change", "no-apply");
    let change_dir = repo
        .path()
        .join(".spool")
        .join("changes")
        .join("no-apply-change");
    std::fs::write(change_dir.join("proposal.md"), "# Proposal\n").unwrap();
    std::fs::write(change_dir.join("tasks.md"), "- [ ] Task\n").unwrap();
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stderr, ts.stderr);
    let ts_v: serde_json::Value = serde_json::from_str(&ts.stdout).expect("ts json");
    let rs_v: serde_json::Value = serde_json::from_str(&rs.stdout).expect("rs json");
    assert_eq!(rs_v, ts_v);
}

#[test]
fn parity_agent_instruction_and_x_instructions_match_oracle() {
    let base = make_empty_repo();
    let repo = tempfile::tempdir().expect("repo");
    let home = tempfile::tempdir().expect("home");
    let rust_path = assert_cmd::cargo::cargo_bin!("spool");

    reset_repo(repo.path(), base.path());
    setup_change_with_schema(repo.path(), "test-change", "spec-driven");
    let args = [
        "agent",
        "instruction",
        "proposal",
        "--change",
        "test-change",
    ];
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_change_with_schema(repo.path(), "test-change", "spec-driven");
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);

    // Deprecated alias
    reset_repo(repo.path(), base.path());
    setup_change_with_schema(repo.path(), "test-change", "spec-driven");
    let args = ["x-instructions", "proposal", "--change", "test-change"];
    let ts = run_ts_oracle(&args, repo.path(), home.path()).normalized(home.path());

    reset_repo(repo.path(), base.path());
    setup_change_with_schema(repo.path(), "test-change", "spec-driven");
    let rs = run_rust_candidate(rust_path, &args, repo.path(), home.path()).normalized(home.path());

    assert_eq!(rs.code, ts.code);
    assert_eq!(rs.stdout, ts.stdout);
    assert_eq!(rs.stderr, ts.stderr);
}
