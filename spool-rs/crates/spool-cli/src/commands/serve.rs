use crate::cli::{ServeAction, ServeArgs};
use crate::cli_error::{CliResult, fail, to_cli_error};
use crate::runtime::Runtime;
use spool_core::config::{ConfigContext, load_cascading_project_config};
use spool_core::docs_server::{
    ServeConfig, start as start_server, status as status_server, stop as stop_server,
};
use std::path::{Path, PathBuf};

fn project_root_from_spool_path(spool_path: &Path) -> PathBuf {
    spool_path
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."))
}

fn ensure_spool_dir_exists(spool_path: &Path) -> CliResult<()> {
    if spool_path.exists() {
        return Ok(());
    }
    fail("No .spool directory found in this project. Run `spool init` first.")
}

fn serve_config_from_project_config(
    ctx: &ConfigContext,
    project_root: &Path,
    spool_path: &Path,
) -> ServeConfig {
    let cfg = load_cascading_project_config(project_root, spool_path, ctx);
    spool_core::docs_server::serve_config_from_json(&cfg.merged)
}

pub(crate) fn handle_serve_clap(rt: &Runtime, args: &ServeArgs) -> CliResult<()> {
    let spool_path = rt.spool_path();
    ensure_spool_dir_exists(spool_path)?;
    let project_root = project_root_from_spool_path(spool_path);

    let action = args.action.clone().unwrap_or(ServeAction::Status);
    match action {
        ServeAction::Start => {
            let cfg = serve_config_from_project_config(rt.ctx(), &project_root, spool_path);
            let res = start_server(&project_root, spool_path, cfg).map_err(to_cli_error)?;
            if res.reused {
                println!("Docs server already running at {}", res.url);
            } else {
                println!("Docs server started at {}", res.url);
            }
            Ok(())
        }
        ServeAction::Stop => {
            let stopped = stop_server(spool_path).map_err(to_cli_error)?;
            if stopped {
                println!("Docs server stopped");
            } else {
                println!("Docs server is not running");
            }
            Ok(())
        }
        ServeAction::Status => {
            let st = status_server(spool_path).map_err(to_cli_error)?;
            let Some(st) = st else {
                println!("Docs server is not running");
                return Ok(());
            };
            println!("Docs server running at {}", st.url);
            Ok(())
        }
    }
}
