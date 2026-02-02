use crate::io;
use miette::{Result, miette};
use pulldown_cmark::{Options, Parser, html};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

fn state_dir(spool_path: &Path) -> PathBuf {
    spool_path.join(".state").join("docs-server")
}

fn site_dir(spool_path: &Path) -> PathBuf {
    state_dir(spool_path).join("site")
}

fn write_if_missing(path: &Path, contents: &[u8]) -> Result<()> {
    if path.exists() {
        return Ok(());
    }
    io::write(path, contents)
}

pub(crate) fn ensure_base_files(spool_path: &Path) -> Result<()> {
    let dir = site_dir(spool_path);
    io::create_dir_all(&dir)?;

    let index = dir.join("index.html");
    write_if_missing(
        &index,
        br#"<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spool</title>
    <style>
      :root {
        --bg: #0b0e14;
        --panel: #121825;
        --text: #e7ecf3;
        --muted: #9fb0c6;
        --link: #76b7ff;
        --border: #22314d;
        --code-bg: #0f1521;
      }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; background: radial-gradient(1200px 600px at 20% -10%, #1b2a4d 0%, transparent 60%), var(--bg); color: var(--text); }
      a { color: var(--link); text-decoration: none; }
      a:hover { text-decoration: underline; }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      .wrap { max-width: 980px; margin: 0 auto; padding: 28px 18px 46px; }
      .hero { background: linear-gradient(180deg, rgba(18,24,37,0.92), rgba(18,24,37,0.72)); border: 1px solid var(--border); border-radius: 14px; padding: 18px 18px 14px; }
      .hero h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 0.2px; }
      .hero p { margin: 0 0 14px; color: var(--muted); }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
      .card { background: rgba(18,24,37,0.7); border: 1px solid var(--border); border-radius: 12px; padding: 12px 12px 10px; }
      .card h2 { margin: 0 0 8px; font-size: 14px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
      .card ul { margin: 0; padding-left: 18px; }
      .card li { margin: 6px 0; }
      .footer { margin-top: 14px; color: var(--muted); font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="hero">
        <h1>Spool Local Docs</h1>
        <p>Browse generated HTML for .spool artifacts and project docs.</p>
        <div class="grid">
          <div class="card">
            <h2>Spool</h2>
            <ul>
              <li><a href="/spool/changes/">.spool/changes/</a></li>
              <li><a href="/spool/specs/">.spool/specs/</a></li>
              <li><a href="/spool/modules/">.spool/modules/</a></li>
              <li><a href="/spool/planning/">.spool/planning/</a></li>
              <li><a href="/spool/research/">.spool/research/</a></li>
            </ul>
          </div>
          <div class="card">
            <h2>Project</h2>
            <ul>
              <li><a href="/docs/">docs/</a></li>
              <li><a href="/documents/">documents/</a></li>
            </ul>
          </div>
        </div>
        <div class="footer"><a href="/manifest.json">manifest.json</a></div>
      </div>
    </div>
  </body>
</html>
"#,
    )?;

    let manifest = dir.join("manifest.json");
    write_if_missing(
        &manifest,
        br#"{
  "version": "1",
  "routes": [
    "/spool/changes/",
    "/spool/specs/",
    "/spool/modules/",
    "/spool/planning/",
    "/spool/research/",
    "/docs/",
    "/documents/"
  ]
}
"#,
    )?;

    Ok(())
}

fn remove_dir_if_exists(path: &Path) -> Result<()> {
    if !path.exists() {
        return Ok(());
    }
    std::fs::remove_dir_all(path)
        .map_err(|e| miette!("I/O error removing {p}: {e}", p = path.display()))
}

fn copy_tree(src: &Path, dst: &Path) -> Result<()> {
    io::create_dir_all(dst)?;
    for entry in WalkDir::new(src) {
        let entry = entry.map_err(|e| miette!("WalkDir error: {e}"))?;
        let rel = entry
            .path()
            .strip_prefix(src)
            .map_err(|e| miette!("Path prefix error: {e}"))?;
        let out_path = dst.join(rel);
        if entry.file_type().is_dir() {
            io::create_dir_all(&out_path)?;
            continue;
        }

        let Some(parent) = out_path.parent() else {
            continue;
        };
        io::create_dir_all(parent)?;
        std::fs::copy(entry.path(), &out_path).map_err(|e| {
            miette!(
                "I/O error copying {s} -> {d}: {e}",
                s = entry.path().display(),
                d = out_path.display()
            )
        })?;
    }
    Ok(())
}

fn is_markdown(path: &Path) -> bool {
    let Some(ext) = path.extension() else {
        return false;
    };
    ext.eq_ignore_ascii_case("md")
}

fn render_markdown_to_html(md: &str) -> String {
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_TASKLISTS);
    opts.insert(Options::ENABLE_FOOTNOTES);
    opts.insert(Options::ENABLE_HEADING_ATTRIBUTES);
    opts.insert(Options::ENABLE_SMART_PUNCTUATION);

    let parser = Parser::new_ext(md, opts);
    let mut out = String::new();
    html::push_html(&mut out, parser);
    out
}

fn escape_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(ch),
        }
    }
    out
}

fn html_page(title: &str, breadcrumbs: &str, body: &str) -> String {
    let title = escape_html(title);
    format!(
        "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <title>{title}</title>\n    <style>\n      :root {{ --bg:#0b0e14; --panel:#121825; --text:#e7ecf3; --muted:#9fb0c6; --link:#76b7ff; --border:#22314d; --code-bg:#0f1521; }}\n      body {{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; background: radial-gradient(1200px 600px at 20% -10%, #1b2a4d 0%, transparent 60%), var(--bg); color: var(--text); }}\n      a {{ color: var(--link); text-decoration: none; }}\n      a:hover {{ text-decoration: underline; }}\n      code, pre {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }}\n      pre {{ background: var(--code-bg); border: 1px solid var(--border); border-radius: 10px; padding: 12px; overflow: auto; }}\n      code {{ background: rgba(15,21,33,0.6); border: 1px solid rgba(34,49,77,0.6); border-radius: 6px; padding: 1px 5px; }}\n      .wrap {{ max-width: 1100px; margin: 0 auto; padding: 18px 14px 52px; }}\n      .top {{ display:flex; gap:10px; align-items:center; justify-content:space-between; margin-bottom: 12px; }}\n      .crumbs {{ color: var(--muted); font-size: 13px; }}\n      .crumbs a {{ color: var(--muted); }}\n      .nav {{ display:flex; gap:10px; flex-wrap:wrap; font-size: 13px; }}\n      .nav a {{ background: rgba(18,24,37,0.7); border: 1px solid var(--border); border-radius: 999px; padding: 6px 10px; }}\n      .panel {{ background: rgba(18,24,37,0.74); border: 1px solid var(--border); border-radius: 14px; padding: 14px 14px 10px; }}\n      .panel h1 {{ margin: 0 0 10px; font-size: 18px; letter-spacing: 0.2px; }}\n      .panel .md {{ line-height: 1.55; }}\n      .panel .md h1, .panel .md h2, .panel .md h3 {{ margin-top: 18px; }}\n      .panel .md table {{ border-collapse: collapse; width: 100%; }}\n      .panel .md th, .panel .md td {{ border: 1px solid var(--border); padding: 6px 8px; }}\n      .panel .md blockquote {{ border-left: 3px solid var(--border); margin: 10px 0; padding: 2px 10px; color: var(--muted); }}\n      .list {{ list-style: none; padding: 0; margin: 0; }}\n      .list li {{ margin: 6px 0; }}\n      .list a {{ display:inline-block; padding: 2px 0; }}\n    </style>\n  </head>\n  <body>\n    <div class=\"wrap\">\n      <div class=\"top\">\n        <div class=\"crumbs\">{breadcrumbs}</div>\n        <div class=\"nav\">\n          <a href=\"/\">Home</a>\n          <a href=\"/spool/changes/\">Changes</a>\n          <a href=\"/spool/specs/\">Specs</a>\n          <a href=\"/spool/modules/\">Modules</a>\n          <a href=\"/docs/\">Docs</a>\n        </div>\n      </div>\n      <div class=\"panel\">\n        <h1>{title}</h1>\n        {body}\n      </div>\n    </div>\n  </body>\n</html>\n"
    )
}

fn crumbs_for(rel_url: &str) -> String {
    let mut parts: Vec<&str> = Vec::new();
    for p in rel_url.split('/') {
        if p.is_empty() {
            continue;
        }
        parts.push(p);
    }

    let mut out = String::new();
    out.push_str("<a href=\"/\">/</a>");
    let mut path = String::new();
    for part in parts {
        path.push('/');
        path.push_str(part);
        path.push('/');
        out.push_str(" / ");
        out.push_str(&format!(
            "<a href=\"{p}\">{t}</a>",
            p = path,
            t = escape_html(part)
        ));
    }
    out
}

fn write_dir_index(dir: &Path, rel_url: &str) -> Result<()> {
    let mut entries: Vec<(String, bool)> = Vec::new();
    let rd = std::fs::read_dir(dir)
        .map_err(|e| miette!("I/O error reading dir {p}: {e}", p = dir.display()))?;
    for ent in rd {
        let ent = ent.map_err(|e| miette!("I/O error reading dir entry: {e}"))?;
        let name = ent.file_name().to_string_lossy().to_string();
        if name == "index.html" {
            continue;
        }
        if name.ends_with(".md.html") {
            continue;
        }
        let is_dir = ent
            .file_type()
            .map_err(|e| miette!("I/O error reading file type: {e}"))?
            .is_dir();
        entries.push((name, is_dir));
    }

    entries.sort_by(|a, b| {
        let (an, ad) = a;
        let (bn, bd) = b;
        match (ad, bd) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => an.to_ascii_lowercase().cmp(&bn.to_ascii_lowercase()),
        }
    });

    let mut list = String::new();
    list.push_str("<ul class=\"list\">\n");
    if rel_url != "/" {
        list.push_str("  <li><a href=\"../\">..</a></li>\n");
    }
    for (name, is_dir) in entries {
        let href = if is_dir {
            format!("{name}/")
        } else {
            name.clone()
        };
        list.push_str(&format!(
            "  <li><a href=\"{h}\">{t}</a></li>\n",
            h = escape_html(&href),
            t = escape_html(&name)
        ));
    }
    list.push_str("</ul>\n");

    let crumbs = crumbs_for(rel_url);
    let body = format!("<div class=\"md\">{list}</div>");
    let page = html_page("Index", &crumbs, &body);
    io::write(&dir.join("index.html"), page.as_bytes())?;
    Ok(())
}

fn write_markdown_html(dst_md_path: &Path, rel_url: &str) -> Result<()> {
    let md = io::read_to_string(dst_md_path)?;
    let rendered = render_markdown_to_html(&md);
    let crumbs = crumbs_for(rel_url);
    let body = format!("<div class=\"md\">{rendered}</div>");
    let title = dst_md_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Document".to_string());
    let page = html_page(&title, &crumbs, &body);

    let out_path = PathBuf::from(format!("{}.html", dst_md_path.display()));
    io::write(&out_path, page.as_bytes())?;
    Ok(())
}

fn build_indexes_and_renders(root: &Path, rel_url_root: &str) -> Result<()> {
    for entry in WalkDir::new(root) {
        let entry = entry.map_err(|e| miette!("WalkDir error: {e}"))?;
        let rel = entry
            .path()
            .strip_prefix(root)
            .map_err(|e| miette!("Path prefix error: {e}"))?;
        let rel_url = if rel.as_os_str().is_empty() {
            rel_url_root.to_string()
        } else {
            let mut s = rel_url_root.trim_end_matches('/').to_string();
            s.push('/');
            s.push_str(&rel.to_string_lossy().replace('\\', "/"));
            if entry.file_type().is_dir() {
                s.push('/');
            }
            s
        };

        if entry.file_type().is_dir() {
            write_dir_index(entry.path(), &rel_url)?;
            continue;
        }

        if is_markdown(entry.path()) {
            write_markdown_html(entry.path(), &rel_url)?;
        }
    }
    Ok(())
}

pub(crate) fn build_site(project_root: &Path, spool_path: &Path) -> Result<()> {
    ensure_base_files(spool_path)?;

    let site = site_dir(spool_path);
    let spool_out = site.join("spool");
    let docs_out = site.join("docs");
    let documents_out = site.join("documents");

    remove_dir_if_exists(&spool_out)?;
    remove_dir_if_exists(&docs_out)?;
    remove_dir_if_exists(&documents_out)?;

    let changes_src = crate::paths::changes_dir(spool_path);
    let specs_src = crate::paths::specs_dir(spool_path);
    let modules_src = crate::paths::modules_dir(spool_path);
    let planning_src = spool_path.join("planning");
    let research_src = spool_path.join("research");
    let docs_src = project_root.join("docs");
    let documents_src = project_root.join("documents");

    if changes_src.exists() {
        copy_tree(&changes_src, &spool_out.join("changes"))?;
    }
    if specs_src.exists() {
        copy_tree(&specs_src, &spool_out.join("specs"))?;
    }
    if modules_src.exists() {
        copy_tree(&modules_src, &spool_out.join("modules"))?;
    }
    if planning_src.exists() {
        copy_tree(&planning_src, &spool_out.join("planning"))?;
    }
    if research_src.exists() {
        copy_tree(&research_src, &spool_out.join("research"))?;
    }
    if docs_src.exists() {
        copy_tree(&docs_src, &docs_out)?;
    }
    if documents_src.exists() {
        copy_tree(&documents_src, &documents_out)?;
    }

    if spool_out.exists() {
        build_indexes_and_renders(&spool_out, "/spool/")?;
    }
    if docs_out.exists() {
        build_indexes_and_renders(&docs_out, "/docs/")?;
    }
    if documents_out.exists() {
        build_indexes_and_renders(&documents_out, "/documents/")?;
    }

    Ok(())
}
