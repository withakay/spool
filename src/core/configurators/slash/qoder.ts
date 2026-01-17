import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

/**
 * File paths for Qoder slash commands
 * Maps each Projector workflow stage to its command file location
 * Commands are stored in .qoder/commands/projector/ directory
 */
const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  // Create and validate new change proposals
  proposal: '.qoder/commands/projector/proposal.md',
  
  // Implement approved changes with task tracking
  apply: '.qoder/commands/projector/apply.md',
  
  // Archive completed changes and update specs
  archive: '.qoder/commands/projector/archive.md'
};

/**
 * YAML frontmatter for Qoder slash commands
 * Defines metadata displayed in Qoder's command palette
 * Each command is categorized and tagged for easy discovery
 */
const FRONTMATTER: Record<CoreSlashCommandId, string> = {
  proposal: `---
name: Projector: Proposal
description: Scaffold a new Projector change and validate strictly.
category: Projector
tags: [projector, change]
---`,
  apply: `---
name: Projector: Apply
description: Implement an approved Projector change and keep tasks in sync.
category: Projector
tags: [projector, apply]
---`,
  archive: `---
name: Projector: Archive
description: Archive a deployed Projector change and update specs.
category: Projector
tags: [projector, archive]
---`
};

/**
 * Qoder Slash Command Configurator
 * 
 * Manages Projector slash commands for Qoder AI assistant.
 * Creates three workflow commands: proposal, apply, and archive.
 * Uses colon-separated command format (/projector:proposal).
 * 
 * @extends {SlashCommandConfigurator}
 */
export class QoderSlashCommandConfigurator extends SlashCommandConfigurator {
  /** Unique identifier for Qoder tool */
  readonly toolId = 'qoder';
  
  /** Indicates slash commands are available for this tool */
  readonly isAvailable = true;

  /**
   * Get relative file path for a slash command
   * 
   * @param {SlashCommandId} id - Command identifier (proposal, apply, or archive)
   * @returns {string} Relative path from project root to command file
   */
  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  /**
   * Get YAML frontmatter for a slash command
   *
   * Frontmatter defines how the command appears in Qoder's UI,
   * including display name, description, and categorization.
   *
   * @param {SlashCommandId} id - Command identifier (proposal, apply, or archive)
   * @returns {string} YAML frontmatter block with command metadata
   */
  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id as CoreSlashCommandId];
  }
}