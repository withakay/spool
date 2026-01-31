# Change: CI cross-platform releases

## Why

Spool currently has CI to build/test, but it does not publish user-installable binaries. We want a repeatable release pipeline that produces verified cross-platform artifacts and enables copy/paste installation.

## What Changes

- Add a GitHub Actions release workflow that builds and tests `spool-rs` and then publishes cross-platform binaries to GitHub Releases.
- Produce artifacts for macOS, Linux, and Windows (x86_64, plus ARM where feasible) with checksums.
- Define a lightweight versioning/release process (tag-driven) so releases are tied to a specific `spool-rs` version.
- Add an installer script for macOS and Linux so users can `curl | sh` to install the correct binary for their OS/arch.
- Document the supported install methods and release procedure.

## Capabilities

### New Capabilities

- `release-artifacts`: Build and publish verified, cross-platform `spool` binaries as GitHub Release assets.
- `curl-installer`: Provide a macOS/Linux install script that downloads the right release artifact and installs `spool`.

### Modified Capabilities

<!-- None -->

## Impact

- GitHub workflows: add/update release workflow(s) under `.github/workflows/`.
- Rust build/release tooling: may introduce release-oriented configuration and scripts.
- Distribution surface area: GitHub Releases become a first-class install source for Spool.
- Docs: installation instructions and release process documentation need updates.
