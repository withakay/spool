pub mod archive;
pub mod create;
pub mod distribution;

pub mod installers;
pub mod list;
pub mod ralph;
pub mod repo_index;
pub mod show;
pub mod validate;

pub mod workflow;

// Compatibility re-exports.
//
// These modules used to be implemented in `spool-core`, but now live in lower-level crates.
// Keep the old public paths (`spool_core::io`, `spool_core::config`, etc.) to avoid a
// breaking change while downstream crates migrate.

pub mod io {
    pub use spool_common::io::*;
}

pub mod paths {
    pub use spool_common::paths::*;
}

pub mod id {
    pub use spool_common::id::*;
}

pub mod r#match {
    pub use spool_common::match_::*;
}

pub mod output {
    pub use spool_config::output::*;
}

pub mod spool_dir {
    pub use spool_config::spool_dir::*;
}

pub mod config {
    pub use spool_config::{
        CascadingProjectConfig, ConfigContext, GlobalConfig, ProjectConfig, ResolvedConfig,
        global_config_path, load_cascading_project_config, load_cascading_project_config_fs,
        load_global_config, load_global_config_fs, load_project_config, load_project_config_fs,
        load_repo_project_path_override, load_repo_project_path_override_fs, project_config_paths,
        spool_config_dir,
    };

    pub mod defaults {
        pub use spool_config::defaults::*;
    }

    pub mod schema {
        pub use spool_config::schema::*;
    }

    pub mod types {
        pub use spool_config::types::*;
    }
}

pub mod discovery {
    use std::collections::BTreeSet;
    use std::path::Path;

    use miette::Result;

    use spool_common::fs::StdFs;

    pub fn list_dir_names(dir: &Path) -> Result<Vec<String>> {
        spool_domain::discovery::list_dir_names(&StdFs, dir)
    }

    pub fn list_change_dir_names(spool_path: &Path) -> Result<Vec<String>> {
        spool_domain::discovery::list_change_dir_names(&StdFs, spool_path)
    }

    pub fn list_module_dir_names(spool_path: &Path) -> Result<Vec<String>> {
        spool_domain::discovery::list_module_dir_names(&StdFs, spool_path)
    }

    pub fn list_module_ids(spool_path: &Path) -> Result<BTreeSet<String>> {
        spool_domain::discovery::list_module_ids(&StdFs, spool_path)
    }

    pub fn list_spec_dir_names(spool_path: &Path) -> Result<Vec<String>> {
        spool_domain::discovery::list_spec_dir_names(&StdFs, spool_path)
    }
}
