import { MarkdownParser, Section } from './markdown-parser.js';
import {
  Module,
  ModuleChangeEntry,
  parseModuleName,
  MODULE_ID_PATTERN,
} from '../schemas/index.js';

export class ModuleParser extends MarkdownParser {
  private moduleFolderName: string;

  constructor(content: string, moduleFolderName: string) {
    super(content);
    this.moduleFolderName = moduleFolderName;
  }

  parseModule(): Module {
    const sections = this.parseSections();

    // Parse module folder name to get ID and name
    const parsed = parseModuleName(this.moduleFolderName);
    if (!parsed) {
      throw new Error(`Invalid module folder name: ${this.moduleFolderName}. Expected format: NNN_kebab-name (e.g., 001_project-setup)`);
    }

    const { id, name } = parsed;

    // Parse Purpose section (required)
    const purposeSection = this.findSection(sections, 'Purpose');
    const purpose = purposeSection?.content?.trim() || '';

    if (!purpose) {
      throw new Error('Module must have a Purpose section');
    }

    // Parse Scope section (required)
    const scopeSection = this.findSection(sections, 'Scope');
    const scope = this.parseListSection(scopeSection);

    if (scope.length === 0) {
      throw new Error('Module must have a Scope section with at least one capability (use "*" for unrestricted)');
    }

    // Parse Depends On section (optional)
    const dependsOnSection = this.findSection(sections, 'Depends On');
    const dependsOn = this.parseDependencies(dependsOnSection);

    // Parse Changes section (optional, hybrid auto-discovered + planned)
    const changesSection = this.findSection(sections, 'Changes');
    const changes = this.parseChanges(changesSection);

    return {
      id,
      name,
      fullName: this.moduleFolderName,
      purpose,
      scope,
      dependsOn,
      changes,
      metadata: {
        version: '1.0.0',
        format: 'openspec-module',
      },
    };
  }

  private parseListSection(section: Section | undefined): string[] {
    if (!section?.content) return [];

    const items: string[] = [];
    const lines = section.content.split('\n');

    for (const line of lines) {
      // Match list items: - item or * item
      const match = line.match(/^\s*[-*]\s+(.+)$/);
      if (match) {
        const item = match[1].trim();
        // Remove backticks if present
        const cleanItem = item.replace(/^`|`$/g, '');
        if (cleanItem) {
          items.push(cleanItem);
        }
      }
    }

    return items;
  }

  private parseDependencies(section: Section | undefined): string[] {
    if (!section?.content) return [];

    const deps: string[] = [];
    const lines = section.content.split('\n');

    for (const line of lines) {
      // Match list items: - 001 or - 001_name
      const match = line.match(/^\s*[-*]\s+(\d{3})(?:_[a-z][a-z0-9-]*)?/);
      if (match) {
        const moduleId = match[1];
        if (MODULE_ID_PATTERN.test(moduleId)) {
          deps.push(moduleId);
        }
      }
    }

    return deps;
  }

  private parseChanges(section: Section | undefined): ModuleChangeEntry[] {
    if (!section?.content) return [];

    const changes: ModuleChangeEntry[] = [];
    const lines = section.content.split('\n');

    for (const line of lines) {
      // Match checkbox items: - [ ] change-id or - [x] change-id
      // Also detect (planned) suffix
      const match = line.match(/^\s*-\s*\[([ xX])\]\s+(\S+)(?:\s+\(planned\))?/);
      if (match) {
        const completed = match[1].toLowerCase() === 'x';
        const changeId = match[2].trim();
        const planned = line.toLowerCase().includes('(planned)');

        changes.push({
          id: changeId,
          planned,
          completed,
        });
      }
    }

    return changes;
  }
}

// Helper function to generate module.md content
export function generateModuleContent(options: {
  title: string;
  purpose: string;
  scope: string[];
  dependsOn?: string[];
  changes?: ModuleChangeEntry[];
}): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${options.title}`);
  lines.push('');

  // Purpose
  lines.push('## Purpose');
  lines.push(options.purpose);
  lines.push('');

  // Depends On (if any)
  if (options.dependsOn && options.dependsOn.length > 0) {
    lines.push('## Depends On');
    for (const dep of options.dependsOn) {
      lines.push(`- ${dep}`);
    }
    lines.push('');
  }

  // Scope
  lines.push('## Scope');
  for (const capability of options.scope) {
    lines.push(`- ${capability}`);
  }
  lines.push('');

  // Changes
  lines.push('## Changes');
  if (options.changes && options.changes.length > 0) {
    for (const change of options.changes) {
      const checkbox = change.completed ? '[x]' : '[ ]';
      const planned = change.planned ? ' (planned)' : '';
      lines.push(`- ${checkbox} ${change.id}${planned}`);
    }
  } else {
    lines.push('<!-- Changes will be listed here as they are created -->');
  }
  lines.push('');

  return lines.join('\n');
}
