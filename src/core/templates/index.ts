import { agentsTemplate } from "./agents-template.js";
import { projectTemplate, ProjectContext } from "./project-template.js";

export interface TemplateContext {
	spoolDir: string;
}

export type SpoolTemplateContext = ProjectContext & TemplateContext;
export type SpoolPlanningTemplateContext = PlanningContext & TemplateContext;
export type SpoolCommandTemplateContext = CommandContext & TemplateContext;
export type SpoolResearchTemplateContext = ResearchContext & TemplateContext;
import { claudeTemplate } from "./claude-template.js";
import { agentsRootStubTemplate } from "./agents-root-stub.js";
import {
	getSlashCommandBody,
	SlashCommandId,
} from "./slash-command-templates.js";
import {
	projectPlanningTemplate,
	roadmapTemplate,
	stateTemplate,
	PlanningContext,
} from "./planning-templates.js";
import {
	researchSummaryTemplate,
	stackAnalysisTemplate,
	featureLandscapeTemplate,
	architectureTemplate,
	pitfallsTemplate,
	ResearchContext,
} from "./research-templates.js";
import {
	commandPrompts,
	commandPromptDescriptions,
	CommandContext,
	CommandPromptId,
} from "./command-templates.js";

export interface Template<T = any> {
	path: string;
	content: string | ((context: T) => string);
}

export class TemplateManager {
	static getTemplates(context: ProjectContext = {}): Template[] {
		return [
			{
				path: "AGENTS.md",
				content: agentsTemplate,
			},
			{
				path: "project.md",
				content: projectTemplate(context),
			},
		];
	}

	static getClaudeTemplate(
		context: { spoolDir: string } = { spoolDir: ".spool" },
	): string {
		return claudeTemplate(context);
	}

	static getAgentsStandardTemplate(
		context: { spoolDir: string } = { spoolDir: ".spool" },
	): string {
		return agentsRootStubTemplate(context);
	}

	static getSlashCommandBody(
		id: SlashCommandId,
		spoolDir: string = ".spool",
	): string {
		return getSlashCommandBody(id, spoolDir);
	}

	static getPlanningTemplates(context: PlanningContext = {}): Template[] {
		return [
			{
				path: "planning/PROJECT.md",
				content: projectPlanningTemplate(context),
			},
			{
				path: "planning/ROADMAP.md",
				content: roadmapTemplate(context),
			},
			{
				path: "planning/STATE.md",
				content: stateTemplate(context),
			},
		];
	}

	static getResearchTemplates(context: ResearchContext = {}): Template[] {
		return [
			{
				path: "research/SUMMARY.md",
				content: researchSummaryTemplate(context),
			},
			{
				path: "research/investigations/stack-analysis.md",
				content: stackAnalysisTemplate(context),
			},
			{
				path: "research/investigations/feature-landscape.md",
				content: featureLandscapeTemplate(context),
			},
			{
				path: "research/investigations/architecture.md",
				content: architectureTemplate(context),
			},
			{
				path: "research/investigations/pitfalls.md",
				content: pitfallsTemplate(context),
			},
		];
	}

	static getResearchTemplate(
		type: "summary" | "stack" | "features" | "architecture" | "pitfalls",
		context: ResearchContext = {},
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

	static getCommandTemplates(
		context: CommandContext = {},
	): Template<CommandContext>[] {
		const contextWithSpoolDir = { spoolDir: ".spool", ...context };
		return (Object.keys(commandPrompts) as CommandPromptId[]).map((id) => ({
			path: `commands/${id}.md`,
			content: commandPrompts[id](contextWithSpoolDir),
		}));
	}

	static getCommandPrompt(
		id: CommandPromptId,
		context: CommandContext = {},
	): string {
		const contextWithSpoolDir = { spoolDir: ".spool", ...context };
		return commandPrompts[id](contextWithSpoolDir);
	}

	static getCommandPromptDescription(id: CommandPromptId): string {
		return commandPromptDescriptions[id];
	}

	static getCommandPromptIds(): CommandPromptId[] {
		return Object.keys(commandPrompts) as CommandPromptId[];
	}
}

export { ProjectContext } from "./project-template.js";
export { PlanningContext } from "./planning-templates.js";
export { ResearchContext } from "./research-templates.js";
export type {
	SlashCommandId,
	CoreSlashCommandId,
} from "./slash-command-templates.js";
export {
	enhancedTasksTemplate,
	taskItemTemplate,
	parseTasksFile,
	serializeTasksFile,
	type TasksContext,
	type ParsedTask,
	type ParsedTasksFile,
} from "./tasks-template.js";
export { CommandContext, CommandPromptId } from "./command-templates.js";
