## Context

- The repo already exposes Rust linting via `make lint` (currently `cargo fmt --check` and `cargo clippy ... -D warnings`).
- There is no repo-wide pre-commit configuration today.
- prek is a drop-in replacement for pre-commit and can run an existing `.pre-commit-config.yaml` unchanged.

## Goals / Non-Goals

**Goals:**
- Provide a single, documented local entrypoint for pre-commit checks via `prek`.
- Add common quality gates for Rust + Markdown/JSON/YAML + whitespace/line endings.
- Define a clippy policy that is consistent, intentional, and aligned with this repo's Rust style expectations.
- Keep the workflow reproducible across contributors and CI.

**Non-Goals:**
- Redesign the Rust codebase to satisfy every possible lint (the policy should be curated; local `allow` is acceptable when justified).
- Require editors/IDEs to be configured a certain way (we rely on repo hooks + CLI entrypoints).

## Decisions

- **Use `.pre-commit-config.yaml` as the source config**: prek can run pre-commit configs unchanged, which keeps the ecosystem of existing hooks available and lowers migration cost.
- **Prefer repo-local hook entrypoints for Rust**: run `cargo fmt` / `cargo clippy` directly so the hook behavior matches `make lint` and workspace structure.
- **Curated clippy policy**: enable additional clippy lint groups selectively (rather than blanket-enabling `clippy::restriction`) and document the rationale + escape hatches (`#[allow(...)]`).
- **Keep "fast" checks in pre-commit**: avoid overly slow checks on every commit; consider heavier checks in CI or pre-push if needed.

## Risks / Trade-offs

- [More tooling for contributors] → Provide clear install/run docs (`prek run`, `prek install`) and keep configs minimal.
- [Hook runtime becomes slow] → Keep hook set curated; consider running clippy on staged files only where feasible, or moving expensive checks to CI/pre-push.
- [Lint policy churn/noise] → Start with a small, high-signal clippy set; document how to add/remove lints.

## Migration Plan

1. Add `.pre-commit-config.yaml` and document `prek` usage.
2. Add/adjust make targets (optional) to run the same checks.
3. (Optional) Update CI to run `prek run --all-files` (or equivalent) so CI matches local hooks.

## Open Questions

- Which formatter to use for Markdown/JSON/YAML (e.g., Prettier via pre-commit mirror vs a Rust-native formatter), balancing dependency footprint and consistency.
- Which additional clippy lint groups/lints to enable beyond the current `-D warnings` baseline.
