# Add Init Command for Projector

## Why

Projects need a simple way to adopt Projector conventions. Currently, users must manually create the directory structure and understand all the conventions, which creates friction for adoption. An init command would enable instant Projector setup with proper structure and guidance.

## What Changes

- Add `projector init` CLI command that creates the complete Projector directory structure
- Generate template files (README.md with AI instructions, project.md template)
- Interactive prompt to select which AI tools to configure (Claude Code initially, others marked as "coming soon")
- Support for multiple AI coding assistants with extensible plugin architecture
- Smart file updates using content markers to preserve existing configurations
- Custom directory naming with `--dir` flag
- Validation to prevent overwriting existing Projector structures
- Clear error messages with helpful guidance (e.g., suggesting 'projector update' for existing structures)
- Display actionable next steps after successful initialization

### Breaking Changes
- None - this is a new feature

## Impact

- Affected specs: None (new feature)
- Affected code: 
  - src/cli/index.ts (add init command)
  - src/core/init.ts (new - initialization logic)
  - src/core/templates/ (new - template files)
  - src/core/configurators/ (new - AI tool plugins)
  - src/utils/file-system.ts (new - file operations)