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

Target: >= 85% workspace line coverage once parity tests are in place.
Additional target: >= 85% line coverage for `spool-core` foundation modules.

```bash
cd spool-rs
cargo install cargo-llvm-cov --locked
rustup component add llvm-tools-preview
cargo llvm-cov --workspace

# Fallback deterministic local coverage without cargo plugins.
./scripts/coverage.sh
```
