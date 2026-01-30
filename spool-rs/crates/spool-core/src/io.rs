use std::io::ErrorKind;
use std::path::Path;

use miette::{Result, miette};

pub fn read_to_string(path: &Path) -> Result<String> {
    std::fs::read_to_string(path)
        .map_err(|e| miette!("I/O error reading {p}: {e}", p = path.display()))
}

pub fn read_to_string_optional(path: &Path) -> Result<Option<String>> {
    match std::fs::read_to_string(path) {
        Ok(s) => Ok(Some(s)),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(None),
        Err(e) => Err(miette!("I/O error reading {p}: {e}", p = path.display())),
    }
}

pub fn read_to_string_or_default(path: &Path) -> String {
    std::fs::read_to_string(path).unwrap_or_default()
}

pub fn write(path: &Path, contents: impl AsRef<[u8]>) -> Result<()> {
    std::fs::write(path, contents)
        .map_err(|e| miette!("I/O error writing {p}: {e}", p = path.display()))
}

pub fn create_dir_all(path: &Path) -> Result<()> {
    std::fs::create_dir_all(path)
        .map_err(|e| miette!("I/O error creating {p}: {e}", p = path.display()))
}

pub fn read_to_string_std(path: &Path) -> std::io::Result<String> {
    std::fs::read_to_string(path)
}

pub fn write_std(path: &Path, contents: impl AsRef<[u8]>) -> std::io::Result<()> {
    std::fs::write(path, contents)
}

pub fn create_dir_all_std(path: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(path)
}
