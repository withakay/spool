use std::path::{Path, PathBuf};

use spool_common::fs::FileSystem;

use crate::{ConfigContext, ResolvedConfig, load_cascading_project_config_fs, spool_config_dir};

#[derive(Debug, Clone)]
pub struct SpoolContext {
    pub config_dir: Option<PathBuf>,
    pub project_root: PathBuf,
    pub spool_path: Option<PathBuf>,
    pub config: ResolvedConfig,
}

impl SpoolContext {
    pub fn resolve<F: FileSystem>(fs: &F, project_root: &Path) -> Self {
        let ctx = ConfigContext::from_process_env();
        Self::resolve_with_ctx(fs, project_root, ctx)
    }

    pub fn resolve_with_ctx<F: FileSystem>(
        fs: &F,
        project_root: &Path,
        ctx: ConfigContext,
    ) -> Self {
        let project_root = project_root.to_path_buf();
        let spool_path = crate::spool_dir::get_spool_path_fs(fs, &project_root, &ctx);
        let config_dir = spool_config_dir(&ctx);

        let config = load_cascading_project_config_fs(fs, &project_root, &spool_path, &ctx);

        let spool_path = fs.is_dir(&spool_path).then_some(spool_path);

        Self {
            config_dir,
            project_root,
            spool_path,
            config,
        }
    }
}
