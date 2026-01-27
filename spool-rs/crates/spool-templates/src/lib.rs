use std::borrow::Cow;

use include_dir::{include_dir, Dir};

static DEFAULT_PROJECT_DIR: Dir<'static> =
    include_dir!("$CARGO_MANIFEST_DIR/assets/default/project");
static DEFAULT_HOME_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/assets/default/home");

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EmbeddedFile {
    pub relative_path: &'static str,
    pub contents: &'static [u8],
}

pub fn default_project_files() -> Vec<EmbeddedFile> {
    dir_files(&DEFAULT_PROJECT_DIR)
}

pub fn default_home_files() -> Vec<EmbeddedFile> {
    dir_files(&DEFAULT_HOME_DIR)
}

fn dir_files(dir: &'static Dir<'static>) -> Vec<EmbeddedFile> {
    dir.files()
        .map(|f| EmbeddedFile {
            relative_path: f.path().to_str().unwrap_or_default(),
            contents: f.contents(),
        })
        .collect()
}

pub fn normalize_spool_dir(spool_dir: &str) -> String {
    if spool_dir.is_empty() {
        return ".spool".to_string();
    }
    if spool_dir.starts_with('.') {
        spool_dir.to_string()
    } else {
        format!(".{spool_dir}")
    }
}

pub fn render_rel_path(rel: &str, spool_dir: &str) -> Cow<'_, str> {
    if spool_dir == ".spool" {
        return Cow::Borrowed(rel);
    }
    if let Some(rest) = rel.strip_prefix(".spool/") {
        return Cow::Owned(format!("{spool_dir}/{rest}"));
    }
    Cow::Borrowed(rel)
}

pub fn render_bytes<'a>(bytes: &'a [u8], spool_dir: &str) -> Cow<'a, [u8]> {
    if spool_dir == ".spool" {
        return Cow::Borrowed(bytes);
    }

    let Ok(s) = std::str::from_utf8(bytes) else {
        return Cow::Borrowed(bytes);
    };

    // Match TS replaceHardcodedDotSpoolPaths: replace `.spool/` occurrences.
    let out = s.replace(".spool/", &format!("{spool_dir}/"));
    Cow::Owned(out.into_bytes())
}

pub const SPOOL_START_MARKER: &str = "<!-- SPOOL:START -->";
pub const SPOOL_END_MARKER: &str = "<!-- SPOOL:END -->";

pub fn extract_managed_block(text: &str) -> Option<&str> {
    let start = find_marker_index(text, SPOOL_START_MARKER, 0)?;
    let end = find_marker_index(text, SPOOL_END_MARKER, start + SPOOL_START_MARKER.len())?;
    let after_start = line_end(text, start + SPOOL_START_MARKER.len());
    let before_end = line_start(text, end);
    if before_end < after_start {
        return Some("");
    }
    Some(text[after_start..before_end].trim_matches('\n'))
}

fn line_start(text: &str, idx: usize) -> usize {
    let bytes = text.as_bytes();
    let mut i = idx;
    while i > 0 {
        if bytes[i - 1] == b'\n' {
            break;
        }
        i -= 1;
    }
    i
}

fn line_end(text: &str, idx: usize) -> usize {
    let bytes = text.as_bytes();
    let mut i = idx;
    while i < bytes.len() {
        if bytes[i] == b'\n' {
            return i + 1;
        }
        i += 1;
    }
    i
}

fn is_marker_on_own_line(content: &str, marker_index: usize, marker_len: usize) -> bool {
    let bytes = content.as_bytes();

    let mut i = marker_index;
    while i > 0 {
        let c = bytes[i - 1];
        if c == b'\n' {
            break;
        }
        if c != b' ' && c != b'\t' && c != b'\r' {
            return false;
        }
        i -= 1;
    }

    let mut j = marker_index + marker_len;
    while j < bytes.len() {
        let c = bytes[j];
        if c == b'\n' {
            break;
        }
        if c != b' ' && c != b'\t' && c != b'\r' {
            return false;
        }
        j += 1;
    }

    true
}

fn find_marker_index(content: &str, marker: &str, from_index: usize) -> Option<usize> {
    let mut search_from = from_index;
    while let Some(rel) = content.get(search_from..)?.find(marker) {
        let idx = search_from + rel;
        if is_marker_on_own_line(content, idx, marker.len()) {
            return Some(idx);
        }
        search_from = idx + marker.len();
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_spool_dir_prefixes_dot() {
        assert_eq!(normalize_spool_dir(".spool"), ".spool");
        assert_eq!(normalize_spool_dir("spool"), ".spool");
        assert_eq!(normalize_spool_dir(".x"), ".x");
    }

    #[test]
    fn render_rel_path_rewrites_spool_prefix() {
        assert_eq!(
            render_rel_path(".spool/AGENTS.md", ".spool"),
            ".spool/AGENTS.md"
        );
        assert_eq!(render_rel_path(".spool/AGENTS.md", ".x"), ".x/AGENTS.md");
        assert_eq!(render_rel_path("AGENTS.md", ".x"), "AGENTS.md");
    }

    #[test]
    fn render_bytes_rewrites_dot_spool_paths() {
        let b = render_bytes(b"see .spool/AGENTS.md", ".x");
        assert_eq!(std::str::from_utf8(&b).unwrap(), "see .x/AGENTS.md");
    }

    #[test]
    fn extract_managed_block_returns_inner_content() {
        let s = "pre\n<!-- SPOOL:START -->\nhello\nworld\n<!-- SPOOL:END -->\npost\n";
        assert_eq!(extract_managed_block(s), Some("hello\nworld"));
    }
}
