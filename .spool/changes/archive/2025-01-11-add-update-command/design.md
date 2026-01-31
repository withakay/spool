# Technical Design

## Architecture Decisions

### Simplicity First

- No version tracking - always update when commanded
- Full replacement for Spool-managed files only (e.g., `spool/README.md`)
- Marker-based updates for user-owned files (e.g., `CLAUDE.md`)
- Templates bundled with package - no network required
- Minimal error handling - only check prerequisites

### Template Strategy

- Use existing template utilities
  - `readmeTemplate` from `src/core/templates/readme-template.ts` for `spool/README.md`
  - `TemplateManager.getClaudeTemplate()` for `CLAUDE.md`
- Directory name is fixed to `spool` (from `SPOOL_DIR_NAME`)

### File Operations

- Use async utilities for consistency
  - `FileSystemUtils.writeFile` for `spool/README.md`
  - `FileSystemUtils.updateFileWithMarkers` for `CLAUDE.md`
- No atomic operations needed - users have git
- Check directory existence before proceeding

## Implementation

### Update Command (`src/core/update.ts`)

```typescript
export class UpdateCommand {
  async execute(projectPath: string): Promise<void> {
    const spoolDirName = SPOOL_DIR_NAME;
    const spoolPath = path.join(projectPath, spoolDirName);

    // 1. Check spool directory exists
    if (!await FileSystemUtils.directoryExists(spoolPath)) {
      throw new Error(`No Spool directory found. Run 'spool init' first.`);
    }

    // 2. Update README.md (full replacement)
    const readmePath = path.join(spoolPath, 'README.md');
    await FileSystemUtils.writeFile(readmePath, readmeTemplate);

    // 3. Update CLAUDE.md (marker-based)
    const claudePath = path.join(projectPath, 'CLAUDE.md');
    const claudeContent = TemplateManager.getClaudeTemplate();
    await FileSystemUtils.updateFileWithMarkers(
      claudePath,
      claudeContent,
      SPOOL_MARKERS.start,
      SPOOL_MARKERS.end
    );

    // 4. Success message (ASCII-safe, checkmark optional by terminal)
    console.log('Updated Spool instructions');
  }
}
```

## Why This Approach

### Benefits

- **Dead simple**: ~40 lines of code total
- **Fast**: No version checks, minimal parsing
- **Predictable**: Same result every time; idempotent
- **Maintainable**: Reuses existing utilities

### Trade-offs Accepted

- No version tracking (unnecessary complexity)
- Full overwrite only for Spool-managed files
- Marker-managed updates for user-owned files

## Error Handling

Only handle critical errors:

- Missing `spool` directory → throw error handled by CLI to present a friendly message
- File write failures → let errors bubble up to CLI

## Testing Strategy

Manual smoke tests are sufficient initially:

1. Run `spool init` in a test project
1. Modify both files (including custom content around markers in `CLAUDE.md`)
1. Run `spool update`
1. Verify `spool/README.md` fully replaced; `CLAUDE.md` Spool block updated without altering user content outside markers
1. Run the command twice to verify idempotency and no duplicate markers
1. Test with missing `spool` directory (expect failure)
