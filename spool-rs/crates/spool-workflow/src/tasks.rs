use chrono::{DateTime, Local};
use regex::Regex;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TasksFormat {
    Enhanced,
    Checkbox,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Complete,
}

impl TaskStatus {
    pub fn as_enhanced_label(self) -> &'static str {
        match self {
            TaskStatus::Pending => "pending",
            TaskStatus::InProgress => "in-progress",
            TaskStatus::Complete => "complete",
        }
    }

    pub fn from_enhanced_label(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(TaskStatus::Pending),
            "in-progress" => Some(TaskStatus::InProgress),
            "complete" => Some(TaskStatus::Complete),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TaskDiagnostic {
    pub level: DiagnosticLevel,
    pub message: String,
    pub task_id: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagnosticLevel {
    Error,
    Warning,
}

impl DiagnosticLevel {
    pub fn as_str(self) -> &'static str {
        match self {
            DiagnosticLevel::Error => "error",
            DiagnosticLevel::Warning => "warning",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TaskItem {
    pub id: String,
    pub name: String,
    pub wave: Option<u32>,
    pub status: TaskStatus,
    pub dependencies: Vec<String>,
    pub files: Vec<String>,
    pub action: String,
    pub verify: Option<String>,
    pub done_when: Option<String>,
    pub kind: TaskKind,
    pub header_line_index: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TaskKind {
    Normal,
    Checkpoint,
}

impl Default for TaskKind {
    fn default() -> Self {
        TaskKind::Normal
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProgressInfo {
    pub total: usize,
    pub complete: usize,
    pub in_progress: usize,
    pub pending: usize,
    pub remaining: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TasksParseResult {
    pub format: TasksFormat,
    pub tasks: Vec<TaskItem>,
    pub diagnostics: Vec<TaskDiagnostic>,
    pub progress: ProgressInfo,
}

pub fn compute_ready_and_blocked(
    tasks: &[TaskItem],
) -> (Vec<TaskItem>, Vec<(TaskItem, Vec<String>)>) {
    let mut by_id: std::collections::BTreeMap<String, &TaskItem> =
        std::collections::BTreeMap::new();
    for t in tasks {
        by_id.insert(t.id.clone(), t);
    }

    // Compute the first incomplete wave (if any).
    let mut waves: Vec<u32> = tasks.iter().filter_map(|t| t.wave).collect();
    waves.sort();
    waves.dedup();
    let mut first_incomplete_wave: Option<u32> = None;
    for w in waves {
        let all_done = tasks
            .iter()
            .filter(|t| t.wave == Some(w))
            .all(|t| t.status == TaskStatus::Complete);
        if !all_done {
            first_incomplete_wave = Some(w);
            break;
        }
    }

    let mut ready: Vec<TaskItem> = Vec::new();
    let mut blocked: Vec<(TaskItem, Vec<String>)> = Vec::new();

    for t in tasks {
        if t.status != TaskStatus::Pending {
            continue;
        }
        let mut blockers: Vec<String> = Vec::new();

        if let Some(first) = first_incomplete_wave {
            let is_later_wave = t.wave.is_some_and(|w| w > first);
            let is_checkpoint_like = t.wave.is_none();
            if is_later_wave || is_checkpoint_like {
                blockers.push(format!("Blocked until Wave {first} is complete"));
            }
        }

        for dep in &t.dependencies {
            let Some(dep_task) = by_id.get(dep).copied() else {
                blockers.push(format!("Missing dependency: {dep}"));
                continue;
            };
            if dep_task.status != TaskStatus::Complete {
                blockers.push(format!("Dependency not complete: {dep}"));
            }
        }

        if blockers.is_empty() {
            ready.push(t.clone());
        } else {
            blocked.push((t.clone(), blockers));
        }
    }

    ready.sort_by(|a, b| {
        let aw = a.wave.unwrap_or(u32::MAX);
        let bw = b.wave.unwrap_or(u32::MAX);
        aw.cmp(&bw)
            .then(a.header_line_index.cmp(&b.header_line_index))
    });
    blocked.sort_by(|(a, _), (b, _)| {
        let aw = a.wave.unwrap_or(u32::MAX);
        let bw = b.wave.unwrap_or(u32::MAX);
        aw.cmp(&bw)
            .then(a.header_line_index.cmp(&b.header_line_index))
    });

    (ready, blocked)
}

pub fn enhanced_tasks_template(change_id: &str, now: DateTime<Local>) -> String {
    let date = now.format("%Y-%m-%d").to_string();
    format!(
        "# Tasks for: {change_id}\n\n## Execution Notes\n- **Tool**: Any (OpenCode, Codex, Claude Code)\n- **Mode**: Sequential (or parallel if tool supports)\n- **Created**: {date}\n\n---\n\n## Wave 1\n\n### Task 1.1: [Task Name]\n- **Files**: `path/to/file.ts`\n- **Dependencies**: None\n- **Action**:\n  [Describe what needs to be done]\n- **Verify**: `[command to verify, e.g., npm test]`\n- **Done When**: [Success criteria]\n- **Status**: [ ] pending\n\n---\n\n## Checkpoints\n\n### Checkpoint: Review Implementation\n- **Type**: checkpoint (requires human approval)\n- **Dependencies**: All Wave 1 tasks\n- **Action**: Review the implementation before proceeding\n- **Done When**: User confirms implementation is correct\n- **Status**: [ ] pending\n"
    )
}

pub fn detect_tasks_format(contents: &str) -> TasksFormat {
    let enhanced_heading = Regex::new(r"(?m)^###\s+(Task\s+)?[^:]+:\s+.+$").unwrap();
    let has_status = contents.contains("- **Status**:");
    if enhanced_heading.is_match(contents) && has_status {
        return TasksFormat::Enhanced;
    }
    let checkbox = Regex::new(r"(?m)^\s*[-*]\s+\[[ xX]\]").unwrap();
    if checkbox.is_match(contents) {
        return TasksFormat::Checkbox;
    }
    TasksFormat::Checkbox
}

pub fn parse_tasks_tracking_file(contents: &str) -> TasksParseResult {
    match detect_tasks_format(contents) {
        TasksFormat::Enhanced => parse_enhanced_tasks(contents),
        TasksFormat::Checkbox => parse_checkbox_tasks(contents),
    }
}

fn parse_checkbox_tasks(contents: &str) -> TasksParseResult {
    // Minimal compat: tasks are numbered 1..N.
    let mut tasks: Vec<TaskItem> = Vec::new();
    for line in contents.lines() {
        let l = line.trim_start();
        let (done, rest) = if let Some(r) = l.strip_prefix("- [x] ") {
            (true, r)
        } else if let Some(r) = l.strip_prefix("- [X] ") {
            (true, r)
        } else if let Some(r) = l.strip_prefix("- [ ] ") {
            (false, r)
        } else if let Some(r) = l.strip_prefix("* [x] ") {
            (true, r)
        } else if let Some(r) = l.strip_prefix("* [X] ") {
            (true, r)
        } else if let Some(r) = l.strip_prefix("* [ ] ") {
            (false, r)
        } else {
            continue;
        };
        tasks.push(TaskItem {
            id: (tasks.len() + 1).to_string(),
            name: rest.trim().to_string(),
            wave: None,
            status: if done {
                TaskStatus::Complete
            } else {
                TaskStatus::Pending
            },
            dependencies: Vec::new(),
            files: Vec::new(),
            action: String::new(),
            verify: None,
            done_when: None,
            kind: TaskKind::Normal,
            header_line_index: tasks.len(),
        });
    }
    let progress = compute_progress(&tasks);
    TasksParseResult {
        format: TasksFormat::Checkbox,
        tasks,
        diagnostics: Vec::new(),
        progress,
    }
}

fn parse_enhanced_tasks(contents: &str) -> TasksParseResult {
    let mut diagnostics: Vec<TaskDiagnostic> = Vec::new();
    let mut tasks: Vec<TaskItem> = Vec::new();

    let wave_re = Regex::new(r"^##\s+Wave\s+(\d+)\s*$").unwrap();
    let task_re = Regex::new(r"^###\s+(?:Task\s+)?([^:]+):\s+(.+?)\s*$").unwrap();
    let deps_re = Regex::new(r"\*\*Dependencies\*\*:\s*(.+?)\s*$").unwrap();
    let status_re =
        Regex::new(r"\*\*Status\*\*:\s*\[[ xX]\]\s+(pending|in-progress|complete)\s*$").unwrap();
    let files_re = Regex::new(r"\*\*Files\*\*:\s*`([^`]+)`\s*$").unwrap();
    let verify_re = Regex::new(r"\*\*Verify\*\*:\s*`([^`]+)`\s*$").unwrap();
    let done_when_re = Regex::new(r"\*\*Done When\*\*:\s*(.+?)\s*$").unwrap();

    let mut current_wave: Option<u32> = None;

    #[derive(Debug, Default)]
    struct CurrentTask {
        id: Option<String>,
        desc: Option<String>,
        wave: Option<u32>,
        header_line_index: usize,
        kind: TaskKind,
        deps_raw: Option<String>,
        status_raw: Option<String>,
        files: Vec<String>,
        action_lines: Vec<String>,
        verify: Option<String>,
        done_when: Option<String>,
    }

    fn flush_current(
        current: &mut CurrentTask,
        tasks: &mut Vec<TaskItem>,
        diagnostics: &mut Vec<TaskDiagnostic>,
    ) {
        let Some(id) = current.id.take() else {
            current.desc = None;
            current.deps_raw = None;
            current.status_raw = None;
            current.kind = TaskKind::Normal;
            return;
        };
        let desc = current.desc.take().unwrap_or_default();
        let wave = current.wave.take();
        let header_line_index = current.header_line_index;
        let deps_raw = current.deps_raw.take().unwrap_or_default();
        let status_raw = current.status_raw.take();
        let files = std::mem::take(&mut current.files);
        let action = std::mem::take(&mut current.action_lines)
            .join("\n")
            .trim()
            .to_string();
        let verify = current.verify.take();
        let done_when = current.done_when.take();

        let status = match status_raw
            .as_deref()
            .and_then(TaskStatus::from_enhanced_label)
        {
            Some(s) => s,
            None => {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Error,
                    message: "Invalid or missing status".to_string(),
                    task_id: Some(id.clone()),
                });
                TaskStatus::Pending
            }
        };
        let deps = parse_dependencies(&deps_raw);

        tasks.push(TaskItem {
            id,
            name: desc,
            wave,
            status,
            dependencies: deps,
            files,
            action,
            verify,
            done_when,
            kind: current.kind,
            header_line_index,
        });
        current.kind = TaskKind::Normal;
    }

    let mut current_task = CurrentTask {
        id: None,
        desc: None,
        wave: None,
        header_line_index: 0,
        kind: TaskKind::Normal,
        deps_raw: None,
        status_raw: None,
        files: Vec::new(),
        action_lines: Vec::new(),
        verify: None,
        done_when: None,
    };

    let mut in_action = false;

    for (line_idx, line) in contents.lines().enumerate() {
        if in_action && current_task.id.is_some() {
            if line.starts_with("- **") || line.starts_with("### ") || line.starts_with("## ") {
                in_action = false;
                // fall through to process this line normally
            } else {
                let trimmed = line.trim();
                if !trimmed.is_empty() {
                    current_task.action_lines.push(trimmed.to_string());
                }
                continue;
            }
        }

        if let Some(cap) = wave_re.captures(line) {
            flush_current(&mut current_task, &mut tasks, &mut diagnostics);
            current_wave = cap.get(1).and_then(|m| m.as_str().parse::<u32>().ok());
            continue;
        }
        if line.trim() == "## Checkpoints" {
            flush_current(&mut current_task, &mut tasks, &mut diagnostics);
            current_wave = None;
            continue;
        }

        if let Some(cap) = task_re.captures(line) {
            flush_current(&mut current_task, &mut tasks, &mut diagnostics);
            let id = cap[1].trim().to_string();
            let desc = cap[2].trim().to_string();
            current_task.id = Some(id.clone());
            current_task.desc = Some(desc);
            current_task.wave = current_wave;
            current_task.header_line_index = line_idx;
            current_task.kind = TaskKind::Normal;
            current_task.deps_raw = None;
            current_task.status_raw = None;
            current_task.files.clear();
            current_task.action_lines.clear();
            current_task.verify = None;
            current_task.done_when = None;
            in_action = false;

            if current_wave.is_none() {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Warning,
                    message: format!(
                        "{id}: Task '{id}' appears outside any Wave section; wave gating may not behave as expected"
                    ),
                    task_id: None,
                });
            }
            continue;
        }

        if current_task.id.is_some() {
            if line.trim() == "- **Action**:" {
                in_action = true;
                current_task.action_lines.clear();
                continue;
            }
            if let Some(cap) = deps_re.captures(line) {
                current_task.deps_raw = Some(cap[1].trim().to_string());
                continue;
            }
            if let Some(cap) = status_re.captures(line) {
                current_task.status_raw = Some(cap[1].trim().to_string());
                continue;
            }
            if let Some(cap) = files_re.captures(line) {
                let inner = cap[1].trim();
                current_task.files = inner
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
                continue;
            }
            if let Some(cap) = verify_re.captures(line) {
                current_task.verify = Some(cap[1].trim().to_string());
                continue;
            }
            if let Some(cap) = done_when_re.captures(line) {
                current_task.done_when = Some(cap[1].trim().to_string());
                continue;
            }
        }
    }

    flush_current(&mut current_task, &mut tasks, &mut diagnostics);

    // Validate dependencies.
    let task_ids: std::collections::BTreeSet<String> = tasks.iter().map(|t| t.id.clone()).collect();
    for t in &tasks {
        for dep in &t.dependencies {
            if dep == "" {
                continue;
            }
            if dep == "Checkpoint" {
                // checkpoints are not addressable by id in enhanced deps.
                continue;
            }
            if !task_ids.contains(dep) {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Error,
                    message: format!("Missing dependency: {dep}"),
                    task_id: Some(t.id.clone()),
                });
            }
        }
    }

    let progress = compute_progress(&tasks);

    TasksParseResult {
        format: TasksFormat::Enhanced,
        tasks,
        diagnostics,
        progress,
    }
}

fn parse_dependencies(raw: &str) -> Vec<String> {
    parse_dependencies_with_checkpoint(raw, TaskKind::Normal).0
}

fn parse_dependencies_with_checkpoint(raw: &str, kind: TaskKind) -> (Vec<String>, Option<u32>) {
    let r = raw.trim();
    if r.is_empty() {
        return (Vec::new(), None);
    }
    let lower = r.to_ascii_lowercase();
    if lower == "none" {
        return (Vec::new(), None);
    }

    // Special-case strings from the enhanced template.
    let all_wave_capture = Regex::new(r"(?i)^all\s+wave\s+(\d+)\s+tasks$").unwrap();
    if let Some(cap) = all_wave_capture.captures(r) {
        let wave = cap.get(1).and_then(|m| m.as_str().parse::<u32>().ok());
        if kind == TaskKind::Checkpoint {
            return (Vec::new(), wave);
        }
        return (Vec::new(), None);
    }
    if lower == "all previous waves" {
        // We don't expand this into explicit deps here.
        return (Vec::new(), None);
    }

    let deps = r
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.strip_prefix("Task ").unwrap_or(s).trim().to_string())
        .collect();
    (deps, None)
}

fn compute_progress(tasks: &[TaskItem]) -> ProgressInfo {
    let total = tasks.len();
    let complete = tasks
        .iter()
        .filter(|t| t.status == TaskStatus::Complete)
        .count();
    let in_progress = tasks
        .iter()
        .filter(|t| t.status == TaskStatus::InProgress)
        .count();
    let pending = tasks
        .iter()
        .filter(|t| t.status == TaskStatus::Pending)
        .count();
    let remaining = total.saturating_sub(complete);
    ProgressInfo {
        total,
        complete,
        in_progress,
        pending,
        remaining,
    }
}

pub fn tasks_path(spool_path: &Path, change_id: &str) -> PathBuf {
    spool_path.join("changes").join(change_id).join("tasks.md")
}

pub fn update_enhanced_task_status(
    contents: &str,
    task_id: &str,
    new_status: TaskStatus,
) -> String {
    // Match TS: `^###\s+(?:Task\s+)?${taskId}\s*:`
    let heading = Regex::new(&format!(
        r"(?m)^###\s+(?:Task\s+)?{}\s*:\s*.+$",
        regex::escape(task_id)
    ))
    .unwrap();

    let status_line = match new_status {
        TaskStatus::Complete => "- **Status**: [x] complete".to_string(),
        TaskStatus::InProgress => "- **Status**: [ ] in-progress".to_string(),
        TaskStatus::Pending => "- **Status**: [ ] pending".to_string(),
    };

    let mut lines: Vec<String> = contents.lines().map(|l| l.to_string()).collect();
    let mut in_block = false;
    let mut heading_seen = false;
    let mut replaced = false;

    for i in 0..lines.len() {
        let line = &lines[i];
        if !heading_seen && heading.is_match(line) {
            heading_seen = true;
            in_block = true;
            continue;
        }
        if !in_block {
            continue;
        }

        if line.starts_with("### ") || line.starts_with("## ") {
            // End of block; insert status line before next header.
            lines.insert(i, status_line.clone());
            replaced = true;
            break;
        }

        if line.trim_start().starts_with("- **Status**:") {
            lines[i] = status_line.clone();
            replaced = true;
            break;
        }
    }

    if heading_seen && in_block && !replaced {
        // Reached EOF inside block without a status line.
        lines.push(status_line);
    }

    // Preserve trailing newline behavior similar to TS templates.
    let mut out = lines.join("\n");
    out.push('\n');
    out
}
