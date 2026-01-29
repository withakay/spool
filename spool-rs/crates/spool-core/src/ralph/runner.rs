use crate::ralph::prompt::{BuildPromptOptions, build_ralph_prompt};
use crate::ralph::state::{
    RalphHistoryEntry, RalphState, append_context, clear_context, load_context, load_state,
    save_state,
};
use miette::{Result, miette};
use spool_harness::{Harness, HarnessName};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone)]
pub struct RalphOptions {
    pub prompt: String,
    pub change_id: Option<String>,
    pub module_id: Option<String>,
    pub model: Option<String>,
    pub min_iterations: u32,
    pub max_iterations: Option<u32>,
    pub completion_promise: String,
    pub allow_all: bool,
    pub no_commit: bool,
    pub interactive: bool,
    pub status: bool,
    pub add_context: Option<String>,
    pub clear_context: bool,
}

pub fn run_ralph(spool_path: &Path, opts: RalphOptions, harness: &mut dyn Harness) -> Result<()> {
    let (change_id, module_id) =
        resolve_target(spool_path, opts.change_id, opts.module_id, opts.interactive)?;

    if opts.status {
        let state = load_state(spool_path, &change_id)?;
        if let Some(state) = state {
            println!("\n=== Ralph Status for {id} ===\n", id = state.change_id);
            println!("Iteration: {iter}", iter = state.iteration);
            println!("History entries: {n}", n = state.history.len());
            if !state.history.is_empty() {
                println!("\nRecent iterations:");
                let n = state.history.len();
                let start = n.saturating_sub(5);
                for (i, h) in state.history.iter().enumerate().skip(start) {
                    println!(
                        "  {idx}: duration={dur}ms, changes={chg}, promise={p}",
                        idx = i + 1,
                        dur = h.duration,
                        chg = h.file_changes_count,
                        p = h.completion_promise_found
                    );
                }
            }
        } else {
            println!("\n=== Ralph Status for {id} ===\n", id = change_id);
            println!("No state found");
        }
        return Ok(());
    }

    if let Some(text) = opts.add_context.as_deref() {
        append_context(spool_path, &change_id, text)?;
        println!("Added context to {id}", id = change_id);
        return Ok(());
    }
    if opts.clear_context {
        clear_context(spool_path, &change_id)?;
        println!("Cleared Ralph context for {id}", id = change_id);
        return Ok(());
    }

    let spool_dir_name = spool_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| ".spool".to_string());
    let context_file = format!(
        "{spool_dir}/.state/ralph/{change}/context.md",
        spool_dir = spool_dir_name,
        change = change_id
    );

    let mut state = load_state(spool_path, &change_id)?.unwrap_or(RalphState {
        change_id: change_id.clone(),
        iteration: 0,
        history: vec![],
        context_file,
    });

    let max_iters = opts.max_iterations.unwrap_or(u32::MAX);
    if max_iters == 0 {
        return Err(miette!("--max-iterations must be >= 1"));
    }

    for _ in 0..max_iters {
        let iteration = state.iteration.saturating_add(1);

        println!("\n=== Ralph Loop Iteration {i} ===\n", i = iteration);

        let context_content = load_context(spool_path, &change_id)?;
        let prompt = build_ralph_prompt(
            spool_path,
            &opts.prompt,
            BuildPromptOptions {
                change_id: Some(change_id.clone()),
                module_id: Some(module_id.clone()),
                iteration: Some(iteration),
                max_iterations: opts.max_iterations,
                min_iterations: opts.min_iterations,
                completion_promise: opts.completion_promise.clone(),
                context_content: Some(context_content),
            },
        )?;

        let started = std::time::Instant::now();
        let run = harness.run(&spool_harness::HarnessRunConfig {
            prompt,
            model: opts.model.clone(),
            cwd: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            env: std::collections::BTreeMap::new(),
            interactive: opts.interactive && !opts.allow_all,
        })?;

        // Mirror TS harness: pass through output.
        if !run.stdout.is_empty() {
            print!("{}", run.stdout);
        }
        if !run.stderr.is_empty() {
            eprint!("{}", run.stderr);
        }

        // Mirror TS: completion promise is detected from stdout (not stderr).
        let needle = format!("<promise>{}</promise>", opts.completion_promise);
        let completion_found = run.stdout.contains(&needle);

        let file_changes_count = if harness.name() == HarnessName::OPENCODE {
            count_git_changes()? as u32
        } else {
            0
        };

        if run.exit_code != 0 {
            return Err(miette!(
                "Harness '{name}' exited with code {code}",
                name = harness.name().0,
                code = run.exit_code
            ));
        }

        if !opts.no_commit {
            commit_iteration(iteration)?;
        }

        let timestamp = now_ms()?;
        let duration = started.elapsed().as_millis() as i64;
        state.history.push(RalphHistoryEntry {
            timestamp,
            duration,
            completion_promise_found: completion_found,
            file_changes_count,
        });
        state.iteration = iteration;
        save_state(spool_path, &change_id, &state)?;

        if completion_found && iteration >= opts.min_iterations {
            println!(
                "\n=== Completion promise \"{p}\" detected. Loop complete. ===\n",
                p = opts.completion_promise
            );
            return Ok(());
        }
    }

    Ok(())
}

fn resolve_target(
    spool_path: &Path,
    change_id: Option<String>,
    module_id: Option<String>,
    interactive: bool,
) -> Result<(String, String)> {
    // If change is provided, infer module.
    if let Some(change) = change_id {
        let module = infer_module_from_change(&change)?;
        return Ok((change, module));
    }

    if let Some(module) = module_id {
        let changes = changes_for_module(spool_path, &module)?;
        if changes.is_empty() {
            return Err(miette!(
                "No changes found for module {module}",
                module = module
            ));
        }
        if changes.len() == 1 {
            return Ok((changes[0].clone(), module));
        }
        if !interactive {
            return Err(miette!(
                "Multiple changes found for module {module}. Use --change to specify or run in interactive mode.",
                module = module
            ));
        }
        return Err(miette!(
            "Interactive selection is not yet implemented in Rust. Use --change to specify."
        ));
    }

    if !interactive {
        return Err(miette!(
            "Change selection requires interactive mode. Use --change to specify or run in interactive mode."
        ));
    }

    Err(miette!(
        "Interactive selection is not yet implemented in Rust. Use --change to specify."
    ))
}

fn infer_module_from_change(change_id: &str) -> Result<String> {
    let Some((module, _rest)) = change_id.split_once('-') else {
        return Err(miette!("Invalid change ID format: {id}", id = change_id));
    };
    Ok(module.to_string())
}

fn changes_for_module(spool_path: &Path, module_id: &str) -> Result<Vec<String>> {
    let changes_dir = crate::paths::changes_dir(spool_path);
    if !changes_dir.exists() {
        return Ok(vec![]);
    }
    let prefix = format!("{module}-", module = module_id);
    let mut out = Vec::new();
    let entries = std::fs::read_dir(&changes_dir)
        .map_err(|e| miette!("I/O error reading {p}: {e}", p = changes_dir.display()))?;
    for entry in entries {
        let entry =
            entry.map_err(|e| miette!("I/O error reading {p}: {e}", p = changes_dir.display()))?;
        let ft = entry
            .file_type()
            .map_err(|e| miette!("I/O error reading {p}: {e}", p = changes_dir.display()))?;
        if !ft.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with(&prefix) {
            out.push(name);
        }
    }
    out.sort();
    Ok(out)
}

fn now_ms() -> Result<i64> {
    let dur = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| miette!("Clock error: {e}"))?;
    Ok(dur.as_millis() as i64)
}

fn count_git_changes() -> Result<usize> {
    let out = Command::new("git")
        .args(["status", "--porcelain"])
        .output()
        .map_err(|e| miette!("Failed to run git status: {e}"))?;
    if !out.status.success() {
        // Match TS behavior: the git error output is visible to the user.
        let err = String::from_utf8_lossy(&out.stderr);
        if !err.is_empty() {
            eprint!("{}", err);
        }
        return Ok(0);
    }
    let s = String::from_utf8_lossy(&out.stdout);
    Ok(s.lines().filter(|l| !l.trim().is_empty()).count())
}

fn commit_iteration(iteration: u32) -> Result<()> {
    let status = Command::new("git")
        .args(["add", "-A"])
        .status()
        .map_err(|e| miette!("Failed to run git add: {e}"))?;
    if !status.success() {
        return Err(miette!("git add failed"));
    }

    let msg = format!("Ralph loop iteration {iteration}");
    let status = Command::new("git")
        .args(["commit", "-m", &msg])
        .status()
        .map_err(|e| miette!("Failed to run git commit: {e}"))?;
    // TS ignores commit failures due to no changes; mimic by allowing non-zero.
    let _ = status;
    Ok(())
}
