import { CommandDefinition, FlagDefinition } from './types.js';

/**
 * Common flags used across multiple commands
 */
const COMMON_FLAGS = {
  json: {
    name: 'json',
    description: 'Output as JSON',
  } as FlagDefinition,
  jsonValidation: {
    name: 'json',
    description: 'Output validation results as JSON',
  } as FlagDefinition,
  strict: {
    name: 'strict',
    description: 'Enable strict validation mode',
  } as FlagDefinition,
  noInteractive: {
    name: 'no-interactive',
    description: 'Disable interactive prompts',
  } as FlagDefinition,
  type: {
    name: 'type',
    description: 'Specify item type when ambiguous',
    takesValue: true,
    values: ['change', 'spec'],
  } as FlagDefinition,
  validateType: {
    name: 'type',
    description: 'Specify item type when ambiguous',
    takesValue: true,
    values: ['change', 'spec', 'module'],
  } as FlagDefinition,
} as const;

/**
 * Registry of all Spool CLI commands with their flags and metadata.
 * This registry is used to generate shell completion scripts.
 */
export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    name: 'init',
    description: 'Initialize Spool in your project',
    acceptsPositional: true,
    positionalType: 'path',
    flags: [
      {
        name: 'tools',
        description:
          'Configure AI tools non-interactively (e.g., "all", "none", or comma-separated tool IDs)',
        takesValue: true,
      },
    ],
  },
  {
    name: 'update',
    description: 'Update Spool instruction files',
    acceptsPositional: true,
    positionalType: 'path',
    flags: [
      {
        name: 'json',
        description: 'Output update summary as JSON',
      },
    ],
  },
  {
    name: 'dashboard',
    description: 'Display an interactive dashboard of specs and changes',
    flags: [],
  },
  {
    name: 'status',
    description: 'Display artifact completion status for a change',
    flags: [
      {
        name: 'change',
        description: 'Change name to show status for',
        takesValue: true,
      },
      {
        name: 'schema',
        description: 'Schema override (auto-detected from .spool.yaml)',
        takesValue: true,
      },
      COMMON_FLAGS.json,
    ],
  },
  {
    name: 'ralph',
    description: 'Run iterative AI loop against a change proposal',
    acceptsPositional: true,
    flags: [
      {
        name: 'change',
        short: 'c',
        description: 'Target a specific change proposal',
        takesValue: true,
      },
      {
        name: 'module',
        short: 'm',
        description: 'Target a specific module',
        takesValue: true,
      },
      COMMON_FLAGS.noInteractive,
      {
        name: 'harness',
        description: 'Agent harness to use',
        takesValue: true,
      },
      {
        name: 'model',
        description: 'Model identifier to pass to harness',
        takesValue: true,
      },
      {
        name: 'min-iterations',
        description: 'Minimum iterations before completion allowed',
        takesValue: true,
      },
      {
        name: 'max-iterations',
        description: 'Maximum iterations before stopping',
        takesValue: true,
      },
      {
        name: 'completion-promise',
        description: 'Phrase that signals completion',
        takesValue: true,
      },
      {
        name: 'allow-all',
        description: 'Auto-approve all tool permissions (non-interactive)',
      },
      {
        name: 'yolo',
        description: 'Alias for --allow-all',
      },
      {
        name: 'dangerously-allow-all',
        description: 'Alias for --allow-all',
      },
      {
        name: 'no-commit',
        description: 'Disable auto-commit after each iteration',
      },
      {
        name: 'status',
        description: 'Show current Ralph loop status and history',
      },
      {
        name: 'add-context',
        description: 'Add context for the next iteration',
        takesValue: true,
      },
      {
        name: 'clear-context',
        description: 'Clear any pending context',
      },
    ],
  },
  {
    name: 'create',
    description: 'Create items',
    flags: [],
    subcommands: [
      {
        name: 'change',
        description: 'Create a new change',
        acceptsPositional: true,
        flags: [
          {
            name: 'description',
            description: 'Description to add to README.md',
            takesValue: true,
          },
          {
            name: 'schema',
            description: 'Workflow schema to use',
            takesValue: true,
          },
          {
            name: 'module',
            description: 'Module ID to associate the change with (default: 000)',
            takesValue: true,
          },
        ],
      },
      {
        name: 'module',
        description: 'Create a new module',
        acceptsPositional: true,
        flags: [
          {
            name: 'scope',
            description: 'Comma-separated list of capabilities (default: "*" for unrestricted)',
            takesValue: true,
          },
          {
            name: 'depends-on',
            description: 'Comma-separated list of module IDs this depends on',
            takesValue: true,
          },
        ],
      },
    ],
  },
  {
    name: 'list',
    description: 'List items (changes by default). Use --specs or --modules to list other items.',
    flags: [
      {
        name: 'specs',
        description: 'List specs instead of changes',
      },
      {
        name: 'changes',
        description: 'List changes explicitly (default)',
      },
      {
        name: 'modules',
        description: 'List modules instead of changes',
      },
      {
        name: 'sort',
        description: 'Sort order: "recent" (default) or "name"',
        takesValue: true,
        values: ['recent', 'name'],
      },
      {
        name: 'json',
        description: 'Output as JSON (for programmatic use)',
      },
    ],
  },
  {
    name: 'show',
    description: 'Show a change or spec',
    acceptsPositional: true,
    positionalType: 'change-or-spec-id',
    flags: [
      COMMON_FLAGS.json,
      COMMON_FLAGS.type,
      COMMON_FLAGS.noInteractive,
      {
        name: 'deltas-only',
        description: 'Show only deltas (JSON only, change)',
      },
      {
        name: 'requirements-only',
        description: 'Alias for --deltas-only (deprecated, change)',
      },
      {
        name: 'requirements',
        description: 'JSON only: Show only requirements (exclude scenarios)',
      },
      {
        name: 'no-scenarios',
        description: 'JSON only: Exclude scenario content',
      },
      {
        name: 'requirement',
        short: 'r',
        description: 'JSON only: Show specific requirement by ID (1-based)',
        takesValue: true,
      },
    ],
  },
  {
    name: 'validate',
    description: 'Validate changes, specs, and modules',
    acceptsPositional: true,
    positionalType: 'change-or-spec-id',
    flags: [
      {
        name: 'all',
        description: 'Validate all changes, specs, and modules',
      },
      {
        name: 'changes',
        description: 'Validate all changes',
      },
      {
        name: 'specs',
        description: 'Validate all specs',
      },
      {
        name: 'modules',
        description: 'Validate all modules',
      },
      {
        name: 'module',
        description: 'Validate a specific module by ID',
        takesValue: true,
      },
      COMMON_FLAGS.validateType,
      COMMON_FLAGS.strict,
      COMMON_FLAGS.jsonValidation,
      {
        name: 'concurrency',
        description: 'Max concurrent validations (defaults to env SPOOL_CONCURRENCY or 6)',
        takesValue: true,
      },
      COMMON_FLAGS.noInteractive,
    ],
  },
  {
    name: 'archive',
    description: 'Archive a completed change and update main specs',
    acceptsPositional: true,
    positionalType: 'change-id',
    flags: [
      {
        name: 'yes',
        short: 'y',
        description: 'Skip confirmation prompts',
      },
      {
        name: 'skip-specs',
        description: 'Skip spec update operations',
      },
      {
        name: 'no-validate',
        description: 'Skip validation (not recommended)',
      },
    ],
  },
  {
    name: 'split',
    description: 'Split a change into smaller changes',
    acceptsPositional: true,
    positionalType: 'change-id',
    flags: [],
  },
  {
    name: 'completions',
    description: 'Manage shell completions for Spool CLI',
    flags: [],
    subcommands: [
      {
        name: 'generate',
        description: 'Generate completion script for a shell (outputs to stdout)',
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [],
      },
      {
        name: 'install',
        description: 'Install completion script for a shell',
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [
          {
            name: 'verbose',
            description: 'Show detailed installation output',
          },
        ],
      },
      {
        name: 'uninstall',
        description: 'Uninstall completion script for a shell',
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [
          {
            name: 'yes',
            short: 'y',
            description: 'Skip confirmation prompts',
          },
        ],
      },
    ],
  },
  {
    name: 'config',
    description: 'View and modify global Spool configuration',
    flags: [
      {
        name: 'scope',
        description: 'Config scope (only "global" supported currently)',
        takesValue: true,
        values: ['global'],
      },
    ],
    subcommands: [
      {
        name: 'paths',
        description: 'Show config file location',
        flags: [],
      },
      {
        name: 'list',
        description: 'Show all current settings',
        flags: [COMMON_FLAGS.json],
      },
      {
        name: 'get',
        description: 'Get a specific value (raw, scriptable)',
        acceptsPositional: true,
        flags: [],
      },
      {
        name: 'set',
        description: 'Set a value (auto-coerce types)',
        acceptsPositional: true,
        flags: [
          {
            name: 'string',
            description: 'Force value to be stored as string',
          },
          {
            name: 'allow-unknown',
            description: 'Allow setting unknown keys',
          },
        ],
      },
      {
        name: 'unset',
        description: 'Remove a key (revert to default)',
        acceptsPositional: true,
        flags: [],
      },
      {
        name: 'reset',
        description: 'Reset configuration to defaults',
        flags: [
          {
            name: 'all',
            description: 'Reset all configuration (required)',
          },
          {
            name: 'yes',
            short: 'y',
            description: 'Skip confirmation prompts',
          },
        ],
      },
      {
        name: 'edit',
        description: 'Open config in $EDITOR',
        flags: [],
      },
    ],
  },
  // Experimental commands (visible)
  {
    name: 'x-templates',
    description: '[Experimental] Show resolved template paths for all artifacts in a schema',
    flags: [
      {
        name: 'schema',
        description: 'Schema to use',
        takesValue: true,
      },
      COMMON_FLAGS.json,
    ],
  },
  {
    name: 'x-schemas',
    description: '[Experimental] List available workflow schemas with descriptions',
    flags: [COMMON_FLAGS.json],
  },
];
