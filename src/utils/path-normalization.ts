/**
 * Path normalization utilities for Projector directory handling
 */

/**
 * Normalizes a projector directory name to ensure it starts with a dot.
 * 
 * @param projectorDir - The projector directory name (e.g., '.projector', 'my-projector')
 * @returns The normalized directory name starting with a dot (e.g., '.projector', '.my-projector')
 */
export function normalizeProjectorDir(projectorDir: string): string {
  return projectorDir.startsWith('.') ? projectorDir : `.${projectorDir}`;
}

/**
 * Replaces hardcoded 'projector/' paths in text with the configured projector directory.
 * 
 * @param text - The text containing potentially hardcoded 'projector/' paths
 * @param projectorDir - The configured projector directory name
 * @returns The text with all 'projector/' paths replaced with the normalized projector directory
 */
export function replaceHardcodedProjectorPaths(text: string, projectorDir: string = '.projector'): string {
  const normalizedDir = normalizeProjectorDir(projectorDir);
  return text.replace(/projector\//g, `${normalizedDir}/`);
}

/**
 * Replaces hardcoded '.projector/' paths in text with the configured projector directory.
 * This handles cases where the template already has '.projector/' and needs it replaced.
 * 
 * @param text - The text containing potentially hardcoded '.projector/' paths
 * @param projectorDir - The configured projector directory name
 * @returns The text with all '.projector/' paths replaced with the normalized projector directory
 */
export function replaceHardcodedDotProjectorPaths(text: string, projectorDir: string = '.projector'): string {
  const normalizedDir = normalizeProjectorDir(projectorDir);
  return text.replace(/\.projector\//g, `${normalizedDir}/`);
}