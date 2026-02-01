use crate::cli_error::{CliResult, fail, to_cli_error};
use crate::runtime::Runtime;
use chrono::{DateTime, Utc};
use spool_core::paths as core_paths;

#[derive(Debug, serde::Serialize)]
struct ModulesResponse {
    modules: Vec<spool_core::list::ModuleListItem>,
}

#[derive(Debug, serde::Serialize)]
struct ChangesResponse {
    changes: Vec<spool_core::list::ChangeListItem>,
}

#[derive(Debug, serde::Serialize)]
struct SpecsResponse {
    specs: Vec<spool_core::list::SpecListItem>,
}

pub(crate) fn handle_list(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{}", super::LIST_HELP);
        return Ok(());
    }

    let want_specs = args.iter().any(|a| a == "--specs");
    let want_modules = args.iter().any(|a| a == "--modules");
    let want_json = args.iter().any(|a| a == "--json");

    let sort = parse_sort_order(args).unwrap_or("recent");
    let mode = if want_specs {
        "specs"
    } else if want_modules {
        "modules"
    } else {
        // default is changes, and `--changes` is a no-op.
        "changes"
    };

    let spool_path = rt.spool_path();

    match mode {
        "modules" => {
            let modules = spool_core::list::list_modules(spool_path).unwrap_or_default();
            if want_json {
                let payload = ModulesResponse { modules };
                let rendered =
                    serde_json::to_string_pretty(&payload).expect("json should serialize");
                println!("{rendered}");
                return Ok(());
            }

            if modules.is_empty() {
                println!("No modules found.");
                println!("Create one with: spool create module <name>");
                return Ok(());
            }

            println!("Modules:\n");
            for m in modules {
                if m.change_count == 0 {
                    println!("  {}", m.full_name);
                    continue;
                }
                let suffix = if m.change_count == 1 {
                    "change"
                } else {
                    "changes"
                };
                println!("  {} ({} {suffix})", m.full_name, m.change_count);
            }
            println!();
        }
        "specs" => {
            let specs = spool_core::list::list_specs(spool_path).unwrap_or_default();
            if specs.is_empty() {
                // TS prints a plain sentence even for `--json`.
                println!("No specs found.");
                return Ok(());
            }

            if want_json {
                let payload = SpecsResponse { specs };
                let rendered =
                    serde_json::to_string_pretty(&payload).expect("json should serialize");
                println!("{rendered}");
                return Ok(());
            }

            println!("Specs:");
            let padding = "  ";
            let name_width = specs.iter().map(|s| s.id.len()).max().unwrap_or(0);
            for s in specs {
                let padded = format!("{id: <width$}", id = s.id, width = name_width);
                println!("{padding}{padded}     requirements {}", s.requirement_count);
            }
        }
        _ => {
            // changes
            let changes_dir = core_paths::changes_dir(spool_path);
            if !changes_dir.exists() {
                return fail("No Spool changes directory found. Run 'spool init' first.");
            }

            let mut items: Vec<(String, u32, u32, DateTime<Utc>)> = Vec::new();
            for name in &rt.repo_index().change_dir_names {
                let change_path = core_paths::change_dir(spool_path, name);
                let tasks_path = change_path.join("tasks.md");
                let (total, completed) = spool_core::io::read_to_string_optional(&tasks_path)
                    .map_err(to_cli_error)?
                    .map(|c| spool_core::list::count_tasks_markdown(&c))
                    .unwrap_or((0, 0));
                let lm = spool_core::list::last_modified_recursive(&change_path)
                    .unwrap_or_else(|_| Utc::now());
                items.push((name.clone(), completed, total, lm));
            }

            if items.is_empty() {
                if want_json {
                    let rendered =
                        serde_json::to_string_pretty(&serde_json::json!({ "changes": [] }))
                            .expect("json should serialize");
                    println!("{rendered}");
                } else {
                    println!("No active changes found.");
                }
                return Ok(());
            }

            if sort == "name" {
                items.sort_by(|a, b| a.0.cmp(&b.0));
            } else {
                items.sort_by(|a, b| b.3.cmp(&a.3));
            }

            if want_json {
                let changes: Vec<spool_core::list::ChangeListItem> = items
                    .into_iter()
                    .map(|(name, completed, total, lm)| {
                        let status = if total == 0 {
                            "no-tasks"
                        } else if completed == total {
                            "complete"
                        } else {
                            "in-progress"
                        };
                        spool_core::list::ChangeListItem {
                            name,
                            completed_tasks: completed,
                            total_tasks: total,
                            last_modified: spool_core::list::to_iso_millis(lm),
                            status: status.to_string(),
                        }
                    })
                    .collect();
                let payload = ChangesResponse { changes };
                let rendered =
                    serde_json::to_string_pretty(&payload).expect("json should serialize");
                println!("{rendered}");
                return Ok(());
            }

            println!("Changes:");
            let name_width = items.iter().map(|i| i.0.len()).max().unwrap_or(0);
            for (name, completed, total, lm) in items {
                let status = format_task_status(total, completed);
                let time_ago = format_relative_time(lm);
                let padded = format!("{name: <width$}", width = name_width);
                println!("  {padded}     {: <12}  {time_ago}", status);
            }
        }
    }

    Ok(())
}

fn parse_sort_order(args: &[String]) -> Option<&str> {
    let mut iter = args.iter();
    while let Some(a) = iter.next() {
        if a == "--sort" {
            return iter.next().map(|s| s.as_str());
        }
        if let Some(v) = a.strip_prefix("--sort=") {
            return Some(v);
        }
    }
    None
}

fn format_task_status(total: u32, completed: u32) -> String {
    if total == 0 {
        return "No tasks".to_string();
    }
    if total == completed {
        return "\u{2713} Complete".to_string();
    }
    format!("{completed}/{total} tasks")
}

fn format_relative_time(then: DateTime<Utc>) -> String {
    let now = Utc::now();
    let diff = now.signed_duration_since(then);
    let secs = diff.num_seconds();
    if secs <= 0 {
        return "just now".to_string();
    }
    let mins = diff.num_minutes();
    let hours = diff.num_hours();
    let days = diff.num_days();

    if days > 30 {
        // Node's `toLocaleDateString()` is locale-dependent; in our parity harness
        // environment it renders as M/D/YYYY.
        return then.format("%-m/%-d/%Y").to_string();
    }

    if days > 0 {
        format!("{days}d ago")
    } else if hours > 0 {
        format!("{hours}h ago")
    } else if mins > 0 {
        format!("{mins}m ago")
    } else {
        "just now".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::{format_relative_time, format_task_status, parse_sort_order};
    use chrono::{Duration, Utc};

    #[test]
    fn parse_sort_order_supports_separate_and_equals_forms() {
        let args = vec!["--sort".to_string(), "name".to_string()];
        assert_eq!(parse_sort_order(&args), Some("name"));

        let args = vec!["--sort=recent".to_string()];
        assert_eq!(parse_sort_order(&args), Some("recent"));
    }

    #[test]
    fn format_task_status_handles_no_tasks_complete_and_in_progress() {
        assert_eq!(format_task_status(0, 0), "No tasks");
        assert_eq!(format_task_status(3, 3), "\u{2713} Complete");
        assert_eq!(format_task_status(3, 1), "1/3 tasks");
    }

    #[test]
    fn format_relative_time_covers_major_buckets() {
        assert_eq!(
            format_relative_time(Utc::now() + Duration::seconds(1)),
            "just now"
        );

        let then = Utc::now() - Duration::minutes(2);
        assert_eq!(format_relative_time(then), "2m ago");

        let then = Utc::now() - Duration::hours(2);
        assert_eq!(format_relative_time(then), "2h ago");

        let then = Utc::now() - Duration::days(2);
        assert_eq!(format_relative_time(then), "2d ago");

        let then = Utc::now() - Duration::days(40);
        assert_eq!(
            format_relative_time(then),
            then.format("%-m/%-d/%Y").to_string()
        );
    }
}
