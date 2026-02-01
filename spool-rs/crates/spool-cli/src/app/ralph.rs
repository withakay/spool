use crate::cli_error::{CliResult, fail, to_cli_error};
use crate::runtime::Runtime;
use crate::util::parse_string_flag;
use spool_core::ralph as core_ralph;
use spool_harness::Harness;
use spool_harness::OpencodeHarness;
use spool_harness::stub::StubHarness;

pub(crate) fn handle_loop(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{}\n\n{}", super::LOOP_HELP, super::RALPH_HELP);
        return Ok(());
    }
    // Match TS: loop is deprecated wrapper.
    eprintln!("Warning: `spool loop` is deprecated. Use `spool ralph` instead.");
    handle_ralph(rt, args)
}

pub(crate) fn handle_ralph(rt: &Runtime, args: &[String]) -> CliResult<()> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{}", super::RALPH_HELP);
        return Ok(());
    }

    fn parse_u32_flag(args: &[String], key: &str) -> Option<u32> {
        parse_string_flag(args, key).and_then(|v| v.parse::<u32>().ok())
    }

    fn collect_prompt(args: &[String]) -> String {
        // Collect positional args, skipping known flags + their values.
        let mut out: Vec<String> = Vec::new();
        let mut i = 0;
        while i < args.len() {
            let a = args[i].as_str();
            let takes_value = matches!(
                a,
                "--change"
                    | "--module"
                    | "--harness"
                    | "--model"
                    | "--min-iterations"
                    | "--max-iterations"
                    | "--completion-promise"
                    | "--add-context"
                    | "--stub-script"
            );

            if takes_value {
                i += 2;
                continue;
            }

            if a.starts_with("--change=")
                || a.starts_with("--module=")
                || a.starts_with("--harness=")
                || a.starts_with("--model=")
                || a.starts_with("--min-iterations=")
                || a.starts_with("--max-iterations=")
                || a.starts_with("--completion-promise=")
                || a.starts_with("--add-context=")
                || a.starts_with("--stub-script=")
            {
                i += 1;
                continue;
            }

            if a.starts_with('-') {
                i += 1;
                continue;
            }

            out.push(args[i].clone());
            i += 1;
        }
        out.join(" ")
    }

    let change_id = parse_string_flag(args, "--change");
    let module_id = parse_string_flag(args, "--module");

    let harness = parse_string_flag(args, "--harness").unwrap_or_else(|| "opencode".to_string());
    let model = parse_string_flag(args, "--model");

    let min_iterations = parse_u32_flag(args, "--min-iterations").unwrap_or(1);
    let max_iterations = parse_u32_flag(args, "--max-iterations");
    let completion_promise =
        parse_string_flag(args, "--completion-promise").unwrap_or_else(|| "COMPLETE".to_string());

    let allow_all = args.iter().any(|a| {
        matches!(
            a.as_str(),
            "--allow-all" | "--yolo" | "--dangerously-allow-all"
        )
    });
    let no_commit = args.iter().any(|a| a == "--no-commit");
    let status = args.iter().any(|a| a == "--status");
    let add_context = parse_string_flag(args, "--add-context");
    let clear_context = args.iter().any(|a| a == "--clear-context");
    let interactive = !args.iter().any(|a| a == "--no-interactive");

    // Hidden testing flag.
    let stub_script = parse_string_flag(args, "--stub-script");

    if !interactive
        && change_id.is_none()
        && module_id.is_none()
        && !status
        && add_context.is_none()
        && !clear_context
    {
        return fail(
            "Either --change, --module, --status, --add-context, or --clear-context must be specified",
        );
    }

    if clear_context && change_id.is_none() {
        return fail("--change is required for --clear-context");
    }
    if add_context.is_some() && change_id.is_none() {
        return fail("--change is required for --add-context");
    }
    if status && change_id.is_none() && module_id.is_none() {
        return fail("--change is required for --status, or provide --module to auto-select");
    }

    let prompt = collect_prompt(args);

    let spool_path = rt.spool_path();

    let mut harness_impl: Box<dyn Harness> = match harness.as_str() {
        "opencode" => Box::new(OpencodeHarness),
        "stub" => {
            let mut p = stub_script.map(std::path::PathBuf::from);
            if p.is_none() {
                // Prefer env var in CI, but allow missing.
                p = None;
            }
            match StubHarness::from_env_or_default(p) {
                Ok(h) => Box::new(h),
                Err(e) => return Err(to_cli_error(e)),
            }
        }
        _ => return fail(format!("Unknown harness: {h}", h = harness)),
    };

    let opts = core_ralph::RalphOptions {
        prompt,
        change_id,
        module_id,
        model,
        min_iterations,
        max_iterations,
        completion_promise,
        allow_all,
        no_commit,
        interactive,
        status,
        add_context,
        clear_context,
    };

    core_ralph::run_ralph(spool_path, opts, harness_impl.as_mut()).map_err(to_cli_error)?;

    Ok(())
}
