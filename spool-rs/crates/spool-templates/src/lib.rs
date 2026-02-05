use std::borrow::Cow;

use include_dir::{Dir, include_dir};

pub mod agents;
pub mod instructions;

static DEFAULT_PROJECT_DIR: Dir<'static> =
    include_dir!("$CARGO_MANIFEST_DIR/assets/default/project");
static DEFAULT_HOME_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/assets/default/home");
static SKILLS_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/assets/skills");
static ADAPTERS_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/assets/adapters");
static COMMANDS_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/assets/commands");
static AGENTS_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/assets/agents");

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

pub fn skills_files() -> Vec<EmbeddedFile> {
    dir_files(&SKILLS_DIR)
}

pub fn adapters_files() -> Vec<EmbeddedFile> {
    dir_files(&ADAPTERS_DIR)
}

/// Get a specific skill file by path (e.g., "brainstorming/SKILL.md")
pub fn get_skill_file(path: &str) -> Option<&'static [u8]> {
    SKILLS_DIR.get_file(path).map(|f| f.contents())
}

/// Get a specific adapter file by path (e.g., "claude/session-start.sh")
pub fn get_adapter_file(path: &str) -> Option<&'static [u8]> {
    ADAPTERS_DIR.get_file(path).map(|f| f.contents())
}

pub fn commands_files() -> Vec<EmbeddedFile> {
    dir_files(&COMMANDS_DIR)
}

/// Get a specific command file by path (e.g., "spool-apply.md")
pub fn get_command_file(path: &str) -> Option<&'static [u8]> {
    COMMANDS_DIR.get_file(path).map(|f| f.contents())
}

fn dir_files(dir: &'static Dir<'static>) -> Vec<EmbeddedFile> {
    let mut out = Vec::new();
    collect_dir_files(dir, &mut out);
    out
}

fn collect_dir_files(dir: &'static Dir<'static>, out: &mut Vec<EmbeddedFile>) {
    for f in dir.files() {
        out.push(EmbeddedFile {
            relative_path: f.path().to_str().unwrap_or_default(),
            contents: f.contents(),
        });
    }

    for d in dir.dirs() {
        collect_dir_files(d, out);
    }
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

pub fn render_rel_path<'a>(rel: &'a str, spool_dir: &str) -> Cow<'a, str> {
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

    // TS `updateFileWithMarkers` writes:
    //   start + "\n" + content + "\n" + end
    // The substring between markers therefore always ends with the *separator* newline
    // immediately before the end marker line. We want to recover the original `content`
    // argument, so we drop exactly one trailing line break.
    let mut inner = &text[after_start..before_end];
    if inner.ends_with('\n') {
        inner = &inner[..inner.len() - 1];
        if inner.ends_with('\r') {
            inner = &inner[..inner.len() - 1];
        }
    }
    Some(inner)
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

    #[test]
    fn extract_managed_block_preserves_trailing_newline_from_content() {
        // Content ends with a newline, plus the TS separator newline before the end marker.
        let s = "pre\n<!-- SPOOL:START -->\nhello\nworld\n\n<!-- SPOOL:END -->\npost\n";
        assert_eq!(extract_managed_block(s), Some("hello\nworld\n"));
    }

    #[test]
    fn default_project_files_contains_expected_files() {
        let files = default_project_files();
        assert!(!files.is_empty());

        let mut has_user_guidance = false;
        for EmbeddedFile {
            relative_path,
            contents,
        } in files
        {
            if relative_path == ".spool/user-guidance.md" {
                has_user_guidance = true;
                let contents = std::str::from_utf8(contents).expect("template should be UTF-8");
                assert!(contents.contains(SPOOL_START_MARKER));
                assert!(contents.contains(SPOOL_END_MARKER));
            }
        }

        assert!(
            has_user_guidance,
            "expected .spool/user-guidance.md in templates"
        );
    }

    #[test]
    fn default_home_files_returns_a_vec() {
        // The default home templates may be empty, but should still be loadable.
        let _ = default_home_files();
    }

    #[test]
    fn normalize_spool_dir_empty_defaults_to_dot_spool() {
        assert_eq!(normalize_spool_dir(""), ".spool");
    }

    #[test]
    fn render_bytes_returns_borrowed_when_no_rewrite_needed() {
        let b = b"see .spool/AGENTS.md";
        let out = render_bytes(b, ".spool");
        assert_eq!(out.as_ref(), b);

        let b = b"no spool path";
        let out = render_bytes(b, ".x");
        assert_eq!(out.as_ref(), b);
    }

    #[test]
    fn render_bytes_preserves_non_utf8() {
        let b = [0xff, 0x00, 0x41];
        let out = render_bytes(&b, ".x");
        assert_eq!(out.as_ref(), &b);
    }

    #[test]
    fn extract_managed_block_rejects_inline_markers() {
        let s = "pre <!-- SPOOL:START -->\nhello\n<!-- SPOOL:END -->\n";
        assert_eq!(extract_managed_block(s), None);
    }

    #[test]
    fn extract_managed_block_returns_empty_for_empty_inner() {
        let s = "<!-- SPOOL:START -->\n<!-- SPOOL:END -->\n";
        assert_eq!(extract_managed_block(s), Some(""));
    }
}
