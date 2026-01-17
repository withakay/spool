import { agentsTemplate } from './agents-template.js';
import { projectTemplate, ProjectContext } from './project-template.js';
import { claudeTemplate } from './claude-template.js';
import { clineTemplate } from './cline-template.js';
import { costrictTemplate } from './costrict-template.js';
import { agentsRootStubTemplate } from './agents-root-stub.js';
import { getSlashCommandBody, SlashCommandId } from './slash-command-templates.js';
import {
  projectPlanningTemplate,
  roadmapTemplate,
  stateTemplate,
  PlanningContext,
} from './planning-templates.js';
import {
  researchSummaryTemplate,
  stackAnalysisTemplate,
  featureLandscapeTemplate,
  architectureTemplate,
  pitfallsTemplate,
  ResearchContext,
} from './research-templates.js';

export interface Template<T = any> {
  path: string;
  content: string | ((context: T) => string);
}

export class TemplateManager {
  static getTemplates(context: ProjectContext = {}): Template[] {
    return [
      {
        path: 'AGENTS.md',
        content: agentsTemplate
      },
      {
        path: 'project.md',
        content: projectTemplate(context)
      }
    ];
  }

  static getClaudeTemplate(): string {
    return claudeTemplate;
  }

  static getClineTemplate(): string {
    return clineTemplate;
  }

  static getCostrictTemplate(): string {
    return costrictTemplate;
  }

  static getAgentsStandardTemplate(): string {
    return agentsRootStubTemplate;
  }

  static getSlashCommandBody(id: SlashCommandId): string {
    return getSlashCommandBody(id);
  }

  static getPlanningTemplates(context: PlanningContext = {}): Template[] {
    return [
      {
        path: 'planning/PROJECT.md',
        content: projectPlanningTemplate(context),
      },
      {
        path: 'planning/ROADMAP.md',
        content: roadmapTemplate(context),
      },
      {
        path: 'planning/STATE.md',
        content: stateTemplate(context),
      },
    ];
  }

  static getResearchTemplates(context: ResearchContext = {}): Template[] {
    return [
      {
        path: 'research/SUMMARY.md',
        content: researchSummaryTemplate(context),
      },
      {
        path: 'research/investigations/stack-analysis.md',
        content: stackAnalysisTemplate(context),
      },
      {
        path: 'research/investigations/feature-landscape.md',
        content: featureLandscapeTemplate(context),
      },
      {
        path: 'research/investigations/architecture.md',
        content: architectureTemplate(context),
      },
      {
        path: 'research/investigations/pitfalls.md',
        content: pitfallsTemplate(context),
      },
    ];
  }

  static getResearchTemplate(
    type: 'summary' | 'stack' | 'features' | 'architecture' | 'pitfalls',
    context: ResearchContext = {}
  ): string {
    const templates = {
      summary: researchSummaryTemplate,
      stack: stackAnalysisTemplate,
      features: featureLandscapeTemplate,
      architecture: architectureTemplate,
      pitfalls: pitfallsTemplate,
    };
    return templates[type](context);
  }
}

export { ProjectContext } from './project-template.js';
export { PlanningContext } from './planning-templates.js';
export { ResearchContext } from './research-templates.js';
export type { SlashCommandId } from './slash-command-templates.js';
export {
  enhancedTasksTemplate,
  taskItemTemplate,
  parseTasksFile,
  serializeTasksFile,
  type TasksContext,
  type ParsedTask,
  type ParsedTasksFile,
} from './tasks-template.js';
