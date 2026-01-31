use std::fs;
use std::path::PathBuf;

#[test]
fn user_guidance_template_exists_and_has_markers() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("assets/default/project");
    let path = root.join(".spool/user-guidance.md");
    assert!(path.exists(), "missing template file: {path:?}");

    let contents = fs::read_to_string(&path).expect("read should succeed");
    assert!(contents.contains("<!-- SPOOL:START -->"));
    assert!(contents.contains("<!-- SPOOL:END -->"));
    assert!(
        contents.contains("## Your Guidance"),
        "expected guidance section header"
    );
}
