/**
 * Flexible ID Parser for Spool
 *
 * Accepts loose module and change ID formats and normalizes them to canonical format.
 * - Module IDs: `1`, `01`, `001`, `1_foo` → `001`
 * - Change IDs: `1-2_bar`, `001-02_bar`, `1-00003_bar` → `001-02_bar`
 */

// Result types
export interface ParseModuleIdResult {
  success: true;
  moduleId: string; // Canonical 3-digit format (e.g., "001")
  moduleName?: string; // Optional name suffix if provided
}

export interface ParseChangeIdResult {
  success: true;
  moduleId: string; // Canonical 3-digit format (e.g., "001")
  changeNum: string; // Canonical 2-digit format (e.g., "02")
  name: string; // The change name (e.g., "bar")
  canonical: string; // Full canonical form (e.g., "001-02_bar")
}

export interface ParseIdError {
  success: false;
  error: string;
  hint?: string;
}

export type ModuleIdParseResult = ParseModuleIdResult | ParseIdError;
export type ChangeIdParseResult = ParseChangeIdResult | ParseIdError;

// Regex patterns for flexible parsing
// Module ID: optional digits, optionally followed by _name
// Examples: 1, 01, 001, 1_foo, 001_foo
const FLEXIBLE_MODULE_PATTERN = /^(\d+)(?:_([a-z][a-z0-9-]*))?$/i;

// Change ID: module_num-change_num_name
// Examples: 1-2_bar, 001-02_bar, 1-00003_bar, 0001-00002_baz
const FLEXIBLE_CHANGE_PATTERN = /^(\d+)-(\d+)_([a-z][a-z0-9-]*)$/i;

/**
 * Parse a loose module ID and normalize to canonical 3-digit format.
 *
 * @param input - The module ID input (e.g., "1", "01", "001", "1_foo")
 * @returns Parsed result with canonical moduleId or error
 *
 * @example
 * parseModuleId("1")      // { success: true, moduleId: "001" }
 * parseModuleId("01")     // { success: true, moduleId: "001" }
 * parseModuleId("001")    // { success: true, moduleId: "001" }
 * parseModuleId("1_foo")  // { success: true, moduleId: "001", moduleName: "foo" }
 */
export function parseModuleId(input: string): ModuleIdParseResult {
  if (!input || typeof input !== 'string') {
    return {
      success: false,
      error: 'Module ID is required',
      hint: 'Provide a module ID like "1", "001", or "001_my-module"',
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Module ID cannot be empty',
      hint: 'Provide a module ID like "1", "001", or "001_my-module"',
    };
  }

  const match = trimmed.match(FLEXIBLE_MODULE_PATTERN);
  if (!match) {
    return {
      success: false,
      error: `Invalid module ID format: "${input}"`,
      hint: 'Expected format: "NNN" or "NNN_name" (e.g., "1", "001", "001_my-module")',
    };
  }

  const [, numPart, namePart] = match;
  const num = parseInt(numPart, 10);

  // Validate range (0-999 for 3-digit padding)
  if (num > 999) {
    return {
      success: false,
      error: `Module ID ${num} exceeds maximum (999)`,
      hint: 'Module IDs must be between 0 and 999',
    };
  }

  const moduleId = num.toString().padStart(3, '0');

  if (namePart) {
    return {
      success: true,
      moduleId,
      moduleName: namePart.toLowerCase(),
    };
  }

  return {
    success: true,
    moduleId,
  };
}

/**
 * Parse a loose change ID and normalize to canonical NNN-NN_name format.
 *
 * @param input - The change ID input (e.g., "1-2_bar", "001-02_bar", "1-00003_bar")
 * @returns Parsed result with canonical components or error
 *
 * @example
 * parseChangeId("1-2_bar")       // { success: true, moduleId: "001", changeNum: "02", name: "bar", canonical: "001-02_bar" }
 * parseChangeId("001-02_bar")    // { success: true, moduleId: "001", changeNum: "02", name: "bar", canonical: "001-02_bar" }
 * parseChangeId("1-00003_bar")   // { success: true, moduleId: "001", changeNum: "03", name: "bar", canonical: "001-03_bar" }
 */
export function parseChangeId(input: string): ChangeIdParseResult {
  if (!input || typeof input !== 'string') {
    return {
      success: false,
      error: 'Change ID is required',
      hint: 'Provide a change ID like "1-2_my-change" or "001-02_my-change"',
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Change ID cannot be empty',
      hint: 'Provide a change ID like "1-2_my-change" or "001-02_my-change"',
    };
  }

  const match = trimmed.match(FLEXIBLE_CHANGE_PATTERN);
  if (!match) {
    // Provide specific error hints based on what's wrong
    if (trimmed.includes('_') && !trimmed.includes('-')) {
      return {
        success: false,
        error: `Invalid change ID format: "${input}"`,
        hint: 'Change IDs use "-" between module and change number (e.g., "001-02_name" not "001_02_name")',
      };
    }
    if (trimmed.match(/^\d+-\d+$/)) {
      return {
        success: false,
        error: `Change ID missing name: "${input}"`,
        hint: 'Change IDs require a name suffix (e.g., "001-02_my-change")',
      };
    }
    return {
      success: false,
      error: `Invalid change ID format: "${input}"`,
      hint: 'Expected format: "NNN-NN_name" (e.g., "1-2_my-change", "001-02_my-change")',
    };
  }

  const [, moduleNumPart, changeNumPart, namePart] = match;
  const moduleNum = parseInt(moduleNumPart, 10);
  const changeNum = parseInt(changeNumPart, 10);

  // Validate ranges
  if (moduleNum > 999) {
    return {
      success: false,
      error: `Module number ${moduleNum} exceeds maximum (999)`,
      hint: 'Module numbers must be between 0 and 999',
    };
  }

  if (changeNum > 99) {
    return {
      success: false,
      error: `Change number ${changeNum} exceeds maximum (99)`,
      hint: 'Change numbers must be between 0 and 99',
    };
  }

  const moduleId = moduleNum.toString().padStart(3, '0');
  const changeNumStr = changeNum.toString().padStart(2, '0');
  const name = namePart.toLowerCase();
  const canonical = `${moduleId}-${changeNumStr}_${name}`;

  return {
    success: true,
    moduleId,
    changeNum: changeNumStr,
    name,
    canonical,
  };
}

/**
 * Normalize a module ID to canonical format, throwing on error.
 * Convenience wrapper for parseModuleId.
 *
 * @param input - The module ID input
 * @returns Canonical module ID (e.g., "001")
 * @throws Error if parsing fails
 */
export function normalizeModuleId(input: string): string {
  const result = parseModuleId(input);
  if (!result.success) {
    throw new Error(result.hint ? `${result.error}. ${result.hint}` : result.error);
  }
  return result.moduleId;
}

/**
 * Normalize a change ID to canonical format, throwing on error.
 * Convenience wrapper for parseChangeId.
 *
 * @param input - The change ID input
 * @returns Canonical change ID (e.g., "001-02_my-change")
 * @throws Error if parsing fails
 */
export function normalizeChangeId(input: string): string {
  const result = parseChangeId(input);
  if (!result.success) {
    throw new Error(result.hint ? `${result.error}. ${result.hint}` : result.error);
  }
  return result.canonical;
}

/**
 * Check if a string looks like it could be a change ID (has the NNN-NN_name pattern).
 * Does not validate - just checks if it matches the general shape.
 */
export function looksLikeChangeId(input: string): boolean {
  return /^\d+-\d+_/.test(input.trim());
}

/**
 * Check if a string looks like it could be a module ID (digits optionally followed by _name).
 * Does not validate - just checks if it matches the general shape.
 */
export function looksLikeModuleId(input: string): boolean {
  return /^\d+(?:_[a-z])?/i.test(input.trim());
}
