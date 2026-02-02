use crate::cli::{ValidateArgs, ValidateCommand, ValidateItemType};
use crate::cli_error::{CliResult, fail, silent_fail, to_cli_error};
use crate::runtime::Runtime;
use crate::util::parse_string_flag;
use spool_core::paths as core_paths;
use spool_core::{r#match::nearest_matches, validate as core_validate};
use spool_domain::changes::ChangeRepository;
use std::path::Path;

pub(crate) fn handle_validate(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!(
            "{}",
            super::common::render_command_long_help(&["validate"], "spool validate")
        );
        return Ok(());
    }

    if args.first().map(|s| s.as_str()) == Some("module") {
        return handle_validate_module(rt, &args[1..]);
    }

    let want_json = args.iter().any(|a| a == "--json");
    let strict = args.iter().any(|a| a == "--strict");
    let typ = parse_string_flag(args, "--type");
    let bulk = args
        .iter()
        .any(|a| matches!(a.as_str(), "--all" | "--changes" | "--specs" | "--modules"));

    let item = super::common::last_positional(args);
    if item.is_none() && !bulk {
        return fail(
            "Nothing to validate. Try one of:\n  spool validate --all\n  spool validate --changes\n  spool validate --specs\n  spool validate <item-name>\nOr run in an interactive terminal.",
        );
    }

    let spool_path = rt.spool_path();

    if bulk {
        let repo_index = rt.repo_index();

        let want_all = args.iter().any(|a| a == "--all");
        let want_changes = want_all || args.iter().any(|a| a == "--changes");
        let want_specs = want_all || args.iter().any(|a| a == "--specs");
        let want_modules = want_all || args.iter().any(|a| a == "--modules");

        #[derive(serde::Serialize)]
        struct Item {
            id: String,
            #[serde(rename = "type")]
            typ: String,
            valid: bool,
            issues: Vec<core_validate::ValidationIssue>,
            #[serde(rename = "durationMs")]
            duration_ms: u32,
        }

        let mut items: Vec<Item> = Vec::new();

        if want_changes {
            let module_ids = repo_index.module_ids.clone();

            let change_dirs = repo_index.change_dir_names.clone();

            let mut parsed: std::collections::BTreeMap<String, spool_core::id::ParsedChangeId> =
                std::collections::BTreeMap::new();
            let mut numeric_to_dirs: std::collections::BTreeMap<String, Vec<String>> =
                std::collections::BTreeMap::new();

            for dir_name in &change_dirs {
                match spool_core::id::parse_change_id(dir_name) {
                    Ok(p) => {
                        let numeric = format!("{}-{}", p.module_id, p.change_num);
                        numeric_to_dirs
                            .entry(numeric)
                            .or_default()
                            .push(dir_name.clone());
                        parsed.insert(dir_name.clone(), p);
                    }
                    Err(_) => {
                        // handled per-item below
                    }
                }
            }

            let mut duplicate_by_dir: std::collections::BTreeMap<String, Vec<String>> =
                std::collections::BTreeMap::new();
            for (numeric, dirs) in &numeric_to_dirs {
                if dirs.len() <= 1 {
                    continue;
                }
                for d in dirs {
                    let others: Vec<String> = dirs.iter().filter(|x| *x != d).cloned().collect();
                    duplicate_by_dir
                        .entry(d.clone())
                        .or_default()
                        .extend(others);
                    // also attach numeric id context as a message later
                    let _ = numeric;
                }
            }

            for dir_name in change_dirs {
                let mut issues: Vec<core_validate::ValidationIssue> = Vec::new();

                // Directory naming / parsing
                let parsed_change = match spool_core::id::parse_change_id(&dir_name) {
                    Ok(p) => Some(p),
                    Err(e) => {
                        let msg = if let Some(hint) = e.hint.as_deref() {
                            format!(
                                "Invalid change directory name '{dir_name}': {} (hint: {hint})",
                                e.error
                            )
                        } else {
                            format!("Invalid change directory name '{dir_name}': {}", e.error)
                        };
                        issues.push(core_validate::error("id", msg));
                        None
                    }
                };

                // Module existence
                if let Some(p) = &parsed_change
                    && !module_ids.contains(p.module_id.as_str())
                {
                    issues.push(core_validate::error(
                        "module",
                        format!(
                            "Change '{}' refers to missing module '{}'",
                            dir_name, p.module_id
                        ),
                    ));
                }

                // Duplicate numeric change IDs
                if let Some(p) = parsed.get(&dir_name) {
                    let numeric = format!("{}-{}", p.module_id, p.change_num);
                    if let Some(others) = duplicate_by_dir.get(&dir_name) {
                        issues.push(core_validate::error(
                            "id",
                            format!(
                                "Duplicate numeric change id {numeric}: also found at {}",
                                others.join(", ")
                            ),
                        ));
                    }
                }

                // Existing delta validation (if we can)
                let report = if parsed_change.is_some() {
                    core_validate::validate_change(spool_path, &dir_name, strict).unwrap_or_else(
                        |e| {
                            core_validate::ValidationReport::new(
                                vec![core_validate::error(
                                    "validate",
                                    format!("Validation failed: {e}"),
                                )],
                                strict,
                            )
                        },
                    )
                } else {
                    core_validate::ValidationReport::new(vec![], strict)
                };

                let mut merged = report.issues.clone();
                merged.extend(issues);
                let merged_report = core_validate::ValidationReport::new(merged, strict);

                items.push(Item {
                    id: dir_name,
                    typ: "change".to_string(),
                    valid: merged_report.valid,
                    issues: merged_report.issues,
                    duration_ms: 1,
                });
            }
        }

        if want_specs {
            for spec_id in super::common::list_spec_ids_from_index(spool_path, repo_index) {
                let report = core_validate::validate_spec(spool_path, &spec_id, strict)
                    .unwrap_or_else(|e| {
                        core_validate::ValidationReport::new(
                            vec![core_validate::error(
                                "validate",
                                format!("Validation failed: {e}"),
                            )],
                            strict,
                        )
                    });
                items.push(Item {
                    id: spec_id,
                    typ: "spec".to_string(),
                    valid: report.valid,
                    issues: report.issues,
                    duration_ms: 1,
                });
            }
        }

        if want_modules {
            for m in repo_index.module_dir_names.clone() {
                let (_full_name, report) = core_validate::validate_module(spool_path, &m, strict)
                    .unwrap_or_else(|e| {
                        (
                            m.clone(),
                            core_validate::ValidationReport::new(
                                vec![core_validate::error(
                                    "validate",
                                    format!("Validation failed: {e}"),
                                )],
                                strict,
                            ),
                        )
                    });

                items.push(Item {
                    id: m,
                    typ: "module".to_string(),
                    valid: report.valid,
                    issues: report.issues,
                    duration_ms: 1,
                });
            }
        }

        let passed = items.iter().filter(|i| i.valid).count() as u32;
        let failed = items.len() as u32 - passed;

        if want_json {
            #[derive(serde::Serialize)]
            struct Totals {
                items: u32,
                passed: u32,
                failed: u32,
            }
            #[derive(serde::Serialize)]
            struct ByType {
                items: u32,
                passed: u32,
                failed: u32,
            }
            #[derive(serde::Serialize)]
            struct Summary {
                totals: Totals,
                #[serde(rename = "byType")]
                by_type: std::collections::BTreeMap<String, ByType>,
            }
            #[derive(serde::Serialize)]
            struct Envelope {
                items: Vec<Item>,
                summary: Summary,
                version: &'static str,
            }

            let mut by_type: std::collections::BTreeMap<String, ByType> =
                std::collections::BTreeMap::new();
            for it in &items {
                let entry = by_type.entry(it.typ.clone()).or_insert(ByType {
                    items: 0,
                    passed: 0,
                    failed: 0,
                });
                entry.items += 1;
                if it.valid {
                    entry.passed += 1;
                } else {
                    entry.failed += 1;
                }
            }

            let env = Envelope {
                items,
                summary: Summary {
                    totals: Totals {
                        items: passed + failed,
                        passed,
                        failed,
                    },
                    by_type,
                },
                version: "1.0",
            };
            let rendered = serde_json::to_string_pretty(&env).expect("json should serialize");
            println!("{rendered}");
            if failed > 0 {
                return silent_fail();
            }
            return Ok(());
        }

        if failed == 0 {
            println!("All items valid ({passed} checked)");
            return Ok(());
        }
        eprintln!(
            "Validation failed: {failed} of {} items invalid",
            passed + failed
        );
        for it in &items {
            if it.valid {
                continue;
            }
            eprintln!("- {} {} has issues", it.typ, it.id);
            for issue in &it.issues {
                eprintln!("  - [{}] {}: {}", issue.level, issue.path, issue.message);
            }
        }
        return silent_fail();
    }

    let item = item.expect("checked");

    let explicit = typ.as_deref();
    let resolved_type = match explicit {
        Some("change") | Some("spec") | Some("module") => explicit.unwrap().to_string(),
        Some(_) => {
            return fail("Invalid type. Expected 'change', 'spec', or 'module'.");
        }
        None => super::common::detect_item_type(rt, &item),
    };

    // Special-case: TS `--type module <id>` behaves like validating a spec by id.
    if resolved_type == "module" {
        let report = validate_spec_by_id_or_enoent(spool_path, &item, strict);
        let ok = render_validate_result("spec", &item, report, want_json);
        if !ok {
            return silent_fail();
        }
        return Ok(());
    }

    if resolved_type == "ambiguous" {
        return fail(format!(
            "Ambiguous item '{item}' matches both a change and a spec.\nUse --type change or --type spec to disambiguate."
        ));
    }

    match resolved_type.as_str() {
        "spec" => {
            let spec_path = core_paths::spec_markdown_path(spool_path, &item);
            if !spec_path.exists() {
                let candidates = super::common::list_spec_ids(rt);
                let suggestions = nearest_matches(&item, &candidates, 5);
                return fail(super::common::unknown_with_suggestions(
                    "spec",
                    &item,
                    &suggestions,
                ));
            }
            let report =
                core_validate::validate_spec(spool_path, &item, strict).map_err(to_cli_error)?;
            let ok = render_validate_result("spec", &item, report, want_json);
            if !ok {
                return silent_fail();
            }
            Ok(())
        }
        "change" => {
            let change_repo = ChangeRepository::new(spool_path);
            if !change_repo.exists(&item) {
                let candidates = super::common::list_change_ids(rt);
                let suggestions = nearest_matches(&item, &candidates, 5);
                return fail(super::common::unknown_with_suggestions(
                    "change",
                    &item,
                    &suggestions,
                ));
            }
            let report =
                core_validate::validate_change(spool_path, &item, strict).map_err(to_cli_error)?;
            let ok = render_validate_result("change", &item, report, want_json);
            if !ok {
                return silent_fail();
            }
            Ok(())
        }
        _ => {
            // unknown
            let candidates = super::common::list_candidate_items(rt);
            let suggestions = nearest_matches(&item, &candidates, 5);
            fail(super::common::unknown_with_suggestions(
                "item",
                &item,
                &suggestions,
            ))
        }
    }
}

pub(crate) fn handle_validate_clap(rt: &Runtime, args: &ValidateArgs) -> CliResult<()> {
    let mut argv: Vec<String> = Vec::new();

    if let Some(ValidateCommand::Module { module_id }) = &args.command {
        argv.push("module".to_string());
        if let Some(module_id) = module_id {
            argv.push(module_id.clone());
        }
        return handle_validate(rt, &argv);
    }

    if args.all {
        argv.push("--all".to_string());
    }
    if args.changes {
        argv.push("--changes".to_string());
    }
    if args.specs {
        argv.push("--specs".to_string());
    }
    if args.modules {
        argv.push("--modules".to_string());
    }
    if let Some(typ) = args.typ {
        let s = match typ {
            ValidateItemType::Change => "change",
            ValidateItemType::Spec => "spec",
            ValidateItemType::Module => "module",
        };
        argv.push("--type".to_string());
        argv.push(s.to_string());
    }
    if args.strict {
        argv.push("--strict".to_string());
    }
    if args.json {
        argv.push("--json".to_string());
    }
    if let Some(item) = &args.item {
        argv.push(item.clone());
    }

    handle_validate(rt, &argv)
}

fn handle_validate_module(rt: &Runtime, args: &[String]) -> CliResult<()> {
    // TS prints a spinner line even in non-interactive environments.
    eprintln!("- Validating module...");
    let module_id = super::common::last_positional(args);
    if module_id.is_none() {
        return fail(
            "Nothing to validate. Try one of:\n  spool validate module <module-id>\nOr run in an interactive terminal.",
        );
    }
    let module_id = module_id.expect("checked");

    let spool_path = rt.spool_path();

    let (full_name, report) =
        core_validate::validate_module(spool_path, &module_id, false).map_err(to_cli_error)?;
    if report.valid {
        println!("Module '{full_name}' is valid");
        return Ok(());
    }

    let mut msg = format!("Module '{full_name}' has issues\n");
    msg.push_str(&crate::diagnostics::render_validation_issues(
        &report.issues,
    ));
    fail(msg)
}

fn validate_spec_by_id_or_enoent(
    spool_path: &Path,
    spec_id: &str,
    strict: bool,
) -> core_validate::ValidationReport {
    let path = core_paths::spec_markdown_path(spool_path, spec_id);
    match spool_core::io::read_to_string_std(&path) {
        Ok(md) => core_validate::validate_spec_markdown(&md, strict),
        Err(e) => core_validate::ValidationReport::new(
            vec![core_validate::error("file", format!("ENOENT: {e}"))],
            strict,
        ),
    }
}

fn render_validate_result(
    typ: &str,
    id: &str,
    report: core_validate::ValidationReport,
    want_json: bool,
) -> bool {
    if want_json {
        // Match TS validate JSON envelope for single-item validation.
        #[derive(serde::Serialize)]
        struct Item<'a> {
            id: &'a str,
            #[serde(rename = "type")]
            typ: &'a str,
            valid: bool,
            issues: Vec<core_validate::ValidationIssue>,
            #[serde(rename = "durationMs")]
            duration_ms: u32,
        }
        #[derive(serde::Serialize)]
        struct Totals {
            items: u32,
            passed: u32,
            failed: u32,
        }
        #[derive(serde::Serialize)]
        struct ByType {
            items: u32,
            passed: u32,
            failed: u32,
        }
        #[derive(serde::Serialize)]
        struct Summary {
            totals: Totals,
            #[serde(rename = "byType")]
            by_type: std::collections::BTreeMap<String, ByType>,
        }
        #[derive(serde::Serialize)]
        struct Envelope<'a> {
            items: Vec<Item<'a>>,
            summary: Summary,
            version: &'static str,
        }

        let passed = if report.valid { 1 } else { 0 };
        let failed = if report.valid { 0 } else { 1 };
        let mut by_type = std::collections::BTreeMap::new();
        by_type.insert(
            typ.to_string(),
            ByType {
                items: 1,
                passed,
                failed,
            },
        );

        let env = Envelope {
            items: vec![Item {
                id,
                typ,
                valid: report.valid,
                issues: report.issues.clone(),
                duration_ms: 1,
            }],
            summary: Summary {
                totals: Totals {
                    items: 1,
                    passed,
                    failed,
                },
                by_type,
            },
            version: "1.0",
        };
        let rendered = serde_json::to_string_pretty(&env).expect("json should serialize");
        println!("{rendered}");
        return report.valid;
    }

    let label = if typ == "spec" {
        "Specification"
    } else if typ == "change" {
        "Change"
    } else {
        "Item"
    };

    if report.valid {
        println!("{label} '{id}' is valid");
        return true;
    }

    eprintln!("{label} '{id}' has issues");
    for issue in &report.issues {
        eprintln!("✗ [{}] {}: {}", issue.level, issue.path, issue.message);
    }

    // Minimal next steps matching TS for spec validation.
    if typ == "spec" {
        eprintln!("Next steps:");
        eprintln!("  - Ensure spec includes ## Purpose and ## Requirements sections");
        eprintln!("  - Each requirement MUST include at least one #### Scenario: block");
        eprintln!("  - Re-run with --json to see structured report");
    }

    false
}
