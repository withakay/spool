# Tasks: Homebrew Release

## Prerequisites

- [x] Verify 005-03_ci-cross-platform-releases produces macOS artifacts (both arm64 and x86_64)
- [x] Ensure GitHub releases include source tarballs (auto-generated at `archive/refs/tags/vX.Y.Z.tar.gz`)

## Tap Repository Setup

- [x] Create `withakay/homebrew-spool` repository on GitHub (must be named `homebrew-spool` for short-form tap)
- [x] Run `brew tap-new withakay/homebrew-spool` locally to generate scaffold
- [x] Push scaffold to GitHub: `cd /opt/homebrew/Library/Taps/withakay/homebrew-spool && git push`
- [x] Add README.md with installation instructions

## Formula Implementation

Create `Formula/spool.rb`:
- [x] Use `brew create <tarball-url> --tap withakay/homebrew-spool --set-name spool` as starting point
- [x] Reference source tarball URL: `https://github.com/withakay/spool/archive/refs/tags/vX.Y.Z.tar.gz`
- [ ] Compute SHA256 of tarball for formula (will be auto-updated on first release)
- [x] Add `livecheck` block for automatic version discovery
- [x] Add test block with HEAD/stable build detection
- [x] Run `brew style withakay/spool` to verify formula syntax (passes except placeholder SHA256)
- [x] Test local install: `brew install --HEAD spool` works, `brew test spool` passes

## Release Automation

Create `.github/workflows/update-homebrew.yml` in **main spool repo**:
- [ ] Create GitHub PAT with `Content: Write` permission on `withakay/homebrew-spool`
- [ ] Add PAT as `HOMEBREW_TAP_TOKEN` secret in spool repository
- [x] Create workflow triggered on release publish (not tag push)
- [x] Workflow steps: checkout tap, download tarball, compute SHA256, update formula, commit to main
- [x] Configure git user for commits (use GitHub Actions bot or custom bot account)
- [ ] Test workflow with a test release

Reference implementation: [searlsco/imsg workflow](https://github.com/searlsco/imsg/blob/main/.github/workflows/update_homebrew_formula.yml)

## Documentation

- [x] Update main README.md with Homebrew installation instructions:
  ```bash
  brew tap withakay/spool
  brew install spool
  ```
- [ ] Add Homebrew section to any existing install docs

## Validation

- [ ] Test `brew tap withakay/spool && brew install spool` on Apple Silicon
- [ ] Test `brew tap withakay/spool && brew install spool` on Intel Mac (or CI)
- [ ] Test `brew update && brew upgrade spool` after a version bump
- [ ] Verify `brew test spool` passes
