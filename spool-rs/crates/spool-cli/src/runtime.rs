use spool_core::config::ConfigContext;
use spool_core::repo_index::RepoIndex;
use spool_core::spool_dir::get_spool_path;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

pub(crate) struct Runtime {
    ctx: ConfigContext,
    cwd: PathBuf,
    spool_path: OnceLock<PathBuf>,
    repo_index: OnceLock<RepoIndex>,
}

impl Runtime {
    pub(crate) fn new() -> Self {
        Self {
            ctx: ConfigContext::from_process_env(),
            cwd: PathBuf::from("."),
            spool_path: OnceLock::new(),
            repo_index: OnceLock::new(),
        }
    }

    pub(crate) fn ctx(&self) -> &ConfigContext {
        &self.ctx
    }

    pub(crate) fn spool_path(&self) -> &Path {
        self.spool_path
            .get_or_init(|| get_spool_path(&self.cwd, &self.ctx))
            .as_path()
    }

    pub(crate) fn repo_index(&self) -> &RepoIndex {
        self.repo_index
            .get_or_init(|| RepoIndex::load(self.spool_path()).unwrap_or_default())
    }
}
