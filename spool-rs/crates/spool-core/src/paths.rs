use std::path::{Path, PathBuf};

/// Canonical `.spool/` path builders.
///
/// These helpers intentionally take a `spool_path` (the configured spool root directory)
/// so callers do not duplicate `.join("changes")`, `.join("modules")`, or ad-hoc
/// string-based path formatting.
pub fn default_spool_root(workspace_root: &Path) -> PathBuf {
    workspace_root.join(".spool")
}

pub fn changes_dir(spool_path: &Path) -> PathBuf {
    spool_path.join("changes")
}

pub fn change_dir(spool_path: &Path, change_id: &str) -> PathBuf {
    changes_dir(spool_path).join(change_id)
}

pub fn change_meta_path(spool_path: &Path, change_id: &str) -> PathBuf {
    change_dir(spool_path, change_id).join(".spool.yaml")
}

pub fn change_specs_dir(spool_path: &Path, change_id: &str) -> PathBuf {
    change_dir(spool_path, change_id).join("specs")
}

pub fn changes_archive_dir(spool_path: &Path) -> PathBuf {
    changes_dir(spool_path).join("archive")
}

pub fn archive_changes_dir(spool_path: &Path) -> PathBuf {
    spool_path.join("archive").join("changes")
}

pub fn modules_dir(spool_path: &Path) -> PathBuf {
    spool_path.join("modules")
}

pub fn specs_dir(spool_path: &Path) -> PathBuf {
    spool_path.join("specs")
}

pub fn spec_markdown_path(spool_path: &Path, spec_id: &str) -> PathBuf {
    specs_dir(spool_path).join(spec_id).join("spec.md")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_spool_root_is_dot_spool() {
        let root = PathBuf::from("/repo");
        assert_eq!(default_spool_root(&root), PathBuf::from("/repo/.spool"));
    }

    #[test]
    fn builders_join_expected_paths() {
        let spool = PathBuf::from("/repo/.spool");

        assert_eq!(changes_dir(&spool), PathBuf::from("/repo/.spool/changes"));
        assert_eq!(
            change_dir(&spool, "001-01_test"),
            PathBuf::from("/repo/.spool/changes/001-01_test")
        );
        assert_eq!(
            change_meta_path(&spool, "001-01_test"),
            PathBuf::from("/repo/.spool/changes/001-01_test/.spool.yaml")
        );
        assert_eq!(
            change_specs_dir(&spool, "001-01_test"),
            PathBuf::from("/repo/.spool/changes/001-01_test/specs")
        );
        assert_eq!(
            changes_archive_dir(&spool),
            PathBuf::from("/repo/.spool/changes/archive")
        );
        assert_eq!(
            archive_changes_dir(&spool),
            PathBuf::from("/repo/.spool/archive/changes")
        );
        assert_eq!(modules_dir(&spool), PathBuf::from("/repo/.spool/modules"));
        assert_eq!(specs_dir(&spool), PathBuf::from("/repo/.spool/specs"));
        assert_eq!(
            spec_markdown_path(&spool, "cli-tasks"),
            PathBuf::from("/repo/.spool/specs/cli-tasks/spec.md")
        );
    }
}
