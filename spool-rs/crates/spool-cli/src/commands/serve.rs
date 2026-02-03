use crate::cli::ServeArgs;
use crate::cli_error::{CliResult, fail};
use crate::runtime::Runtime;
use std::path::Path;
use std::process::Command;

/// Detect the Tailscale IPv4 address by running `tailscale ip -4`.
fn detect_tailscale_ip() -> CliResult<String> {
    let output = Command::new("tailscale")
        .args(["ip", "-4"])
        .output()
        .map_err(|e| {
            crate::cli_error::CliError::msg(format!(
                "Failed to run 'tailscale ip -4': {e}. Is Tailscale installed and on PATH?"
            ))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return fail(format!("Tailscale command failed: {}", stderr.trim()));
    }

    let ip = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if ip.is_empty() {
        return fail("Tailscale returned empty IP. Is Tailscale connected?");
    }

    Ok(ip)
}

fn ensure_spool_dir_exists(spool_path: &Path) -> CliResult<()> {
    if spool_path.exists() {
        return Ok(());
    }
    fail("No .spool directory found in this project. Run `spool init` first.")
}

pub(crate) fn handle_serve_clap(rt: &Runtime, args: &ServeArgs) -> CliResult<()> {
    let spool_path = rt.spool_path();
    ensure_spool_dir_exists(spool_path)?;

    // Project root is parent of .spool
    let project_root = spool_path
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| std::path::PathBuf::from("."));

    // Determine bind address
    let bind_addr = if args.tailscale {
        detect_tailscale_ip()?
    } else {
        args.bind.clone().unwrap_or_else(|| "127.0.0.1".to_string())
    };

    let port = args.port.unwrap_or(9009);

    let config = spool_web::ServeConfig {
        root: project_root,
        bind: bind_addr,
        port,
    };

    // Run the async server
    let runtime = tokio::runtime::Runtime::new().map_err(|e| {
        crate::cli_error::CliError::msg(format!("Failed to create tokio runtime: {e}"))
    })?;

    runtime.block_on(async {
        spool_web::serve(config)
            .await
            .map_err(|e| crate::cli_error::CliError::msg(format!("Server error: {e}")))
    })?;

    Ok(())
}
