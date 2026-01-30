use std::collections::BTreeSet;
use std::path::Path;

use miette::Result;

#[derive(Debug, Default, Clone)]
pub struct RepoIndex {
    pub module_dir_names: Vec<String>,
    pub module_ids: BTreeSet<String>,
    pub change_dir_names: Vec<String>,
    pub spec_dir_names: Vec<String>,
}

impl RepoIndex {
    pub fn load(spool_path: &Path) -> Result<Self> {
        let module_dir_names = crate::discovery::list_module_dir_names(spool_path)?;
        let module_ids = crate::discovery::list_module_ids(spool_path)?;
        let change_dir_names = crate::discovery::list_change_dir_names(spool_path)?;
        let spec_dir_names = crate::discovery::list_spec_dir_names(spool_path)?;

        Ok(Self {
            module_dir_names,
            module_ids,
            change_dir_names,
            spec_dir_names,
        })
    }
}
