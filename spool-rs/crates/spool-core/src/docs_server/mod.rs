use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use chrono::Utc;
use miette::{Result, bail, miette};
use serde::{Deserialize, Serialize};
use serde_json::Value;

const DEFAULT_BIND: &str = "127.0.0.1";
const DEFAULT_PORT: u16 = 9009;

mod site;

#[derive(Debug, Clone)]
pub struct ServeConfig {
    pub bind: String,
    pub port: u16,
    pub token: Option<String>,
    pub caddy_bin: Option<String>,
}

impl Default for ServeConfig {
    fn default() -> Self {
        Self {
            bind: DEFAULT_BIND.to_string(),
            port: DEFAULT_PORT,
            token: None,
            caddy_bin: None,
        }
    }
}

pub fn serve_config_from_json(v: &Value) -> ServeConfig {
    let mut cfg = ServeConfig::default();
    let Value::Object(top) = v else {
        return cfg;
    };

    let Some(serve) = top.get("serve") else {
        return cfg;
    };
    let Value::Object(serve) = serve else {
        return cfg;
    };

    if let Some(Value::String(s)) = serve.get("bind") {
        let s = s.trim();
        if !s.is_empty() {
            cfg.bind = s.to_string();
        }
    }

    if let Some(v) = serve.get("port") {
        let port = match v {
            Value::Number(n) => n.as_u64().and_then(|u| u16::try_from(u).ok()),
            Value::String(s) => s.trim().parse::<u16>().ok(),
            Value::Null => None,
            Value::Bool(_) => None,
            Value::Array(_) => None,
            Value::Object(_) => None,
        };
        if let Some(port) = port {
            cfg.port = port;
        }
    }

    if let Some(Value::String(s)) = serve.get("token") {
        let s = s.trim();
        if !s.is_empty() {
            cfg.token = Some(s.to_string());
        }
    }

    if let Some(Value::String(s)) = serve.get("caddyBin") {
        let s = s.trim();
        if !s.is_empty() {
            cfg.caddy_bin = Some(s.to_string());
        }
    }

    cfg
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocsServerState {
    pub pid: u32,
    pub bind: String,
    pub port: u16,
    pub token: Option<String>,
    pub started_at: String,
}

#[derive(Debug, Clone)]
pub struct StartResult {
    pub url: String,
    pub bind: String,
    pub port: u16,
    pub token: Option<String>,
    pub reused: bool,
}

pub fn state_dir(spool_path: &Path) -> PathBuf {
    spool_path.join(".state").join("docs-server")
}

fn state_path(spool_path: &Path) -> PathBuf {
    state_dir(spool_path).join("state.json")
}

fn caddyfile_path(spool_path: &Path) -> PathBuf {
    state_dir(spool_path).join("Caddyfile")
}

fn site_dir(spool_path: &Path) -> PathBuf {
    state_dir(spool_path).join("site")
}

fn logs_dir(spool_path: &Path) -> PathBuf {
    state_dir(spool_path).join("logs")
}

fn access_log_path(spool_path: &Path) -> PathBuf {
    logs_dir(spool_path).join("access.log")
}

fn stderr_log_path(spool_path: &Path) -> PathBuf {
    logs_dir(spool_path).join("caddy.stderr.log")
}

fn is_loopback_bind(bind: &str) -> bool {
    let b = bind.trim();
    b == "127.0.0.1" || b == "localhost" || b == "::1"
}

pub fn load_state(spool_path: &Path) -> Result<Option<DocsServerState>> {
    let path = state_path(spool_path);
    let Some(contents) = crate::io::read_to_string_optional(&path)? else {
        return Ok(None);
    };
    let parsed: DocsServerState = serde_json::from_str(&contents).map_err(|e| {
        miette!(
            "Invalid docs server state JSON at {p}: {e}",
            p = path.display()
        )
    })?;
    Ok(Some(parsed))
}

fn save_state(spool_path: &Path, state: &DocsServerState) -> Result<()> {
    crate::io::create_dir_all(&state_dir(spool_path))?;
    let path = state_path(spool_path);
    let mut bytes = serde_json::to_vec_pretty(state)
        .map_err(|e| miette!("Failed to serialize docs server state: {e}"))?;
    bytes.push(b'\n');
    crate::io::write(&path, bytes)
}

pub fn choose_port(bind: &str, start: u16) -> Result<u16> {
    for port in start..=u16::MAX {
        let addr = format!("{bind}:{port}");
        match TcpListener::bind(&addr) {
            Ok(listener) => {
                drop(listener);
                return Ok(port);
            }
            Err(_) => continue,
        }
    }
    bail!("No available port found starting from {start}")
}

fn caddy_bin_from_env_or_default(cfg: &ServeConfig) -> String {
    if let Some(v) = cfg.caddy_bin.as_deref() {
        return v.to_string();
    }
    if let Ok(v) = std::env::var("SPOOL_CADDY_BIN") {
        let v = v.trim();
        if !v.is_empty() {
            return v.to_string();
        }
    }
    "caddy".to_string()
}

fn ensure_caddy_available(caddy_bin: &str) -> Result<()> {
    let out = Command::new(caddy_bin)
        .arg("version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();

    match out {
        Ok(s) if s.success() => Ok(()),
        _ => bail!(
            "Required dependency 'caddy' not found. Install Caddy and ensure it's on PATH (https://caddyserver.com/docs/install)."
        ),
    }
}

fn ensure_site_files(spool_path: &Path) -> Result<()> {
    site::ensure_base_files(spool_path)
}

fn quoted(p: &Path) -> String {
    format!("\"{}\"", p.display())
}

fn write_caddyfile(
    _project_root: &Path,
    spool_path: &Path,
    bind: &str,
    port: u16,
    token: Option<&str>,
) -> Result<()> {
    crate::io::create_dir_all(&logs_dir(spool_path))?;
    ensure_site_files(spool_path)?;

    let site = site_dir(spool_path);
    let access = access_log_path(spool_path);

    // Serve generated site content under `.spool/.state/docs-server/site/`.
    // `site::build_site` copies source directories into this location and renders
    // Markdown to `*.md.html` alongside `index.html` directory listings.
    let changes = site.join("spool").join("changes");
    let specs = site.join("spool").join("specs");
    let modules = site.join("spool").join("modules");
    let planning = site.join("spool").join("planning");
    let research = site.join("spool").join("research");
    let docs = site.join("docs");
    let documents = site.join("documents");

    // Serve only if the directories exist (Caddy's file_server with missing root is noisy).
    let mut handlers = String::new();
    handlers.push_str("(spool_site) {\n");
    handlers.push_str(&format!("  log {{ output file {} }}\n", quoted(&access)));
    if changes.exists() {
        handlers.push_str(&format!(
            "  handle_path /spool/changes/* {{ root * {}; try_files {{path}}.html {{path}} {{path}}/index.html; file_server }}\n",
            quoted(&changes)
        ));
    }
    if specs.exists() {
        handlers.push_str(&format!(
            "  handle_path /spool/specs/* {{ root * {}; try_files {{path}}.html {{path}} {{path}}/index.html; file_server }}\n",
            quoted(&specs)
        ));
    }
    if modules.exists() {
        handlers.push_str(&format!(
            "  handle_path /spool/modules/* {{ root * {}; try_files {{path}}.html {{path}} {{path}}/index.html; file_server }}\n",
            quoted(&modules)
        ));
    }
    if planning.exists() {
        handlers.push_str(&format!(
            "  handle_path /spool/planning/* {{ root * {}; try_files {{path}}.html {{path}} {{path}}/index.html; file_server }}\n",
            quoted(&planning)
        ));
    }
    if research.exists() {
        handlers.push_str(&format!(
            "  handle_path /spool/research/* {{ root * {}; try_files {{path}}.html {{path}} {{path}}/index.html; file_server }}\n",
            quoted(&research)
        ));
    }
    if docs.exists() {
        handlers.push_str(&format!(
            "  handle_path /docs/* {{ root * {}; try_files {{path}}.html {{path}} {{path}}/index.html; file_server }}\n",
            quoted(&docs)
        ));
    }
    if documents.exists() {
        handlers.push_str(&format!(
            "  handle_path /documents/* {{ root * {}; try_files {{path}}.html {{path}} {{path}}/index.html; file_server }}\n",
            quoted(&documents)
        ));
    }
    handlers.push_str(&format!("  root * {}\n", quoted(&site)));
    handlers.push_str("  try_files {{path}}.html {{path}} {{path}}/index.html /index.html\n");
    handlers.push_str("  file_server\n");
    handlers.push_str("}\n");

    let mut cfg = String::new();
    cfg.push_str(&handlers);
    cfg.push('\n');
    cfg.push_str(&format!("{bind}:{port} {{\n"));
    cfg.push_str(&format!("  bind {bind}\n"));

    if let Some(tok) = token {
        cfg.push_str(&format!("  @token_ok path /t/{tok}/*\n"));
        cfg.push_str("  handle @token_ok {\n");
        cfg.push_str(&format!("    uri strip_prefix /t/{tok}\n"));
        cfg.push_str("    import spool_site\n");
        cfg.push_str("  }\n");
        cfg.push_str("  respond \"Forbidden\" 403\n");
    } else {
        cfg.push_str("  import spool_site\n");
    }
    cfg.push_str("}\n");

    crate::io::create_dir_all(&state_dir(spool_path))?;
    crate::io::write(&caddyfile_path(spool_path), cfg.as_bytes())?;
    Ok(())
}

fn url_for(bind: &str, port: u16, token: Option<&str>) -> String {
    if let Some(tok) = token {
        return format!("http://{bind}:{port}/t/{tok}/");
    }
    format!("http://{bind}:{port}/")
}

fn is_pid_running(pid: u32) -> bool {
    #[cfg(unix)]
    {
        Command::new("kill")
            .arg("-0")
            .arg(pid.to_string())
            .status()
            .is_ok_and(|s| s.success())
    }

    #[cfg(windows)]
    {
        let out = Command::new("tasklist")
            .arg("/FI")
            .arg(format!("PID eq {pid}"))
            .output();
        let Ok(out) = out else {
            return false;
        };
        let text = String::from_utf8_lossy(&out.stdout);
        text.contains(&pid.to_string())
    }
}

fn kill_pid(pid: u32) -> Result<()> {
    #[cfg(unix)]
    {
        let status = Command::new("kill")
            .arg(pid.to_string())
            .status()
            .map_err(|e| miette!("Failed to run kill: {e}"))?;
        if !status.success() {
            bail!("Failed to stop server (kill returned non-zero)")
        }
        Ok(())
    }

    #[cfg(windows)]
    {
        let status = Command::new("taskkill")
            .arg("/PID")
            .arg(pid.to_string())
            .arg("/T")
            .arg("/F")
            .status()
            .map_err(|e| miette!("Failed to run taskkill: {e}"))?;
        if !status.success() {
            bail!("Failed to stop server (taskkill returned non-zero)")
        }
        Ok(())
    }
}

pub fn start(project_root: &Path, spool_path: &Path, cfg: ServeConfig) -> Result<StartResult> {
    if let Some(state) = load_state(spool_path)? {
        if is_pid_running(state.pid) {
            return Ok(StartResult {
                url: url_for(&state.bind, state.port, state.token.as_deref()),
                bind: state.bind,
                port: state.port,
                token: state.token,
                reused: true,
            });
        }
        // stale state
        let _ = std::fs::remove_file(state_path(spool_path));
    }

    let mut bind = cfg.bind.trim().to_string();
    if bind.is_empty() {
        bind = DEFAULT_BIND.to_string();
    }

    let port = if cfg.port == 0 {
        DEFAULT_PORT
    } else {
        cfg.port
    };
    let chosen = choose_port(&bind, port)?;

    let needs_token = !is_loopback_bind(&bind);
    let token = if needs_token {
        Some(
            cfg.token
                .clone()
                .unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
        )
    } else {
        None
    };

    let caddy_bin = caddy_bin_from_env_or_default(&cfg);
    ensure_caddy_available(&caddy_bin)?;

    site::build_site(project_root, spool_path)?;
    write_caddyfile(project_root, spool_path, &bind, chosen, token.as_deref())?;

    crate::io::create_dir_all(&logs_dir(spool_path))?;
    let stderr_file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(stderr_log_path(spool_path))
        .map_err(|e| miette!("Failed to open caddy stderr log: {e}"))?;

    let mut cmd = Command::new(caddy_bin);
    cmd.arg("run")
        .arg("--config")
        .arg(caddyfile_path(spool_path))
        .arg("--adapter")
        .arg("caddyfile")
        .current_dir(project_root)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(stderr_file);

    let child = cmd
        .spawn()
        .map_err(|e| miette!("Failed to start caddy: {e}"))?;
    let pid = child.id();

    let state = DocsServerState {
        pid,
        bind: bind.clone(),
        port: chosen,
        token: token.clone(),
        started_at: Utc::now().to_rfc3339(),
    };
    save_state(spool_path, &state)?;

    Ok(StartResult {
        url: url_for(&bind, chosen, token.as_deref()),
        bind,
        port: chosen,
        token,
        reused: false,
    })
}

pub fn stop(spool_path: &Path) -> Result<bool> {
    let Some(state) = load_state(spool_path)? else {
        return Ok(false);
    };

    if is_pid_running(state.pid) {
        kill_pid(state.pid)?;
    }

    let _ = std::fs::remove_file(state_path(spool_path));
    Ok(true)
}

pub fn status(spool_path: &Path) -> Result<Option<StartResult>> {
    let Some(state) = load_state(spool_path)? else {
        return Ok(None);
    };
    if !is_pid_running(state.pid) {
        return Ok(None);
    }
    Ok(Some(StartResult {
        url: url_for(&state.bind, state.port, state.token.as_deref()),
        bind: state.bind,
        port: state.port,
        token: state.token,
        reused: true,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;
    use tempfile::tempdir;

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    #[test]
    fn choose_port_increments_when_taken() {
        let listener = TcpListener::bind("127.0.0.1:9009").unwrap();
        let next = choose_port("127.0.0.1", 9009).unwrap();
        assert!(next >= 9010);
        drop(listener);
    }

    #[test]
    fn state_dir_is_under_spool_state_docs_server() {
        let dir = state_dir(Path::new("/tmp/spool"));
        assert!(dir.ends_with(Path::new(".state/docs-server")));
    }

    #[test]
    fn load_state_returns_none_when_missing() {
        let td = tempdir().unwrap();
        let spool_path = td.path();
        let loaded = load_state(spool_path).unwrap();
        assert!(loaded.is_none());
    }

    #[test]
    fn save_and_load_state_roundtrip() {
        let td = tempdir().unwrap();
        let spool_path = td.path();

        let state = DocsServerState {
            pid: 123,
            bind: "127.0.0.1".to_string(),
            port: 9009,
            token: Some("tok".to_string()),
            started_at: "2026-01-01T00:00:00Z".to_string(),
        };

        save_state(spool_path, &state).unwrap();
        let loaded = load_state(spool_path).unwrap().unwrap();
        assert_eq!(loaded.pid, 123);
        assert_eq!(loaded.bind, "127.0.0.1");
        assert_eq!(loaded.port, 9009);
        assert_eq!(loaded.token.as_deref(), Some("tok"));
    }

    #[test]
    fn load_state_errors_on_invalid_json() {
        let td = tempdir().unwrap();
        let spool_path = td.path();

        crate::io::create_dir_all(&state_dir(spool_path)).unwrap();
        let path = state_dir(spool_path).join("state.json");
        crate::io::write(&path, b"not json\n").unwrap();

        let err = load_state(spool_path).unwrap_err();
        let msg = format!("{err:?}");
        assert!(msg.contains("Invalid docs server state JSON"));
    }

    #[test]
    fn caddy_bin_from_env_uses_cfg_then_env_then_default() {
        let _g = ENV_LOCK.lock().unwrap();

        let cfg = ServeConfig {
            caddy_bin: Some("/custom/caddy".to_string()),
            ..ServeConfig::default()
        };
        unsafe {
            std::env::set_var("SPOOL_CADDY_BIN", "from-env");
        }
        assert_eq!(caddy_bin_from_env_or_default(&cfg), "/custom/caddy");

        let cfg = ServeConfig {
            caddy_bin: None,
            ..ServeConfig::default()
        };
        assert_eq!(caddy_bin_from_env_or_default(&cfg), "from-env");

        unsafe {
            std::env::remove_var("SPOOL_CADDY_BIN");
        }
        assert_eq!(caddy_bin_from_env_or_default(&cfg), "caddy");
    }

    #[test]
    fn ensure_caddy_available_errors_when_missing() {
        let err = ensure_caddy_available("/definitely-not-a-real-caddy-binary").unwrap_err();
        let msg = format!("{err:?}");
        assert!(msg.contains("Required dependency 'caddy' not found"));
    }

    #[test]
    fn ensure_site_files_creates_index_and_manifest_once() {
        let td = tempdir().unwrap();
        let spool_path = td.path();

        ensure_site_files(spool_path).unwrap();

        let index = site_dir(spool_path).join("index.html");
        let manifest = site_dir(spool_path).join("manifest.json");
        assert!(index.exists());
        assert!(manifest.exists());

        // Idempotent
        ensure_site_files(spool_path).unwrap();
        assert!(index.exists());
        assert!(manifest.exists());
    }

    #[test]
    fn write_caddyfile_includes_token_gate_and_serves_existing_dirs() {
        let td = tempdir().unwrap();
        let project_root = td.path().join("project");
        let spool_path = project_root.join(".spool");
        crate::io::create_dir_all(&project_root).unwrap();
        crate::io::create_dir_all(&spool_path).unwrap();

        crate::io::create_dir_all(&crate::paths::changes_dir(&spool_path)).unwrap();
        crate::io::create_dir_all(&crate::paths::specs_dir(&spool_path)).unwrap();
        crate::io::create_dir_all(&crate::paths::modules_dir(&spool_path)).unwrap();
        crate::io::create_dir_all(&spool_path.join("planning")).unwrap();
        crate::io::create_dir_all(&spool_path.join("research")).unwrap();
        crate::io::create_dir_all(&project_root.join("docs")).unwrap();
        crate::io::create_dir_all(&project_root.join("documents")).unwrap();

        // Build generated site tree so write_caddyfile includes handlers.
        super::site::build_site(&project_root, &spool_path).unwrap();

        write_caddyfile(&project_root, &spool_path, "127.0.0.1", 9009, Some("tok")).unwrap();

        let caddyfile = crate::io::read_to_string(&caddyfile_path(&spool_path)).unwrap();
        assert!(caddyfile.contains("@token_ok"));
        assert!(caddyfile.contains("uri strip_prefix /t/tok"));
        assert!(caddyfile.contains("respond \"Forbidden\" 403"));
        assert!(caddyfile.contains("handle_path /spool/changes/*"));
        assert!(caddyfile.contains("handle_path /spool/specs/*"));
        assert!(caddyfile.contains("handle_path /spool/modules/*"));
        assert!(caddyfile.contains("handle_path /spool/planning/*"));
        assert!(caddyfile.contains("handle_path /spool/research/*"));
        assert!(caddyfile.contains("handle_path /docs/*"));
        assert!(caddyfile.contains("handle_path /documents/*"));
    }

    #[test]
    fn write_caddyfile_without_token_does_not_forbid() {
        let td = tempdir().unwrap();
        let project_root = td.path().join("project");
        let spool_path = project_root.join(".spool");
        crate::io::create_dir_all(&project_root).unwrap();
        crate::io::create_dir_all(&spool_path).unwrap();

        super::site::build_site(&project_root, &spool_path).unwrap();

        write_caddyfile(&project_root, &spool_path, "127.0.0.1", 9009, None).unwrap();

        let caddyfile = crate::io::read_to_string(&caddyfile_path(&spool_path)).unwrap();
        assert!(caddyfile.contains("import spool_site"));
        assert!(!caddyfile.contains("Forbidden\" 403"));
    }

    #[test]
    fn serve_config_from_json_reads_serve_keys() {
        let v = serde_json::json!({
            "serve": {
                "bind": "0.0.0.0",
                "port": 9012,
                "token": "abc",
                "caddyBin": "/custom/caddy"
            }
        });

        let cfg = serve_config_from_json(&v);
        assert_eq!(cfg.bind, "0.0.0.0");
        assert_eq!(cfg.port, 9012);
        assert_eq!(cfg.token.as_deref(), Some("abc"));
        assert_eq!(cfg.caddy_bin.as_deref(), Some("/custom/caddy"));
    }

    #[test]
    #[cfg(unix)]
    fn is_pid_running_is_true_for_current_process() {
        let pid = std::process::id();
        assert!(is_pid_running(pid));
    }

    #[test]
    #[cfg(unix)]
    fn status_reads_state_and_builds_url() {
        let td = tempdir().unwrap();
        let spool_path = td.path();

        crate::io::create_dir_all(&state_dir(spool_path)).unwrap();
        let state = DocsServerState {
            pid: std::process::id(),
            bind: "127.0.0.1".to_string(),
            port: 9009,
            token: Some("tok".to_string()),
            started_at: "2026-01-01T00:00:00Z".to_string(),
        };
        let mut bytes = serde_json::to_vec(&state).unwrap();
        bytes.push(b'\n');
        crate::io::write(&state_dir(spool_path).join("state.json"), bytes).unwrap();

        let res = status(spool_path).unwrap().unwrap();
        assert!(res.reused);
        assert_eq!(res.url, "http://127.0.0.1:9009/t/tok/");
        assert_eq!(res.token.as_deref(), Some("tok"));
    }
}
