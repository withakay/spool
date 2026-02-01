use spool_core::repo_index::RepoIndex;

#[test]
fn repo_index_loads_and_excludes_archive_change_dir() {
    let td = tempfile::tempdir().unwrap();
    let spool = td.path().join(".spool");

    std::fs::create_dir_all(spool.join("changes").join("001-01_demo")).unwrap();
    std::fs::create_dir_all(spool.join("changes").join("archive")).unwrap();
    std::fs::create_dir_all(spool.join("modules").join("001_demo")).unwrap();
    std::fs::create_dir_all(spool.join("specs").join("demo")).unwrap();

    let idx = RepoIndex::load(&spool).unwrap();
    assert!(idx.change_dir_names.contains(&"001-01_demo".to_string()));
    assert!(!idx.change_dir_names.contains(&"archive".to_string()));
    assert!(idx.module_dir_names.contains(&"001_demo".to_string()));
    assert!(idx.spec_dir_names.contains(&"demo".to_string()));
}
