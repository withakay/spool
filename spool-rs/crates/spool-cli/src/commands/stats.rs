use crate::cli::StatsArgs;
use crate::cli_error::CliResult;
use crate::runtime::Runtime;
use std::collections::BTreeMap;
use std::io::BufRead;
use std::path::{Path, PathBuf};

pub(crate) fn handle_stats_clap(rt: &Runtime, _args: &StatsArgs) -> CliResult<()> {
    let Some(config_dir) = spool_core::config::spool_config_dir(rt.ctx()) else {
        println!("No Spool config directory found.");
        return Ok(());
    };

    let root = config_dir
        .join("logs")
        .join("execution")
        .join("v1")
        .join("projects");

    let mut counts: BTreeMap<String, u64> = BTreeMap::new();
    for id in known_command_ids() {
        counts.insert(id.to_string(), 0);
    }

    let mut files: Vec<PathBuf> = Vec::new();
    collect_jsonl_files(&root, &mut files);

    for path in files {
        let Ok(f) = std::fs::File::open(&path) else {
            continue;
        };
        let reader = std::io::BufReader::new(f);
        for line in reader.lines() {
            let Ok(line) = line else {
                continue;
            };
            let line = line.trim();
            if line.is_empty() {
                continue;
            }

            #[derive(serde::Deserialize)]
            struct Event {
                event_type: Option<String>,
                command_id: Option<String>,
            }

            let Ok(ev) = serde_json::from_str::<Event>(line) else {
                continue;
            };
            let Some(event_type) = ev.event_type else {
                continue;
            };
            if event_type != "command_end" {
                continue;
            }
            let Some(command_id) = ev.command_id else {
                continue;
            };

            let entry = counts.entry(command_id).or_insert(0);
            *entry = entry.saturating_add(1);
        }
    }

    println!("Spool Stats");
    println!("────────────────────────────────────────");
    println!("command_id: count");
    for (id, count) in counts {
        println!("{id}: {count}");
    }

    Ok(())
}

fn collect_jsonl_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for e in entries {
        let Ok(e) = e else {
            continue;
        };
        let path = e.path();
        if path.is_dir() {
            collect_jsonl_files(&path, out);
            continue;
        }
        let Some(ext) = path.extension().and_then(|s| s.to_str()) else {
            continue;
        };
        if ext == "jsonl" {
            out.push(path);
        }
    }
}

fn known_command_ids() -> Vec<&'static str> {
    vec![
        "spool.init",
        "spool.update",
        "spool.list",
        "spool.config.path",
        "spool.config.list",
        "spool.config.get",
        "spool.config.set",
        "spool.config.unset",
        "spool.agent_config.init",
        "spool.agent_config.summary",
        "spool.agent_config.get",
        "spool.agent_config.set",
        "spool.create.module",
        "spool.create.change",
        "spool.new.change",
        "spool.plan.init",
        "spool.plan.status",
        "spool.state.show",
        "spool.state.decision",
        "spool.state.blocker",
        "spool.state.note",
        "spool.state.focus",
        "spool.state.question",
        "spool.tasks.init",
        "spool.tasks.status",
        "spool.tasks.next",
        "spool.tasks.start",
        "spool.tasks.complete",
        "spool.tasks.shelve",
        "spool.tasks.unshelve",
        "spool.tasks.add",
        "spool.tasks.show",
        "spool.workflow.init",
        "spool.workflow.list",
        "spool.workflow.show",
        "spool.status",
        "spool.stats",
        "spool.templates",
        "spool.instructions",
        "spool.x_instructions",
        "spool.agent.instruction",
        "spool.show",
        "spool.validate",
        "spool.ralph",
        "spool.loop",
    ]
}
