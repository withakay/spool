# spool-rs

Rust port of Spool.

## Development

```bash
cd spool-rs
cargo test --workspace
cargo fmt --check
cargo clippy --workspace -- -D warnings
```

## Packaging + Transition Plan

Spool is distributed as a Rust binary.

Distribution approach:

- Publish platform-specific Rust release archives via GitHub Releases (with SHA-256 checksums)
- Support local developer installs via `make rust-install`

Initial release target matrix:

- `x86_64-apple-darwin`
- `aarch64-apple-darwin`
- `x86_64-unknown-linux-gnu`
- `aarch64-unknown-linux-gnu`
- `x86_64-pc-windows-msvc`

Artifact naming:

- `spool-vX.Y.Z-<target>.tar.gz` (Windows: `.zip`)
- `spool-vX.Y.Z-<target>.sha256`

Build commands (per platform job):

```bash
cd spool-rs
cargo build -p spool-cli --release

# linux/macos
tar -C target/release -czf "spool-v${VERSION}-${TARGET}.tar.gz" spool
shasum -a 256 "spool-v${VERSION}-${TARGET}.tar.gz" > "spool-v${VERSION}-${TARGET}.sha256"

# windows
powershell -Command "Compress-Archive -Path target/release/spool.exe -DestinationPath spool-v${env:VERSION}-${env:TARGET}.zip"
powershell -Command "Get-FileHash spool-v${env:VERSION}-${env:TARGET}.zip -Algorithm SHA256 | Format-List" > spool-v${env:VERSION}-${env:TARGET}.sha256
```

Optional developer install:

```bash
make rust-install
spool --version
```

## Coverage

Targets:

- Long-term: >= 85% workspace line coverage once parity tests are in place.
- Long-term: >= 85% workspace line coverage once core functionality is in place.
- Near-term: >= 80% line coverage for `spool-core` create/status logic.
- Near-term: >= 80% line coverage for `spool-core` ralph runner/state logic.
- Additional: >= 85% line coverage for `spool-core` foundation modules.

Current (from `cargo llvm-cov --workspace`):

- `spool-core/src/create/mod.rs`: 62.33% lines
- `spool-core/src/ralph/prompt.rs`: 61.60% lines
- `spool-core/src/ralph/runner.rs`: 50.85% lines
- `spool-core/src/ralph/state.rs`: 37.18% lines
- `spool-core/src/workflow/mod.rs`: 70.87% lines

```bash
cd spool-rs
cargo install cargo-llvm-cov --locked
rustup component add llvm-tools-preview
cargo llvm-cov --workspace

# Fallback deterministic local coverage without cargo plugins.
./scripts/coverage.sh
```

## Release Verification Checklist

Binary (per platform):

```bash
./spool --version
./spool --help
./spool validate --help
```

Checksum:

```bash
shasum -a 256 -c spool-vX.Y.Z-<target>.sha256
```
