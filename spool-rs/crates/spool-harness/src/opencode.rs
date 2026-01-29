use crate::types::{Harness, HarnessName, HarnessRunConfig, HarnessRunResult};
use miette::{miette, Result};
use std::process::Command;
use std::time::Duration;

#[derive(Debug, Default)]
pub struct OpencodeHarness;

impl Harness for OpencodeHarness {
    fn name(&self) -> HarnessName {
        HarnessName::OPENCODE
    }

    fn run(&mut self, config: &HarnessRunConfig) -> Result<HarnessRunResult> {
        let mut cmd = Command::new("opencode");
        cmd.arg("run");

        if let Some(model) = config.model.as_deref() {
            cmd.args(["-m", model]);
        }

        cmd.arg(&config.prompt);
        cmd.current_dir(&config.cwd);
        cmd.envs(&config.env);

        // Note: TS uses a temporary OPENCODE_CONFIG for non-interactive runs.
        // Rust harness keeps behavior minimal; tests can stub `opencode` on PATH.
        let out = cmd
            .output()
            .map_err(|e| miette!("Failed to spawn opencode: {e}"))?;

        Ok(HarnessRunResult {
            stdout: String::from_utf8_lossy(&out.stdout).to_string(),
            stderr: String::from_utf8_lossy(&out.stderr).to_string(),
            exit_code: out.status.code().unwrap_or(1),
            duration: Duration::from_millis(1),
        })
    }

    fn stop(&mut self) {
        // No-op: `run` is synchronous.
    }
}
