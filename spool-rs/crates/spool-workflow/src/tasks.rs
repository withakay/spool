use chrono::{DateTime, Local, NaiveDate};
use regex::Regex;
use rusqlite::OptionalExtension;
use std::collections::{BTreeMap, HashMap};
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
    Shelved,
}

impl TaskStatus {
    pub fn as_enhanced_label(self) -> &'static str {
        match self {
            TaskStatus::Pending => "pending",
            TaskStatus::InProgress => "in-progress",
            TaskStatus::Complete => "complete",
            TaskStatus::Shelved => "shelved",
        }
    }

    pub fn from_enhanced_label(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(TaskStatus::Pending),
            "in-progress" => Some(TaskStatus::InProgress),
            "complete" => Some(TaskStatus::Complete),
            "shelved" => Some(TaskStatus::Shelved),
            _ => None,
        }
    }

    pub fn is_done(self) -> bool {
        matches!(self, TaskStatus::Complete | TaskStatus::Shelved)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TaskDiagnostic {
    pub level: DiagnosticLevel,
    pub message: String,
    pub task_id: Option<String>,
    pub line: Option<usize>,
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
    pub updated_at: Option<String>,
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
    pub shelved: usize,
    pub in_progress: usize,
    pub pending: usize,
    pub remaining: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WaveInfo {
    pub wave: u32,
    pub depends_on: Vec<u32>,
    pub header_line_index: usize,
    pub depends_on_line_index: Option<usize>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TasksParseResult {
    pub format: TasksFormat,
    pub tasks: Vec<TaskItem>,
    pub waves: Vec<WaveInfo>,
    pub diagnostics: Vec<TaskDiagnostic>,
    pub progress: ProgressInfo,
}

pub fn compute_ready_and_blocked(
    parsed: &TasksParseResult,
) -> (Vec<TaskItem>, Vec<(TaskItem, Vec<String>)>) {
    let tasks = &parsed.tasks;

    if parsed.format == TasksFormat::Checkbox {
        let mut ready: Vec<TaskItem> = tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Pending)
            .cloned()
            .collect();
        ready.sort_by(|a, b| a.header_line_index.cmp(&b.header_line_index));
        return (ready, Vec::new());
    }

    let mut by_id: std::collections::BTreeMap<&str, &TaskItem> = std::collections::BTreeMap::new();
    for t in tasks {
        by_id.insert(t.id.as_str(), t);
    }

    let mut wave_complete: BTreeMap<u32, bool> = BTreeMap::new();
    for w in &parsed.waves {
        let done = tasks
            .iter()
            .filter(|t| t.wave == Some(w.wave))
            .all(|t| t.status.is_done());
        wave_complete.insert(w.wave, done);
    }

    let mut wave_unlocked: BTreeMap<u32, bool> = BTreeMap::new();
    for w in &parsed.waves {
        let unlocked = w
            .depends_on
            .iter()
            .all(|dep| wave_complete.get(dep).copied().unwrap_or(false));
        wave_unlocked.insert(w.wave, unlocked);
    }

    // Back-compat gating when no WaveInfo entries exist.
    let mut first_incomplete_wave: Option<u32> = None;
    if parsed.waves.is_empty() {
        let mut waves: Vec<u32> = tasks.iter().filter_map(|t| t.wave).collect();
        waves.sort();
        waves.dedup();
        for w in waves {
            let all_done = tasks
                .iter()
                .filter(|t| t.wave == Some(w))
                .all(|t| t.status.is_done());
            if !all_done {
                first_incomplete_wave = Some(w);
                break;
            }
        }
    }

    let all_waves_complete = if parsed.waves.is_empty() {
        first_incomplete_wave.is_none()
    } else {
        wave_complete.values().all(|v| *v)
    };

    let mut ready: Vec<TaskItem> = Vec::new();
    let mut blocked: Vec<(TaskItem, Vec<String>)> = Vec::new();

    for t in tasks {
        if t.status != TaskStatus::Pending {
            continue;
        }
        let mut blockers: Vec<String> = Vec::new();

        if parsed.waves.is_empty() {
            if let Some(first) = first_incomplete_wave {
                let is_later_wave = t.wave.is_some_and(|w| w > first);
                let is_checkpoint_like = t.wave.is_none();
                if is_later_wave || is_checkpoint_like {
                    blockers.push(format!("Blocked until Wave {first} is complete"));
                }
            }
        } else {
            match t.wave {
                Some(w) => {
                    if !wave_unlocked.get(&w).copied().unwrap_or(true) {
                        if let Some(wave) = parsed.waves.iter().find(|wi| wi.wave == w) {
                            for dep in &wave.depends_on {
                                if !wave_complete.get(dep).copied().unwrap_or(false) {
                                    blockers.push(format!("Blocked by Wave {dep}"));
                                }
                            }
                        } else {
                            blockers.push(format!("Blocked: Wave {w} is locked"));
                        }
                    }
                }
                None => {
                    if !all_waves_complete {
                        blockers.push("Blocked until all waves are complete".to_string());
                    }
                }
            }
        }

        for dep in &t.dependencies {
            if dep.is_empty() || dep == "Checkpoint" {
                continue;
            }
            let Some(dep_task) = by_id.get(dep.as_str()).copied() else {
                blockers.push(format!("Missing dependency: {dep}"));
                continue;
            };
            if t.wave != dep_task.wave {
                blockers.push(format!("Cross-wave dependency: {dep}"));
            }
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
        "# Tasks for: {change_id}\n\n## Execution Notes\n- **Tool**: Any (OpenCode, Codex, Claude Code)\n- **Mode**: Sequential (or parallel if tool supports)\n- **Created**: {date}\n\n---\n\n## Wave 1\n- **Depends On**: None\n\n### Task 1.1: [Task Name]\n- **Files**: `path/to/file.ts`\n- **Dependencies**: None\n- **Action**:\n  [Describe what needs to be done]\n- **Verify**: `[command to verify, e.g., npm test]`\n- **Done When**: [Success criteria]\n- **Updated At**: {date}\n- **Status**: [ ] pending\n\n---\n\n## Checkpoints\n\n### Checkpoint: Review Implementation\n- **Type**: checkpoint (requires human approval)\n- **Dependencies**: All Wave 1 tasks\n- **Action**: Review the implementation before proceeding\n- **Done When**: User confirms implementation is correct\n- **Updated At**: {date}\n- **Status**: [ ] pending\n"
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
            updated_at: None,
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
        waves: Vec::new(),
        diagnostics: Vec::new(),
        progress,
    }
}

fn parse_enhanced_tasks(contents: &str) -> TasksParseResult {
    let mut diagnostics: Vec<TaskDiagnostic> = Vec::new();
    let mut tasks: Vec<TaskItem> = Vec::new();

    let wave_re = Regex::new(r"^##\s+Wave\s+(\d+)\s*$").unwrap();
    let wave_dep_re = Regex::new(r"^\s*[-*]\s+\*\*Depends On\*\*:\s*(.+?)\s*$").unwrap();
    let task_re = Regex::new(r"^###\s+(?:Task\s+)?([^:]+):\s+(.+?)\s*$").unwrap();
    let deps_re = Regex::new(r"\*\*Dependencies\*\*:\s*(.+?)\s*$").unwrap();
    let status_re = Regex::new(
        r"\*\*Status\*\*:\s*\[([ xX\-~])\]\s+(pending|in-progress|complete|shelved)\s*$",
    )
    .unwrap();
    let updated_at_re = Regex::new(r"\*\*Updated At\*\*:\s*(\d{4}-\d{2}-\d{2})\s*$").unwrap();
    let files_re = Regex::new(r"\*\*Files\*\*:\s*`([^`]+)`\s*$").unwrap();
    let verify_re = Regex::new(r"\*\*Verify\*\*:\s*`([^`]+)`\s*$").unwrap();
    let done_when_re = Regex::new(r"\*\*Done When\*\*:\s*(.+?)\s*$").unwrap();

    let mut current_wave: Option<u32> = None;
    let mut in_checkpoints = false;

    #[derive(Debug, Default, Clone)]
    struct WaveBuilder {
        header_line_index: usize,
        depends_on_raw: Option<String>,
        depends_on_line_index: Option<usize>,
    }

    let mut waves: BTreeMap<u32, WaveBuilder> = BTreeMap::new();

    #[derive(Debug, Default)]
    struct CurrentTask {
        id: Option<String>,
        desc: Option<String>,
        wave: Option<u32>,
        header_line_index: usize,
        kind: TaskKind,
        deps_raw: Option<String>,
        updated_at_raw: Option<String>,
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
            current.updated_at_raw = None;
            current.status_raw = None;
            current.kind = TaskKind::Normal;
            return;
        };
        let desc = current.desc.take().unwrap_or_default();
        let wave = current.wave.take();
        let header_line_index = current.header_line_index;
        let deps_raw = current.deps_raw.take().unwrap_or_default();
        let updated_at_raw = current.updated_at_raw.take();
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
                    line: Some(header_line_index + 1),
                });
                TaskStatus::Pending
            }
        };
        let deps = parse_dependencies(&deps_raw);

        let updated_at = match updated_at_raw.as_deref() {
            Some(s) => {
                if NaiveDate::parse_from_str(s, "%Y-%m-%d").is_ok() {
                    Some(s.to_string())
                } else {
                    diagnostics.push(TaskDiagnostic {
                        level: DiagnosticLevel::Error,
                        message: format!("Invalid Updated At date: {s} (expected YYYY-MM-DD)"),
                        task_id: Some(id.clone()),
                        line: Some(header_line_index + 1),
                    });
                    None
                }
            }
            None => {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Warning,
                    message: "Missing Updated At field".to_string(),
                    task_id: Some(id.clone()),
                    line: Some(header_line_index + 1),
                });
                None
            }
        };

        tasks.push(TaskItem {
            id,
            name: desc,
            wave,
            status,
            updated_at,
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
        updated_at_raw: None,
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
            in_checkpoints = false;
            if let Some(w) = current_wave {
                waves.entry(w).or_insert_with(|| WaveBuilder {
                    header_line_index: line_idx,
                    depends_on_raw: None,
                    depends_on_line_index: None,
                });
            }
            continue;
        }
        if line.trim() == "## Checkpoints" {
            flush_current(&mut current_task, &mut tasks, &mut diagnostics);
            current_wave = None;
            in_checkpoints = true;
            continue;
        }

        if current_task.id.is_none() {
            if let Some(w) = current_wave {
                if let Some(cap) = wave_dep_re.captures(line) {
                    let raw = cap[1].trim().to_string();
                    let entry = waves.entry(w).or_insert_with(|| WaveBuilder {
                        header_line_index: line_idx,
                        depends_on_raw: None,
                        depends_on_line_index: None,
                    });
                    if entry.depends_on_raw.is_some() {
                        diagnostics.push(TaskDiagnostic {
                            level: DiagnosticLevel::Warning,
                            message: format!(
                                "Wave {w}: duplicate Depends On line; using the first one"
                            ),
                            task_id: None,
                            line: Some(line_idx + 1),
                        });
                    } else {
                        entry.depends_on_raw = Some(raw);
                        entry.depends_on_line_index = Some(line_idx);
                    }
                    continue;
                }
            }
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
            current_task.updated_at_raw = None;
            current_task.status_raw = None;
            current_task.files.clear();
            current_task.action_lines.clear();
            current_task.verify = None;
            current_task.done_when = None;
            in_action = false;

            if current_wave.is_none() && !in_checkpoints {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Warning,
                    message: format!(
                        "{id}: Task '{id}' appears outside any Wave section; wave gating may not behave as expected"
                    ),
                    task_id: None,
                    line: Some(line_idx + 1),
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
            if let Some(cap) = updated_at_re.captures(line) {
                current_task.updated_at_raw = Some(cap[1].trim().to_string());
                continue;
            }
            if let Some(cap) = status_re.captures(line) {
                current_task.status_raw = Some(cap[2].trim().to_string());
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

    // Build wave dependency model.
    let mut wave_nums: Vec<u32> = waves.keys().copied().collect();
    wave_nums.sort();
    wave_nums.dedup();
    let wave_set: std::collections::BTreeSet<u32> = wave_nums.iter().copied().collect();

    let mut waves_out: Vec<WaveInfo> = Vec::new();
    for w in &wave_nums {
        let builder = waves.get(w).cloned().unwrap_or_default();

        let mut depends_on: Vec<u32> = Vec::new();
        if let Some(raw) = builder.depends_on_raw.as_deref() {
            let trimmed = raw.trim();
            if trimmed.is_empty() {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Error,
                    message: format!("Wave {w}: Depends On is empty"),
                    task_id: None,
                    line: Some(builder.header_line_index + 1),
                });
            } else if trimmed.eq_ignore_ascii_case("none") {
                // no deps
            } else {
                for part in trimmed.split(',') {
                    let p = part.trim();
                    if p.is_empty() {
                        continue;
                    }
                    let p2 = if p.to_ascii_lowercase().starts_with("wave ") {
                        p[5..].trim()
                    } else {
                        p
                    };
                    match p2.parse::<u32>() {
                        Ok(n) => depends_on.push(n),
                        Err(_) => diagnostics.push(TaskDiagnostic {
                            level: DiagnosticLevel::Error,
                            message: format!("Wave {w}: invalid Depends On entry '{p}'"),
                            task_id: None,
                            line: Some(
                                builder
                                    .depends_on_line_index
                                    .unwrap_or(builder.header_line_index)
                                    + 1,
                            ),
                        }),
                    }
                }
            }
        } else {
            // Back-compat: default to the old sequential gating.
            depends_on = wave_nums.iter().copied().filter(|n| *n < *w).collect();
            diagnostics.push(TaskDiagnostic {
                level: DiagnosticLevel::Warning,
                message: format!(
                    "Wave {w}: missing Depends On line; defaulting to all previous waves"
                ),
                task_id: None,
                line: Some(builder.header_line_index + 1),
            });
        }

        depends_on.sort();
        depends_on.dedup();

        for dep_wave in &depends_on {
            if dep_wave == w {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Error,
                    message: format!("Wave {w}: cannot depend on itself"),
                    task_id: None,
                    line: Some(
                        builder
                            .depends_on_line_index
                            .unwrap_or(builder.header_line_index)
                            + 1,
                    ),
                });
                continue;
            }
            if !wave_set.contains(dep_wave) {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Error,
                    message: format!("Wave {w}: depends on missing Wave {dep_wave}"),
                    task_id: None,
                    line: Some(
                        builder
                            .depends_on_line_index
                            .unwrap_or(builder.header_line_index)
                            + 1,
                    ),
                });
            }
        }

        waves_out.push(WaveInfo {
            wave: *w,
            depends_on,
            header_line_index: builder.header_line_index,
            depends_on_line_index: builder.depends_on_line_index,
        });
    }

    // Validate wave cycles.
    let mut wave_edges: Vec<(String, String)> = Vec::new();
    for w in &waves_out {
        for dep in &w.depends_on {
            wave_edges.push((w.wave.to_string(), dep.to_string()));
        }
    }
    if let Some(path) = find_cycle_path(&wave_edges) {
        diagnostics.push(TaskDiagnostic {
            level: DiagnosticLevel::Error,
            message: format!("Wave dependency cycle detected: {path}"),
            task_id: None,
            line: None,
        });
    }

    // Validate task dependencies.
    let mut by_id: HashMap<&str, &TaskItem> = HashMap::new();
    for t in &tasks {
        by_id.insert(t.id.as_str(), t);
    }

    let mut task_edges: Vec<(String, String)> = Vec::new();
    for t in &tasks {
        for dep in &t.dependencies {
            if dep.is_empty() || dep == "Checkpoint" {
                continue;
            }
            let Some(dep_task) = by_id.get(dep.as_str()).copied() else {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Error,
                    message: format!("Missing dependency: {dep}"),
                    task_id: Some(t.id.clone()),
                    line: Some(t.header_line_index + 1),
                });
                continue;
            };

            if t.wave != dep_task.wave {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Error,
                    message: format!(
                        "Cross-wave dependency not allowed: {} depends on {}",
                        t.id, dep_task.id
                    ),
                    task_id: Some(t.id.clone()),
                    line: Some(t.header_line_index + 1),
                });
            }

            if t.status != TaskStatus::Shelved && dep_task.status == TaskStatus::Shelved {
                diagnostics.push(TaskDiagnostic {
                    level: DiagnosticLevel::Error,
                    message: format!("Dependency is shelved: {}", dep_task.id),
                    task_id: Some(t.id.clone()),
                    line: Some(t.header_line_index + 1),
                });
            }

            task_edges.push((t.id.clone(), dep_task.id.clone()));
        }
    }

    if let Some(path) = find_cycle_path(&task_edges) {
        diagnostics.push(TaskDiagnostic {
            level: DiagnosticLevel::Error,
            message: format!("Dependency cycle detected: {path}"),
            task_id: None,
            line: None,
        });
    }

    let progress = compute_progress(&tasks);

    TasksParseResult {
        format: TasksFormat::Enhanced,
        tasks,
        waves: waves_out,
        diagnostics,
        progress,
    }
}

fn find_cycle_path(edges: &[(String, String)]) -> Option<String> {
    if edges.is_empty() {
        return None;
    }

    let mut conn = rusqlite::Connection::open_in_memory().ok()?;
    conn.execute(
        "CREATE TABLE edge (src TEXT NOT NULL, dst TEXT NOT NULL);",
        [],
    )
    .ok()?;

    {
        let tx = conn.transaction().ok()?;
        {
            let mut stmt = tx
                .prepare("INSERT INTO edge (src, dst) VALUES (?1, ?2);")
                .ok()?;
            for (src, dst) in edges {
                stmt.execute(rusqlite::params![src, dst]).ok()?;
            }
        }
        tx.commit().ok()?;
    }

    // Detect a cycle and return a delimited path like: |a|b|c|a|
    let sql = r#"
WITH RECURSIVE
  walk(start, current, path) AS (
    SELECT src, dst, '|' || src || '|' || dst || '|'
    FROM edge
    UNION ALL
    SELECT w.start, e.dst, w.path || e.dst || '|'
    FROM walk w
    JOIN edge e ON e.src = w.current
    WHERE instr(w.path, '|' || e.dst || '|') = 0
  )
SELECT path
FROM walk
WHERE start = current
LIMIT 1;
"#;

    let mut stmt = conn.prepare(sql).ok()?;
    let path: Option<String> = stmt.query_row([], |row| row.get(0)).optional().ok()?;
    path.map(|p| p.trim_matches('|').replace('|', " -> "))
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
    let shelved = tasks
        .iter()
        .filter(|t| t.status == TaskStatus::Shelved)
        .count();
    let in_progress = tasks
        .iter()
        .filter(|t| t.status == TaskStatus::InProgress)
        .count();
    let pending = tasks
        .iter()
        .filter(|t| t.status == TaskStatus::Pending)
        .count();
    let remaining = total.saturating_sub(complete + shelved);
    ProgressInfo {
        total,
        complete,
        shelved,
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
    now: DateTime<Local>,
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
        TaskStatus::Shelved => "- **Status**: [-] shelved".to_string(),
    };

    let date = now.format("%Y-%m-%d").to_string();
    let updated_at_line = format!("- **Updated At**: {date}");

    let mut lines: Vec<String> = contents.lines().map(|l| l.to_string()).collect();
    let mut start_idx: Option<usize> = None;
    for (i, line) in lines.iter().enumerate() {
        if heading.is_match(line) {
            start_idx = Some(i);
            break;
        }
    }

    if let Some(start) = start_idx {
        let mut end = lines.len();
        for i in (start + 1)..lines.len() {
            let line = lines[i].as_str();
            if line.starts_with("### ") || line.starts_with("## ") {
                end = i;
                break;
            }
        }

        let mut status_idx: Option<usize> = None;
        let mut updated_idx: Option<usize> = None;
        for i in (start + 1)..end {
            let l = lines[i].trim_start();
            if status_idx.is_none() && l.starts_with("- **Status**:") {
                status_idx = Some(i);
            }
            if updated_idx.is_none() && l.starts_with("- **Updated At**:") {
                updated_idx = Some(i);
            }
        }

        if let Some(i) = status_idx {
            lines[i] = status_line.clone();
        }
        if let Some(i) = updated_idx {
            lines[i] = updated_at_line.clone();
        }

        match (status_idx, updated_idx) {
            (Some(s), None) => {
                // Insert Updated At immediately before Status.
                lines.insert(s, updated_at_line);
            }
            (None, Some(u)) => {
                // Insert Status immediately after Updated At.
                lines.insert(u + 1, status_line);
            }
            (None, None) => {
                // Insert both at the end of the block.
                lines.insert(end, updated_at_line);
                lines.insert(end + 1, status_line);
            }
            (Some(_), Some(_)) => {}
        }
    }

    // Preserve trailing newline behavior similar to TS templates.
    let mut out = lines.join("\n");
    out.push('\n');
    out
}
