# Change: Homebrew Release

## Why

Users on macOS expect to install CLI tools via Homebrew (`brew install spool`). Currently Spool can only be installed via GitHub Releases or building from source. Adding Homebrew support provides a familiar, auto-updating installation experience for the largest segment of macOS developers.

## What Changes

- Create a Homebrew tap repository (`homebrew-spool`) with a formula for the `spool` CLI
- Add GitHub Actions workflow to automatically update the formula on new releases
- Document Homebrew installation in project README and installation docs
- Support both Intel (x86_64) and Apple Silicon (arm64) architectures

## Capabilities

### New Capabilities

- `homebrew-formula`: Homebrew formula definition for spool, supporting macOS x86_64 and arm64 architectures with automatic version updates on release

### Modified Capabilities

<!-- None - this is a new distribution channel, not a change to existing spec behavior -->

## Impact

- **New repository**: Requires creating `withakay/homebrew-spool` tap repository
- **CI/CD**: Adds workflow to update formula SHA256 checksums on release
- **Dependencies**: Relies on `005-03_ci-cross-platform-releases` for release artifacts
- **Documentation**: README and install docs need Homebrew instructions
