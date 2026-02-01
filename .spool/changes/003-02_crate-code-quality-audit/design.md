# Design: Crate Code Quality Audit

## Approach

Each crate will be processed through a 3-phase workflow:

### Phase 1: Code Simplification
- Use @code-simplifier agent to review each source file
- Focus on clarity, consistency, maintainability
- Apply rust-style skill guidelines
- Preserve all existing functionality

### Phase 2: Test Coverage Analysis
- Run `cargo llvm-cov` per crate to identify uncovered code
- Prioritize tests for:
  - Public APIs
  - Error handling paths
  - Edge cases in core logic
- Target: 80%+ line coverage per crate

### Phase 3: Test Deduplication
- Identify tests covering the same code paths
- Keep the most comprehensive/clear test
- Remove redundant tests that add no value

## Crate Processing Order

Process crates from leaf dependencies to root:
1. `spool-fs` (standalone, already at 94.6%)
2. `spool-logging` (standalone, already at 80.3%)
3. `spool-test-support` (test utility, already at 90.5%)
4. `spool-schemas` (low deps)
5. `spool-templates` (depends on fs)
6. `spool-harness` (needs tests, 0% coverage)
7. `spool-workflow` (complex, needs coverage boost)
8. `spool-core` (largest, most deps)
9. `spool-cli` (top-level, integration-heavy)

## Verification

After each crate:
```bash
cargo fmt --check -p <crate>
cargo clippy -p <crate> -- -D warnings
cargo test -p <crate>
cargo llvm-cov -p <crate> --summary-only
```

## Out of Scope

- Feature changes
- API modifications
- Dependency updates (unless required for testing)
