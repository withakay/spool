/**
 * Qwen slash command configurator for Projector integration.
 * This class handles the generation of Qwen-specific slash command files
 * in the .qwen/commands directory structure.
 * 
 * @implements {SlashCommandConfigurator}
 */
import { TomlSlashCommandConfigurator } from './toml-base.js';
import { SlashCommandId, CoreSlashCommandId } from '../../templates/index.js';

/**
 * Mapping of slash command IDs to their corresponding file paths in .qwen/commands directory.
 * @type {Record<CoreSlashCommandId, string>}
 */
const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: '.qwen/commands/projector-proposal.toml',
  apply: '.qwen/commands/projector-apply.toml',
  archive: '.qwen/commands/projector-archive.toml'
};

const DESCRIPTIONS: Record<CoreSlashCommandId, string> = {
  proposal: 'Scaffold a new Projector change and validate strictly.',
  apply: 'Implement an approved Projector change and keep tasks in sync.',
  archive: 'Archive a deployed Projector change and update specs.'
};

/**
 * QwenSlashCommandConfigurator class provides integration with Qwen Code
 * by creating the necessary slash command files in the .qwen/commands directory.
 * 
 * The slash commands include:
 * - /projector-proposal: Create an Projector change proposal
 * - /projector-apply: Apply an approved Projector change
 * - /projector-archive: Archive a deployed Projector change
 */
export class QwenSlashCommandConfigurator extends TomlSlashCommandConfigurator {
  /** Unique identifier for the Qwen tool */
  readonly toolId = 'qwen';

  /** Availability status for the Qwen tool */
  readonly isAvailable = true;

  /**
   * Returns the relative file path for a given slash command ID.
   * @param {SlashCommandId} id - The slash command identifier
   * @returns {string} The relative path to the command file
   */
  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getDescription(id: SlashCommandId): string {
    return DESCRIPTIONS[id as CoreSlashCommandId];
  }
}