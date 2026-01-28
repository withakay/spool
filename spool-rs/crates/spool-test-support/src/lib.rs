use std::path::{Path, PathBuf};
use std::process::{Command, Output};

pub mod pty;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CmdOutput {
    pub code: i32,
    pub stdout: String,
    pub stderr: String,
}

impl CmdOutput {
    pub fn normalized(&self, home: &Path) -> CmdOutput {
        CmdOutput {
            code: self.code,
            stdout: normalize_text(&self.stdout, home),
            stderr: normalize_text(&self.stderr, home),
        }
    }
}

pub fn repo_root() -> PathBuf {
    // This crate lives at: <repo>/spool-rs/crates/spool-test-support
    // Walk up to reach the mono-repo root.
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir
        .ancestors()
        .nth(3)
        .expect("repo root should be 3 ancestors up")
        .to_path_buf()
}

pub fn ts_oracle_command() -> Command {
    let root = repo_root();
    let script = root.join("bin").join("spool.js");

    let mut cmd = Command::new("node");
    cmd.arg(script);
    cmd
}

pub fn rust_candidate_command(program: &Path) -> Command {
    Command::new(program)
}

pub fn run_ts_oracle(args: &[&str], cwd: &Path, home: &Path) -> CmdOutput {
    let mut cmd = ts_oracle_command();
    cmd.args(args);
    run_with_env(&mut cmd, cwd, home)
}

pub fn run_rust_candidate(program: &Path, args: &[&str], cwd: &Path, home: &Path) -> CmdOutput {
    let mut cmd = rust_candidate_command(program);
    cmd.args(args);
    run_with_env(&mut cmd, cwd, home)
}

fn run_with_env(cmd: &mut Command, cwd: &Path, home: &Path) -> CmdOutput {
    cmd.current_dir(cwd);

    // Determinism knobs.
    cmd.env("CI", "1");
    cmd.env("NO_COLOR", "1");
    cmd.env("SPOOL_INTERACTIVE", "0");
    cmd.env("TERM", "dumb");
    cmd.env("HOME", home);
    cmd.env("XDG_DATA_HOME", home);

    let out = cmd
        .output()
        .unwrap_or_else(|e| panic!("failed to execute {:?}: {e}", cmd));
    from_output(out)
}

fn from_output(out: Output) -> CmdOutput {
    CmdOutput {
        code: out.status.code().unwrap_or(1),
        stdout: bytes_to_string(&out.stdout),
        stderr: bytes_to_string(&out.stderr),
    }
}

fn bytes_to_string(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).to_string()
}

pub fn normalize_text(input: &str, home: &Path) -> String {
    let stripped = strip_ansi(input);
    let newlines = stripped.replace("\r\n", "\n");
    // Normalize temp HOME paths so snapshots are stable.
    let home_norm = home.to_string_lossy();
    newlines.replace(home_norm.as_ref(), "<HOME>")
}

pub fn copy_dir_all(from: &Path, to: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(to)?;

    for entry in std::fs::read_dir(from)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src = entry.path();
        let dst = to.join(entry.file_name());

        if ty.is_dir() {
            copy_dir_all(&src, &dst)?;
        } else if ty.is_file() {
            std::fs::copy(&src, &dst)?;
        }
    }

    Ok(())
}

fn strip_ansi(input: &str) -> String {
    let bytes = strip_ansi_escapes::strip(input.as_bytes());
    bytes_to_string(&bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_strips_ansi_and_crlf() {
        let home = PathBuf::from("/tmp/home");
        let input = "\u{1b}[31mred\u{1b}[0m\r\nnext\r\n";
        let out = normalize_text(input, &home);
        assert_eq!(out, "red\nnext\n");
    }

    #[test]
    fn normalize_replaces_home_path() {
        let home = PathBuf::from("/tmp/some/home");
        let input = "path=/tmp/some/home/.spool";
        let out = normalize_text(input, &home);
        assert_eq!(out, "path=<HOME>/.spool");
    }

    #[test]
    fn copy_dir_all_copies_nested_files() {
        let src = tempfile::tempdir().expect("src");
        let dst = tempfile::tempdir().expect("dst");

        std::fs::create_dir_all(src.path().join("a/b")).unwrap();
        std::fs::write(src.path().join("a/b/file.txt"), "hello").unwrap();

        copy_dir_all(src.path(), dst.path()).unwrap();

        let copied = std::fs::read_to_string(dst.path().join("a/b/file.txt")).unwrap();
        assert_eq!(copied, "hello");
    }
}
