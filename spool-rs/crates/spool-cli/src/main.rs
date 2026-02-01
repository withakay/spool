mod app;
mod cli_error;
mod commands;
mod diagnostics;
mod runtime;
mod util;

pub(crate) use app::AGENT_CONFIG_HELP;
pub(crate) use app::AGENT_HELP;
pub(crate) use app::AGENT_INSTRUCTION_HELP;
pub(crate) use app::ARCHIVE_HELP;
pub(crate) use app::CONFIG_HELP;
pub(crate) use app::INIT_HELP;
pub(crate) use app::LIST_HELP;
pub(crate) use app::RALPH_HELP;
pub(crate) use app::SHOW_HELP;
pub(crate) use app::STATS_HELP;
pub(crate) use app::STATUS_HELP;
pub(crate) use app::TEMPLATES_HELP;
pub(crate) use app::UPDATE_HELP;
pub(crate) use app::VALIDATE_HELP;

fn main() {
    app::main();
}
