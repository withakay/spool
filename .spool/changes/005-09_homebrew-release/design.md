# Design: Homebrew Release

## Overview

This design covers creating a Homebrew tap for distributing spool to macOS users. The approach uses a separate tap repository with pre-built binaries from GitHub Releases, with automated formula updates on each release.

## Components

### 1. Tap Repository Structure

Create `withakay/homebrew-spool` repository:

```
homebrew-spool/
  Formula/
    spool.rb          # Main formula
  README.md           # Installation instructions
```

### 2. Formula Design

The formula uses Homebrew's `on_arm` and `on_intel` blocks for architecture-specific URLs:

```ruby
class Spool < Formula
  desc "Structured change proposal workflow for AI-assisted development"
  homepage "https://github.com/withakay/spool"
  version "0.4.0"
  license "MIT"

  on_arm do
    url "https://github.com/withakay/spool/releases/download/v#{version}/spool-aarch64-apple-darwin.tar.gz"
    sha256 "PLACEHOLDER_ARM64_SHA256"
  end

  on_intel do
    url "https://github.com/withakay/spool/releases/download/v#{version}/spool-x86_64-apple-darwin.tar.gz"
    sha256 "PLACEHOLDER_X86_64_SHA256"
  end

  def install
    bin.install "spool"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/spool --version")
  end
end
```

### 3. Release Automation Workflow

Add `.github/workflows/update-homebrew.yml` to the **spool repository** (not the tap):

```yaml
name: Update Homebrew Formula

on:
  release:
    types: [published]

jobs:
  update-formula:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for release assets
        run: sleep 60  # Give time for release assets to upload

      - name: Update Homebrew formula
        uses: mislav/bump-homebrew-formula-action@v3
        with:
          formula-name: spool
          homebrew-tap: withakay/homebrew-spool
          download-url: https://github.com/withakay/spool/releases/download/${{ github.ref_name }}/spool-x86_64-apple-darwin.tar.gz
        env:
          COMMITTER_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

**Alternative: Manual script approach**

If the action doesn't handle dual-architecture well, use a script:

```yaml
- name: Get release info
  id: release
  run: |
    VERSION="${GITHUB_REF_NAME#v}"
    echo "version=$VERSION" >> $GITHUB_OUTPUT

    # Download and hash both architectures
    curl -sL "https://github.com/withakay/spool/releases/download/$GITHUB_REF_NAME/spool-aarch64-apple-darwin.tar.gz" -o arm64.tar.gz
    curl -sL "https://github.com/withakay/spool/releases/download/$GITHUB_REF_NAME/spool-x86_64-apple-darwin.tar.gz" -o x86_64.tar.gz

    echo "sha256_arm64=$(sha256sum arm64.tar.gz | cut -d' ' -f1)" >> $GITHUB_OUTPUT
    echo "sha256_x86_64=$(sha256sum x86_64.tar.gz | cut -d' ' -f1)" >> $GITHUB_OUTPUT

- name: Checkout tap
  uses: actions/checkout@v4
  with:
    repository: withakay/homebrew-spool
    token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
    path: tap

- name: Update formula
  run: |
    cd tap
    cat > Formula/spool.rb << 'EOF'
    # Generated formula content with updated version and SHA256s
    EOF

- name: Commit and push
  run: |
    cd tap
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add Formula/spool.rb
    git commit -m "Update spool to ${{ steps.release.outputs.version }}"
    git push
```

### 4. Required Secrets

- `HOMEBREW_TAP_TOKEN`: A GitHub Personal Access Token with `repo` scope for the tap repository

### 5. Documentation Updates

Update `README.md` and/or create `docs/install.md`:

```markdown
## Installation

### Homebrew (macOS)

```bash
brew tap withakay/spool
brew install spool
```

### GitHub Releases

Download the latest release for your platform from [GitHub Releases](https://github.com/withakay/spool/releases).

### From Source

```bash
cargo install --path spool-rs/crates/spool-cli
```
```

## Dependencies

- Requires `005-03_ci-cross-platform-releases` to be complete (provides the release artifacts)
- Requires GitHub Personal Access Token with repo access to the tap repository

## Alternatives Considered

### Homebrew Core

Publishing to homebrew-core (official Homebrew repository) requires:
- Significant user base/popularity
- Stricter review process
- No control over update timing

Starting with a tap is simpler and gives full control. Can migrate to homebrew-core later if warranted.

### Building from Source in Formula

Could use a formula that builds from source instead of downloading binaries:
- Pro: No need to maintain release artifacts
- Con: Requires Rust toolchain, slower installs, build failures

Pre-built binaries are preferred for user experience.

## Testing Plan

1. Create tap repository manually first to test formula locally
2. Test installation on both Intel and Apple Silicon Macs
3. Verify `brew upgrade spool` works correctly
4. Test the automation workflow with a test release
