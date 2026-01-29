# Packaging + Distribution Plan

## Goals

- Replace or wrap npm distribution without breaking users.
- Keep behavior stable across platforms.

Non-goals for this document:
- Implement release automation (this doc is the plan).
- Change CLI behavior (Rust remains parity-driven).

## Recommended Transition Strategy

1. Publish Rust binaries per platform (GitHub Releases) with checksums.
2. Update the npm package (`@withakay/spool`) to become a thin installer/wrapper:
   - On install, download the correct platform binary (or use a locally supplied binary)
   - Expose a `spool` shim that executes the downloaded binary
   - Pass through argv verbatim; `--help`/`--version` output comes from the Rust binary
   - If a platform is unsupported, fail with a clear error and optional TS fallback (during transition)

This mirrors common patterns used by tools like ripgrep and biome.

## Avoiding Behavior Drift

- The npm wrapper must not implement business logic.
- All output is produced by the Rust binary.
- The wrapper only handles:
  - locating/downloading the binary
  - executing it with the same argv

During transition, the wrapper MAY implement a narrow fallback:
- If a platform binary is not available, the wrapper MAY delegate to the TS CLI (if present) while preserving output shape.
- The fallback is opt-in or clearly messaged, and removed once the Rust platform matrix is complete.

## Platform Matrix

Initial supported targets (release artifacts):
- `x86_64-apple-darwin`
- `aarch64-apple-darwin`
- `x86_64-unknown-linux-gnu`
- `aarch64-unknown-linux-gnu`
- `x86_64-pc-windows-msvc`

Note: additional targets (musl, armv7) can be added later; the npm wrapper should surface an actionable error for unsupported targets.

## Artifact Names + Contents

Release artifacts are published under GitHub Releases for the corresponding tag `vX.Y.Z`.

Per target:
- Archive name: `spool-vX.Y.Z-<target>.tar.gz` (Windows: `.zip`)
- Archive contents:
  - `spool` (or `spool.exe` on Windows)
  - `LICENSE` (optional)

Checksums:
- `spool-vX.Y.Z-<target>.sha256` (text file containing `sha256  <archive>`)
- Optional aggregated `sha256sums.txt`

## Versioning + Pinning

- Git tag `vX.Y.Z` is the source of truth.
- Rust binary version (via `--version`) matches `X.Y.Z`.
- npm wrapper version matches `X.Y.Z` and pins the exact GitHub Release artifact.
- The npm wrapper verifies:
  - archive checksum (SHA-256)
  - extracted binary name and executability

## npm Wrapper Mechanics

Shape:
- Keep publishing to `@withakay/spool`.
- `package.json` exposes `bin: { "spool": "./bin/spool.js" }`.

Install-time behavior:
- `postinstall` determines platform target mapping:
  - Node: `process.platform` + `process.arch`
  - Map to Rust target triple (see Platform Matrix)
- Compute download URLs:
  - `https://github.com/withakay/spool/releases/download/vX.Y.Z/spool-vX.Y.Z-<target>.tar.gz`
  - checksum: same prefix with `.sha256`
- Download to a cache directory inside the package, e.g. `node_modules/@withakay/spool/dist/`.
- Verify checksum, extract, mark executable, and write a small marker file with installed version/target.

Runtime shim behavior (`bin/spool.js`):
- Resolve the installed binary path and `spawn` it.
- Pass through argv verbatim; exit code is the binary exit code.
- All stdout/stderr are streamed from the binary.

Opt-in local override for development:
- `SPOOL_RS_BIN=/abs/path/to/spool` causes the shim to run that binary instead of the downloaded one.

## CI Build + Release Plan (Documented)

Build job matrix (GitHub Actions):
- `runs-on: macos-14` for `aarch64-apple-darwin`
- `runs-on: macos-13` for `x86_64-apple-darwin`
- `runs-on: ubuntu-latest` for `x86_64-unknown-linux-gnu` and `aarch64-unknown-linux-gnu` (native or cross)
- `runs-on: windows-latest` for `x86_64-pc-windows-msvc`

Commands (per job):
```bash
cd spool-rs
cargo build -p spool-cli --release

# Package
# linux/macos
tar -C target/release -czf "spool-v${VERSION}-${TARGET}.tar.gz" spool
shasum -a 256 "spool-v${VERSION}-${TARGET}.tar.gz" > "spool-v${VERSION}-${TARGET}.sha256"

# windows
powershell -Command "Compress-Archive -Path target/release/spool.exe -DestinationPath spool-v${env:VERSION}-${env:TARGET}.zip"
powershell -Command "Get-FileHash spool-v${env:VERSION}-${env:TARGET}.zip -Algorithm SHA256 | Format-List" > spool-v${env:VERSION}-${env:TARGET}.sha256
```

Release job:
- Collect artifacts from matrix jobs
- Attach artifacts + checksums to GitHub Release `vX.Y.Z`

npm publish job:
- Build/publish the wrapper package at version `X.Y.Z`
- Wrapper downloads artifacts from the GitHub Release for `vX.Y.Z`

## Verification Checklist

Binary verification (per platform):
```bash
./spool --version
./spool --help
./spool validate --help
```

Checksum verification:
```bash
shasum -a 256 -c spool-vX.Y.Z-<target>.sha256
```

npm wrapper verification:
```bash
npm i -g @withakay/spool@X.Y.Z
spool --version
spool --help
```

Completion verification:
- Run the install command for completions (once the Rust port includes it) and verify a shell session can tab-complete `spool`.

## Local Development

- Allow opting into local Rust builds via env var (e.g. `SPOOL_RS_BIN=/path/to/spool`).
- Keep parity tests able to run against both local builds and published artifacts.
