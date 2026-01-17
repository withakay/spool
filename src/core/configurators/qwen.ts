/**
 * Qwen Code configurator for Projector integration.
 * This class handles the configuration of Qwen Code as an AI tool within Projector.
 * 
 * @implements {ToolConfigurator}
 */
import path from 'path';
import { ToolConfigurator } from './base.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import { TemplateManager } from '../templates/index.js';
import { PROJECTOR_MARKERS } from '../config.js';

/**
 * QwenConfigurator class provides integration with Qwen Code
 * by creating and managing the necessary configuration files.
 * Currently configures the QWEN.md file with Projector instructions.
 */
export class QwenConfigurator implements ToolConfigurator {
  /** Display name for the Qwen Code tool */
  name = 'Qwen Code';
  
  /** Configuration file name for Qwen Code */
  configFileName = 'QWEN.md';
  
  /** Availability status for the Qwen Code tool */
  isAvailable = true;

  /**
   * Configures the Qwen Code integration by creating or updating the QWEN.md file
   * with Projector instructions and markers.
   * 
   * @param {string} projectPath - The path to the project root
   * @param {string} _projectorDir - The path to the projector directory (unused)
   * @returns {Promise<void>} A promise that resolves when configuration is complete
   */
  async configure(projectPath: string, _projectorDir: string): Promise<void> {
    const filePath = path.join(projectPath, this.configFileName);
    const content = TemplateManager.getAgentsStandardTemplate();
    
    await FileSystemUtils.updateFileWithMarkers(
      filePath,
      content,
      PROJECTOR_MARKERS.start,
      PROJECTOR_MARKERS.end
    );
  }
}