# Tasks: Homebrew Release

## Prerequisites

- [ ] Verify 005-03_ci-cross-platform-releases produces macOS artifacts (both arm64 and x86_64)

## Tap Repository Setup

- [ ] Create `withakay/homebrew-spool` repository on GitHub
- [ ] Add README.md with installation instructions
- [ ] Create `Formula/spool.rb` with initial formula (use placeholder SHA256s)

## Formula Implementation

- [ ] Add architecture-specific URL blocks (on_arm, on_intel)
- [ ] Add SHA256 checksums from latest release artifacts
- [ ] Add test block that verifies `spool --version`
- [ ] Test local install with `brew install --build-from-source ./Formula/spool.rb`

## Release Automation

- [ ] Create GitHub PAT with repo scope for tap repository
- [ ] Add PAT as `HOMEBREW_TAP_TOKEN` secret in spool repository
- [ ] Create `.github/workflows/update-homebrew.yml` workflow
- [ ] Test workflow with a test release

## Documentation

- [ ] Update main README.md with Homebrew installation instructions
- [ ] Add Homebrew section to any existing install docs

## Validation

- [ ] Test `brew tap withakay/spool && brew install spool` on Apple Silicon
- [ ] Test `brew tap withakay/spool && brew install spool` on Intel Mac (or CI)
- [ ] Test `brew upgrade spool` after a version bump
- [ ] Verify `brew test spool` passes
