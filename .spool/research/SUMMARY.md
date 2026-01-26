# Rust Port Research Summary

## Key Findings

- The Rust port must treat the current TypeScript `spool` CLI as the behavior
  oracle and verify parity via tests, not interpretation.
- Build a parity harness early that compares stdout, stderr, exit code, and
  filesystem side effects.
- Interactive flows require PTY-driven tests to validate prompt rendering and
  selection behavior.

## Stack Recommendations

- CLI parsing: `clap` (stable, widely used, good help generation)
- Errors/diagnostics: `thiserror` + `miette` (human-friendly) with a stable
  user-facing message layer
- JSON/YAML: `serde`, `serde_json`, `serde_yaml`
- Color/terminal output: `anstream` + `anstyle` (integrates well with clap)
- Prompts: `inquire` or `dialoguer` (validate multi-select + non-interactive)
- Spinners/progress: `indicatif` (TTY-aware; can be disabled)
- Testing: `assert_cmd`, `insta`, `tempfile`, plus PTY driver (`expectrl` or
  `portable-pty`)

## Feature / Command Parity Priorities

1. Non-mutating commands: `--help`, `--version`, `list`, `show`, `validate`
2. Mutating installers: `init`, `update` (byte-for-byte output)
3. Artifact workflow: `status`, `instructions`, `templates`, `create`
4. Interactive orchestration: `ralph`/`loop` (PTY, state files)
5. Packaging + transition plan

## Architecture Considerations

- Prefer a Cargo workspace with a thin CLI crate and testable libraries.
- Keep side effects (filesystem, env, process exec, TTY) behind traits.
- Render user-facing output from pure functions where possible for stable
  snapshots.

## Pitfalls To Avoid

- Normalizing outputs too aggressively (hides drift).
- Diverging template content or marker-managed blocks.
- Letting interactive code paths differ from non-interactive flags/env.

## Roadmap Implications

- The parity harness is the gate for every ported command.
- The Rust implementation should land command-by-command with parity tests
  covering the same fixtures.
