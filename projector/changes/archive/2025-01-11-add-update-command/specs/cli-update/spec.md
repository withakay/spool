# Update Command Specification

## Purpose

As a developer using Projector, I want to update the Projector instructions in my project when new versions are released, so that I can benefit from improvements to AI agent instructions.

## Core Requirements

### Update Behavior

The update command SHALL update Projector instruction files to the latest templates.

WHEN a user runs `projector update` THEN the command SHALL:
- Check if the `projector` directory exists
- Replace `projector/README.md` with the latest template (complete replacement)
- Update the Projector-managed block in `CLAUDE.md` using markers
  - Preserve user content outside markers
  - Create `CLAUDE.md` if missing
- Display ASCII-safe success message: "Updated Projector instructions"

### Prerequisites

The command SHALL require:
- An existing `projector` directory (created by `projector init`)

IF the `projector` directory does not exist THEN:
- Display error: "No Projector directory found. Run 'projector init' first."
- Exit with code 1

### File Handling

The update command SHALL:
- Completely replace `projector/README.md` with the latest template
- Update only the Projector-managed block in `CLAUDE.md` using markers
- Use the default directory name `projector`
- Be idempotent (repeated runs have no additional effect)

## Edge Cases

### File Permissions
IF file write fails THEN let the error bubble up naturally with file path.

### Missing CLAUDE.md
IF CLAUDE.md doesn't exist THEN create it with the template content.

### Custom Directory Name
Not supported in this change. The default directory name `projector` SHALL be used.

## Success Criteria

Users SHALL be able to:
- Update Projector instructions with a single command
- Get the latest AI agent instructions
- See clear confirmation of the update

The update process SHALL be:
- Simple and fast (no version checking)
- Predictable (same result every time)
- Self-contained (no network required)