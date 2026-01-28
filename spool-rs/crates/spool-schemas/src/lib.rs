//! Serde models for Spool's on-disk formats.
//!
//! This crate exists to keep YAML/JSON schema structs shared across crates
//! (e.g. `spool-workflow`, `spool-core`, `spool-cli`).

pub mod workflow;
pub mod workflow_plan;
pub mod workflow_state;

pub use workflow::*;
pub use workflow_plan::*;
pub use workflow_state::*;
