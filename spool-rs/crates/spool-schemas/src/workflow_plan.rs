use crate::workflow::WorkflowDefinition;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExecutionPlan {
    pub tool: Tool,
    pub workflow: WorkflowDefinition,
    pub waves: Vec<WavePlan>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WavePlan {
    pub wave_id: String,
    pub tasks: Vec<TaskPlan>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskPlan {
    pub task_id: String,
    pub model: String,
    pub context_budget: usize,
    pub prompt_content: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub inputs: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub output: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context: Option<BTreeMap<String, String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Tool {
    #[serde(rename = "opencode")]
    OpenCode,
    #[serde(rename = "claude-code")]
    ClaudeCode,
    #[serde(rename = "codex")]
    Codex,
}
