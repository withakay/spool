/**
 * Path normalization utilities for Spool directory handling
 */

/**
 * Normalizes a spool directory name to ensure it starts with a dot.
 * 
 * @param spoolDir - The spool directory name (e.g., '.spool', 'my-spool')
 * @returns The normalized directory name starting with a dot (e.g., '.spool', '.my-spool')
 */
export function normalizeSpoolDir(spoolDir: string): string {
  return spoolDir.startsWith('.') ? spoolDir : `.${spoolDir}`;
}

/**
 * Replaces hardcoded 'spool/' paths in text with the configured spool directory.
 * 
 * @param text - The text containing potentially hardcoded 'spool/' paths
 * @param spoolDir - The configured spool directory name
 * @returns The text with all 'spool/' paths replaced with the normalized spool directory
 */
export function replaceHardcodedSpoolPaths(text: string, spoolDir: string = '.spool'): string {
  const normalizedDir = normalizeSpoolDir(spoolDir);
  return text.replace(/spool\//g, `${normalizedDir}/`);
}

/**
 * Replaces hardcoded '.spool/' paths in text with the configured spool directory.
 * This handles cases where the template already has '.spool/' and needs it replaced.
 * 
 * @param text - The text containing potentially hardcoded '.spool/' paths
 * @param spoolDir - The configured spool directory name
 * @returns The text with all '.spool/' paths replaced with the normalized spool directory
 */
export function replaceHardcodedDotSpoolPaths(text: string, spoolDir: string = '.spool'): string {
  const normalizedDir = normalizeSpoolDir(spoolDir);
  return text.replace(/\.spool\//g, `${normalizedDir}/`);
}