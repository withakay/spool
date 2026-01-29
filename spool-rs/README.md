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

Spool is transitioning from a TypeScript npm distribution (`@withakay/spool`) to a Rust binary.

Chosen distribution approach:
- Publish platform-specific Rust release archives via GitHub Releases (with SHA-256 checksums)
- Keep publishing `@withakay/spool` as a thin npm wrapper that downloads the correct binary and exposes the `spool` command

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

npm wrapper behavior (`@withakay/spool`):
- `postinstall` downloads `spool-vX.Y.Z-<target>` from GitHub Releases, verifies checksum, extracts to `dist/`
- `bin/spool.js` resolves the installed binary and `spawn`s it, streaming stdout/stderr and preserving exit code
- Optional developer override: `SPOOL_RS_BIN=/abs/path/to/spool`

## Coverage

Targets:
- Long-term: >= 85% workspace line coverage once parity tests are in place.
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

npm wrapper:
```bash
npm i -g @withakay/spool@X.Y.Z
spool --version
spool --help
```
