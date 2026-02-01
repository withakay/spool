# Tasks for: 013-05_distribution-fetch-mechanics

## Execution Notes

- **Tool**: Any
- **Mode**: Sequential
- **Created**: 2026-01-31
- **Rust**: Implementation MUST follow the `rust-style` skill

```bash
spool tasks status 013-05_distribution-fetch-mechanics
spool tasks next 013-05_distribution-fetch-mechanics
spool tasks start 013-05_distribution-fetch-mechanics 1.1
spool tasks complete 013-05_distribution-fetch-mechanics 1.1
spool tasks show 013-05_distribution-fetch-mechanics
```

______________________________________________________________________

## Wave 1

- **Depends On**: None

### Task 1.1: Implement spool-skills fetch + cache with local-dev fallback

- **Files**: `spool-rs/crates/spool-core/src/installers/`, `.spool/changes/013-05_distribution-fetch-mechanics/design.md`
- **Dependencies**: None
- **Action**:
  - Implement a fetcher that can retrieve raw files from GitHub:
    - Tagged: `https://raw.githubusercontent.com/withakay/spool/<tag>/spool-skills/<path>`
    - Fallback: `https://raw.githubusercontent.com/withakay/spool/main/spool-skills/<path>`
  - Add per-user cache:
    - `~/.config/spool/cache/spool-skills/<tag>/<path>`
  - Add dev-mode source:
    - If `./spool-skills/` exists in repo root, copy from there instead of HTTP.
  - Encode the per-tool file manifests (OpenCode/Claude/Codex) as data (not ad-hoc logic).
  - Apply the `rust-style` skill for all Rust changes (formatting, structure, naming).
- **Verify**: `make test`
- **Done When**: Fetcher can source from local repo or remote, with caching
- **Updated At**: 2026-01-31
- **Status**: [x] complete

### Task 1.2: Wire install into `spool init` and refresh into `spool update`

- **Files**: `spool-rs/crates/spool-cli/`, `spool-rs/crates/spool-core/src/installers/`
- **Dependencies**: Task 1.1
- **Action**:
  - Extend `spool init` to accept `--tools opencode,claude,codex` and install selected adapter files.
  - Extend `spool update` to refresh the managed adapter files.
  - Ensure both are idempotent and safe.
- **Verify**: `make test`
- **Done When**: `spool init --tools ...` and `spool update` install/refresh adapters consistently
- **Updated At**: 2026-01-31
- **Status**: [x] complete

______________________________________________________________________

## Checkpoints

### Checkpoint: Review Implementation

- **Type**: checkpoint (requires human approval)
- **Files**: `.spool/changes/013-05_distribution-fetch-mechanics/proposal.md`, `.spool/changes/013-05_distribution-fetch-mechanics/design.md`
- **Dependencies**: None
- **Action**: Review cache location, URL scheme, and tool-specific destinations
- **Done When**: User confirms implementation is correct
- **Updated At**: 2026-01-31
- **Status**: [x] completed
