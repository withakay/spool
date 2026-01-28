use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkflowDefinition {
    pub version: String,
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub description: String,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub requires: Option<WorkflowRequires>,

    #[serde(
        rename = "context_files",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub context_files: Option<Vec<String>>,

    pub waves: Vec<WaveDefinition>,

    #[serde(
        rename = "on_complete",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub on_complete: Option<OnComplete>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkflowRequires {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub files: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variables: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OnComplete {
    #[serde(
        rename = "update_state",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub update_state: Option<bool>,
    #[serde(
        rename = "update_roadmap",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub update_roadmap: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notify: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WaveDefinition {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub tasks: Vec<TaskDefinition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checkpoint: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskDefinition {
    pub id: String,
    pub name: String,
    pub agent: AgentType,
    pub prompt: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub inputs: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub output: Option<String>,
    #[serde(rename = "type", default, skip_serializing_if = "Option::is_none")]
    pub task_type: Option<TaskType>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context: Option<BTreeMap<String, String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    Research,
    Execution,
    Review,
    Planning,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    Auto,
    Checkpoint,
    Decision,
}
