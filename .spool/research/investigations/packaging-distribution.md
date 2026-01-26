# Packaging + Distribution Plan

## Goals

- Replace or wrap npm distribution without breaking users.
- Keep behavior stable across platforms.

## Recommended Transition Strategy

1. Publish Rust binaries per platform (GitHub Releases) with checksums.
2. Update the npm package (`@withakay/spool`) to become a thin installer/wrapper:
   - On install, download the correct platform binary
   - Expose a `spool` shim that executes the bundled binary
   - Keep `--help`/`--version` consistent and pass through args

This mirrors common patterns used by tools like ripgrep and biome.

## Avoiding Behavior Drift

- The npm wrapper must not implement business logic.
- All output is produced by the Rust binary.
- The wrapper only handles:
  - locating/downloading the binary
  - executing it with the same argv

## Local Development

- Allow opting into local Rust builds via env var (e.g. `SPOOL_RS_BIN=/path/to/spool`).
- Keep parity tests able to run against both local builds and published artifacts.
