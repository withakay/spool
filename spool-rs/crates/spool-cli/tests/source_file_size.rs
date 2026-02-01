use std::fs;
use std::path::{Path, PathBuf};

const MAX_LINES_PER_FILE: usize = 1000;

fn collect_rs_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let entries = fs::read_dir(dir).expect("read_dir should succeed");
    for entry in entries {
        let entry = entry.expect("dir entry should be readable");
        let typ = entry.file_type().expect("file type should be readable");
        let path = entry.path();

        if typ.is_dir() {
            collect_rs_files(&path, out);
            continue;
        }

        if !typ.is_file() {
            continue;
        }

        if path.extension().and_then(|s| s.to_str()) != Some("rs") {
            continue;
        }

        out.push(path);
    }
}

#[test]
fn spool_cli_source_files_are_reasonably_sized() {
    // Guardrail: ensure no Rust source file under `src/` grows past the per-file limit.
    // This counts physical lines (including blank lines), not logical SLOC.
    let crate_root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let src_dir = crate_root.join("src");

    let mut files: Vec<PathBuf> = Vec::new();
    collect_rs_files(&src_dir, &mut files);
    files.sort();

    let mut oversized: Vec<(PathBuf, usize)> = Vec::new();
    for path in files {
        let content = fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("failed to read {}: {e}", path.display()));
        let line_count = content.lines().count();
        if line_count > MAX_LINES_PER_FILE {
            oversized.push((path, line_count));
        }
    }

    if oversized.is_empty() {
        return;
    }

    let mut msg =
        format!("Found Rust source files exceeding {MAX_LINES_PER_FILE} lines (physical lines):\n");
    for (path, lines) in oversized {
        let rel = path
            .strip_prefix(crate_root)
            .unwrap_or(path.as_path())
            .display();
        msg.push_str(&format!("- {rel}: {lines} lines\n"));
    }
    panic!("{msg}");
}
