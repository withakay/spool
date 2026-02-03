//! File system API endpoints.

use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use serde::{Deserialize, Serialize};
use std::path::{Path as StdPath, PathBuf};
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    root: PathBuf,
}

/// File or directory entry.
#[derive(Debug, Serialize)]
pub struct Entry {
    name: String,
    path: String,
    is_dir: bool,
    size: Option<u64>,
}

/// Directory listing response.
#[derive(Debug, Serialize)]
pub struct ListResponse {
    path: String,
    entries: Vec<Entry>,
}

/// File content response.
#[derive(Debug, Serialize)]
pub struct FileResponse {
    path: String,
    content: String,
    language: String,
}

/// File save request.
#[derive(Debug, Deserialize)]
pub struct SaveRequest {
    content: String,
}

/// Create the API router.
pub fn router(root: PathBuf) -> Router {
    let state = Arc::new(AppState { root });

    Router::new()
        .route("/list/{*path}", get(list_dir))
        .route("/list", get(list_root))
        .route("/file/{*path}", get(read_file).post(save_file))
        .with_state(state)
}

/// List root directory.
async fn list_root(
    State(state): State<Arc<AppState>>,
) -> Result<Json<ListResponse>, (StatusCode, String)> {
    list_directory(&state.root, "").await
}

/// List a directory.
async fn list_dir(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
) -> Result<Json<ListResponse>, (StatusCode, String)> {
    let full_path = safe_path(&state.root, &path)?;
    list_directory(&full_path, &path).await
}

async fn list_directory(
    dir: &StdPath,
    rel_path: &str,
) -> Result<Json<ListResponse>, (StatusCode, String)> {
    let mut entries = Vec::new();

    let mut read_dir = tokio::fs::read_dir(dir)
        .await
        .map_err(|e| (StatusCode::NOT_FOUND, format!("Cannot read directory: {e}")))?;

    while let Some(entry) = read_dir
        .next_entry()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    {
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files and common unwanted directories
        if name.starts_with('.') && name != ".spool" {
            continue;
        }
        if matches!(
            name.as_str(),
            "node_modules" | "target" | "__pycache__" | ".git"
        ) {
            continue;
        }

        let metadata = entry.metadata().await.ok();
        let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let size = if is_dir {
            None
        } else {
            metadata.as_ref().map(|m| m.len())
        };

        let entry_path = if rel_path.is_empty() {
            name.clone()
        } else {
            format!("{}/{}", rel_path, name)
        };

        entries.push(Entry {
            name,
            path: entry_path,
            is_dir,
            size,
        });
    }

    // Sort: directories first, then by name
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(Json(ListResponse {
        path: rel_path.to_string(),
        entries,
    }))
}

/// Read a file.
async fn read_file(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
) -> Result<Json<FileResponse>, (StatusCode, String)> {
    let full_path = safe_path(&state.root, &path)?;

    let content = tokio::fs::read_to_string(&full_path)
        .await
        .map_err(|e| (StatusCode::NOT_FOUND, format!("Cannot read file: {e}")))?;

    let language = detect_language(&path);

    Ok(Json(FileResponse {
        path,
        content,
        language,
    }))
}

/// Save a file.
async fn save_file(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
    Json(body): Json<SaveRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let full_path = safe_path(&state.root, &path)?;

    tokio::fs::write(&full_path, &body.content)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Cannot save file: {e}"),
            )
        })?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

/// Safely resolve a path within the root directory.
fn safe_path(root: &StdPath, path: &str) -> Result<PathBuf, (StatusCode, String)> {
    let path = path.trim_start_matches('/');
    let full = root.join(path);

    // Ensure the path doesn't escape the root via ..
    let canonical = full
        .canonicalize()
        .map_err(|_| (StatusCode::NOT_FOUND, "Path not found".to_string()))?;

    let root_canonical = root.canonicalize().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Root not found".to_string(),
        )
    })?;

    if !canonical.starts_with(&root_canonical) {
        return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
    }

    Ok(canonical)
}

/// Detect language from file extension for CodeMirror.
fn detect_language(path: &str) -> String {
    let ext = path.rsplit('.').next().unwrap_or("");
    match ext {
        "rs" => "rust",
        "js" | "mjs" | "cjs" => "javascript",
        "ts" | "mts" | "cts" => "typescript",
        "jsx" => "jsx",
        "tsx" => "tsx",
        "py" => "python",
        "rb" => "ruby",
        "go" => "go",
        "java" => "java",
        "c" | "h" => "c",
        "cpp" | "hpp" | "cc" | "cxx" => "cpp",
        "cs" => "csharp",
        "md" | "markdown" => "markdown",
        "json" => "json",
        "yaml" | "yml" => "yaml",
        "toml" => "toml",
        "html" | "htm" => "html",
        "css" => "css",
        "scss" | "sass" => "scss",
        "sql" => "sql",
        "sh" | "bash" | "zsh" => "shell",
        "xml" => "xml",
        "lua" => "lua",
        "swift" => "swift",
        "kt" | "kts" => "kotlin",
        "dockerfile" => "dockerfile",
        _ => "text",
    }
    .to_string()
}
