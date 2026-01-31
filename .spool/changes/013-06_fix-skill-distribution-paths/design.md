## Context

The spool-skills distribution system currently has three problems:

1. **Wrong path structure**: Skills are placed in `.opencode/skills/spool-skills/<skill>/` but the agentskills.io spec requires a flat structure: `.opencode/skills/<skill>/`
2. **Missing prefix**: Skills aren't namespaced, risking collision with user skills
3. **Single harness support**: Only OpenCode receives skills; Claude and Codex harnesses are not supported

The distribution code lives in `spool-rs/crates/spool-core/src/distribution.rs`. Skills are read from embedded template assets at `spool-rs/crates/spool-templates/assets/default/home/.opencode/skills/spool-skills/`.

## Goals / Non-Goals

**Goals:**

- Fix skill paths to use flat structure: `skills/spool-<name>/` instead of `skills/spool-skills/<name>/`
- Add `spool-` prefix to all skill names for namespacing
- Distribute skills to all three harnesses: OpenCode, Claude, Codex
- Update documentation to remove symlink instructions

**Non-Goals:**

- Cleaning up old nested skill paths from user systems (document manual cleanup)
- Supporting skill-specific harness customization (all harnesses get identical skills)
- Adding new skills or modifying skill content

## Decisions

### 1. Skill naming: `spool-<original-name>`

**Decision**: Prefix all skill names with `spool-` (e.g., `brainstorming` → `spool-brainstorming`)

**Rationale**:
- Avoids namespace collision with user-defined skills
- Clear provenance - users know these came from spool
- Consistent with similar tools' conventions

**Alternatives considered**:
- No prefix: Risk of collision
- Different prefix (e.g., `sp-`): Less clear, inconsistent with project naming

### 2. Embedded template asset restructure

**Decision**: Move embedded assets from `.opencode/skills/spool-skills/<skill>/` to `.opencode/skills/spool-<skill>/`

**Rationale**:
- Assets define the installed structure
- Single source of truth for skill paths
- Enables reuse across harnesses with path transformation

**Files affected**:
- `spool-rs/crates/spool-templates/assets/default/home/.opencode/skills/spool-skills/*` → `spool-rs/crates/spool-templates/assets/default/home/.opencode/skills/spool-*`

### 3. Path transformation in distribution code

**Decision**: Modify `opencode_spool_skills_file_paths()` to:
1. Read skills from embedded assets under `.opencode/skills/`
2. Filter for paths starting with `spool-` prefix
3. Map directly to destination without intermediate subfolder

**Code change**: In `distribution.rs`:
```rust
// Before: config_dir.join("skills").join("spool-skills").join(rel)
// After:  config_dir.join("skills").join(rel)
```

### 4. Multi-harness skill distribution

**Decision**: Add skill distribution to `claude_manifests()` and `codex_manifests()` functions

**Implementation**:
- Read the same OpenCode skill assets
- Transform paths for each harness:
  - OpenCode: `~/.config/opencode/skills/spool-<skill>/`
  - Claude: `~/.claude/skills/spool-<skill>/`
  - Codex: `~/.codex/skills/spool-<skill>/`
- Use identical skill content across all harnesses (no harness-specific customization)

### 5. Documentation update

**Decision**: Rewrite `spool-skills/docs/README.opencode.md` to:
- Remove all symlink instructions
- Document the flat `spool-<skill>` structure
- Explain that skills are auto-installed via `spool dist install`

## Risks / Trade-offs

**[Risk] Existing users have old nested paths** → Document manual cleanup: `rm -rf ~/.config/opencode/skills/spool-skills/`

**[Risk] Breaking change for skill references** → Skills referenced by old paths will fail. This is acceptable as the old paths were non-compliant.

**[Trade-off] Duplicated skills across harnesses** → More disk space but simpler implementation and consistent behavior

**[Trade-off] No harness-specific skill customization** → Reduces complexity; can be added later if needed

## Migration Plan

1. Update embedded templates (move and rename skill folders)
2. Update `distribution.rs` with new path logic
3. Update `README.opencode.md` documentation
4. Users run `spool dist install` to get new paths
5. Document cleanup of old paths in release notes
