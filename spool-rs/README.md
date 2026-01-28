# spool-rs

Rust port of Spool.

## Development

```bash
cd spool-rs
cargo test --workspace
cargo fmt --check
cargo clippy --workspace -- -D warnings
```

## Coverage

Targets:
- Long-term: >= 85% workspace line coverage once parity tests are in place.
- Near-term: >= 80% line coverage for `spool-core` create/status logic.
- Additional: >= 85% line coverage for `spool-core` foundation modules.

Current (from `cargo llvm-cov --workspace`):
- `spool-core/src/create/mod.rs`: 62.33% lines
- `spool-core/src/workflow/mod.rs`: 70.87% lines

```bash
cd spool-rs
cargo install cargo-llvm-cov --locked
rustup component add llvm-tools-preview
cargo llvm-cov --workspace

# Fallback deterministic local coverage without cargo plugins.
./scripts/coverage.sh
```
