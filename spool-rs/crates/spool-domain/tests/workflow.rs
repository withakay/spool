use spool_domain::workflow;

#[test]
fn init_workflow_structure_writes_expected_files() {
    let td = tempfile::tempdir().expect("tempdir");
    let spool_path = td.path().join(".spool");
    workflow::init_workflow_structure(&spool_path).expect("init");

    assert!(workflow::workflows_dir(&spool_path).exists());
    assert!(workflow::workflow_state_dir(&spool_path).exists());
    assert!(workflow::commands_dir(&spool_path).exists());
    assert!(workflow::workflow_file_path(&spool_path, "research").exists());
    assert!(workflow::workflow_file_path(&spool_path, "execute").exists());
    assert!(workflow::workflow_file_path(&spool_path, "review").exists());

    let names = workflow::list_workflows(&spool_path);
    assert_eq!(names, vec!["execute", "research", "review"]);
}

#[test]
fn load_workflow_parses_and_counts_tasks() {
    let td = tempfile::tempdir().expect("tempdir");
    let spool_path = td.path().join(".spool");
    workflow::init_workflow_structure(&spool_path).expect("init");

    let wf = workflow::load_workflow(&spool_path, "research").expect("load");
    assert_eq!(wf.id, "research");
    assert!(!wf.waves.is_empty());
    assert!(workflow::count_tasks(&wf) >= 1);
}
