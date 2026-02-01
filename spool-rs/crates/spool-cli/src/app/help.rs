//! Help text for `spool` CLI.

pub(super) const HELP: &str = r#"Usage: spool [options] [command]

AI-native system for spec-driven development

Options:
  -V, --version                    output the version number
  --no-color                       Disable color output
  -h, --help                       display help for command

Commands:
  init [--tools <...>] [path]      Initialize Spool in your project
  update [options] [path]          Update Spool instruction files
  tasks                            Track execution tasks for a change
  plan                             Project planning tools
  state                            View and update planning/STATE.md
  workflow                         Manage and run workflows
  list [--json|--specs|--modules]  List items (changes by default). Use --specs
                                   or --modules to list other items.
  dashboard                        Display an interactive dashboard of specs and
                                   changes
  archive [--json] [change-name]   Archive a completed change and update main
                                   specs
  config [options]                 View and modify global Spool configuration
  create                           Create items
  validate [--json|--all] [item]   Validate changes, specs, and modules
  show [options] [item-name]       Show a change or spec
  completions                      Manage shell completions for Spool CLI
  status [options]                 [Experimental] Display artifact completion
                                   status for a change
  x-templates [options]            [Experimental] Show resolved template paths
                                   for all artifacts in a schema
  x-schemas [options]              [Experimental] List available workflow
                                   schemas with descriptions
  agent                            Commands that generate machine-readable
                                   output for AI agents
  ralph [options] [prompt]         Run iterative AI loop against a change
                                   proposal
  split [change-id]                Split a large change into smaller changes
  help [command]                   display help for command

Run 'spool <command> -h' for command options, or 'spool help --all' for complete reference."#;

pub(crate) const LIST_HELP: &str = r#"Usage: spool list [options]

List items (changes by default). Use --specs or --modules to list other items.

Options:
  --specs         List specs instead of changes
  --changes       List changes explicitly (default)
  --modules       List modules instead of changes
  --sort <order>  Sort order: "recent" (default) or "name" (default: "recent")
  --json          Output as JSON (for programmatic use)
  -h, --help      display help for command"#;

pub(crate) const INIT_HELP: &str = r#"Usage: spool init [options] [path]

Initialize Spool in your project

Notes:
  When run interactively and --tools is not provided, spool will prompt for tool selection.
  In non-interactive contexts, you must provide --tools.

Options:
  --tools <tools>    Configure AI tools non-interactively (all, none, or comma-separated ids)
  -f, --force        Overwrite existing tool files without prompting
  -h, --help         display help for command"#;

pub(crate) const UPDATE_HELP: &str = r#"Usage: spool update [options] [path]

Update Spool instruction files

Options:
  --json          Output as JSON
  -h, --help      display help for command"#;

pub(crate) const RALPH_HELP: &str = r#"Usage: spool ralph [options] [prompt]

Run the Ralph Wiggum iterative development loop

Options:
  --change <id>               Target a specific change
  --module <id>               Target a module (selects a change)
  --harness <name>            Harness to run (default: opencode)
  --model <model>             Model id for the harness
  --min-iterations <n>         Minimum iterations before stopping (default: 1)
  --max-iterations <n>         Maximum iterations (default: unlimited)
  --completion-promise <name>  Completion promise token (default: COMPLETE)
  --allow-all                  Allow all tool actions (dangerous)
  --yolo                       Alias for --allow-all
  --dangerously-allow-all      Alias for --allow-all
  --no-commit                  Do not create git commits per iteration
  --status                     Show current Ralph state for the change
  --add-context <text>         Append extra context to the Ralph loop
  --clear-context              Clear the Ralph loop context file
  --no-interactive             Do not prompt for selections
  -h, --help                   display help for command"#;

pub(crate) const LOOP_HELP: &str = r#"Usage: spool loop [options] [prompt]

Deprecated alias for 'spool ralph'"#;

pub(crate) const ARCHIVE_HELP: &str = r#"Usage: spool archive [change-name] [options]

Archive a completed change and update main specs

Options:
  --yes, -y              Skip confirmation prompts
  --skip-specs           Skip spec updates
  --no-validate          Skip validation checks
  -h, --help             display help for command"#;

pub(crate) const STATUS_HELP: &str = r#"Usage: spool status [options]

[Experimental] Display artifact completion status for a change

Options:
  --change <name>               Change id (directory name)
  --schema <name>               Workflow schema name
  --json                         Output as JSON
  -h, --help                     display help for command"#;

pub(crate) const STATS_HELP: &str = r#"Usage: spool stats [options]

Show local execution usage stats

Options:
  -h, --help      display help for command"#;

pub(crate) const CONFIG_HELP: &str = r#"Usage: spool config <command> [options]

View and modify global Spool configuration

Commands:
  path                      Print config file path
  list                      Print config JSON
  get <key>                 Read value by path
  set <key> <value>         Set value by path
  unset <key>               Remove value by path

Options:
  --string                  Treat <value> as a string
  -h, --help                display help for command

Run 'spool -h' to see all commands."#;

pub(crate) const AGENT_CONFIG_HELP: &str = r#"Usage: spool agent-config <command> [options]

Manage project configuration (merged across sources)

Commands:
  init                      Create <spool-dir>/config.json if missing
  summary                   Print merged config summary and sources
  get <path>                Read merged value by path
  set <path> <value>        Set value in <spool-dir>/config.json

Options:
  --string                  Treat <value> as a string
  -h, --help                display help for command"#;

pub(crate) const TEMPLATES_HELP: &str = r#"Usage: spool templates [options]

[Experimental] Show resolved template paths for all artifacts in a schema

Options:
  --schema <name>               Workflow schema name (default: spec-driven)
  --json                         Output as JSON
  -h, --help                     display help for command"#;

pub(crate) const INSTRUCTIONS_HELP: &str = r#"Usage: spool instructions <artifact> [options]

[Experimental] Show instructions for generating an artifact

Options:
  --change <name>               Change id (directory name)
  --schema <name>               Workflow schema name
  --json                         Output as JSON
  -h, --help                     display help for command"#;

pub(crate) const AGENT_HELP: &str = r#"Usage: spool agent [command] [options]

Commands that generate machine-readable output for AI agents

Commands:
  instruction <artifact> [options]   Generate enriched instructions

Options:
  -h, --help                         display help for command

Run 'spool agent <command> -h' for subcommand options."#;

pub(crate) const AGENT_INSTRUCTION_HELP: &str = r#"Usage: spool agent instruction <artifact> [options]

Generate enriched instructions

Artifacts:
  bootstrap                      Tool-specific bootstrap preamble (requires --tool)
  apply                          Apply instructions for a change (requires --change)
  <artifact-id>                  Schema artifact instructions (requires --change)

Options:
  --change <name>               Change id (directory name, required for most artifacts)
  --tool <tool>                 Tool name for bootstrap (opencode|claude|codex)
  --schema <name>               Workflow schema name
  --json                         Output as JSON
  -h, --help                     display help for command"#;

pub(crate) const SHOW_HELP: &str = r#"Usage: spool show [options] [command] [item-name]

Show a change or spec

Options:
  --json                          Output as JSON
  --type <type>                   Type: change or spec
  --no-interactive                Disable interactive prompts
  --deltas-only                   Change JSON only: only include deltas (deprecated)
  --requirements-only             Change JSON only: only include deltas (deprecated)
  --requirements                  Spec JSON only: exclude scenarios
  --no-scenarios                  Spec JSON only: exclude scenarios
  -r, --requirement <id>          Spec JSON only: select requirement (1-based)
  -h, --help                      display help for command

Commands:
  module [options] [module-id]    Show a module"#;

pub(crate) const VALIDATE_HELP: &str = r#"Usage: spool validate [options] [command] [item-name]

Validate changes, specs, and modules

Options:
  --all                          Validate everything
  --changes                       Validate changes
  --specs                         Validate specs
  --modules                       Validate modules
  --module <id>                   Validate a module by id
  --type <type>                   Type: change, spec, or module
  --strict                        Treat warnings as errors
  --json                          Output as JSON
  --concurrency <n>               Concurrency (default: 6)
  --no-interactive                Disable interactive prompts
  -h, --help                      display help for command

Commands:
  module [module-id]              Validate a module"#;
