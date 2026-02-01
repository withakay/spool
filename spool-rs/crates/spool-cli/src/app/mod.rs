#![allow(dead_code)]

mod archive;
mod common;
mod entrypoint;
mod help;
mod init;
mod instructions;
mod list;
mod ralph;
mod run;
mod show;
mod status;
mod templates;
mod update;
mod validate;

pub(crate) use entrypoint::main;

pub(crate) use help::{
    AGENT_CONFIG_HELP, AGENT_HELP, AGENT_INSTRUCTION_HELP, ARCHIVE_HELP, CONFIG_HELP, INIT_HELP,
    INSTRUCTIONS_HELP, LIST_HELP, LOOP_HELP, RALPH_HELP, SHOW_HELP, STATS_HELP, STATUS_HELP,
    TEMPLATES_HELP, UPDATE_HELP, VALIDATE_HELP,
};
