import { replaceHardcodedSpoolPaths } from '../../utils/path-normalization.js';

// Core commands that all tools support
export type CoreSlashCommandId = 'proposal' | 'apply' | 'archive';

// All available slash commands
export type SlashCommandId =
  | CoreSlashCommandId
  | 'research'
  | 'review';

const skillDrivenBody = (
  skillId: string,
  input: string,
  extraInstructions?: string
): string => {
  const extra = extraInstructions ? `\n\n${extraInstructions}` : '';
  return `Use the Spool agent skill \`${skillId}\` as the source of truth for this workflow.

**Input**
${input}

**Instructions**
1. Open the Spool skill file for \`${skillId}\` in your agent skills directory (for example, \`.claude/skills/${skillId}/SKILL.md\`).
2. Follow the skill instructions exactly, using any supplied arguments or context from the prompt.${extra}

**Guardrails**
- If the skill file is missing, ask the user to run \`spool init\` to install Spool skills, then stop.
- Do not duplicate the full workflow here; defer to the skill guidance.`;
};

const proposalBody = skillDrivenBody(
  'spool-proposal',
  '- The request is provided in the prompt arguments or <UserRequest> block. Use it to scope the change and name the change ID.'
);

const applyBody = skillDrivenBody(
  'spool-apply',
  '- The change ID or implementation request is provided in the prompt arguments or <UserRequest> block.'
);

const archiveBody = skillDrivenBody(
  'spool-archive',
  '- The change ID is provided in the prompt arguments or <ChangeId> block.'
);

const researchFocusInstructions = `**Focus**
- If the user specifies one of: stack, architecture, features, pitfalls, focus only on that investigation and write to the matching file under \`spool/research/investigations/\`.
- If the focus is missing or unclear, ask the user whether they want a single investigation or the full research suite.`;

const researchBody = skillDrivenBody(
  'spool-research',
  '- The research topic is provided in the prompt arguments or <Topic> block. It may include an optional focus (stack, architecture, features, pitfalls).',
  researchFocusInstructions
);

const reviewBody = skillDrivenBody(
  'spool-review',
  '- The change ID or review target is provided in the prompt arguments or <ChangeId> block.'
);

export const slashCommandBodies: Record<SlashCommandId, string> = {
  proposal: proposalBody,
  apply: applyBody,
  archive: archiveBody,
  research: researchBody,
  review: reviewBody,
};

export function getSlashCommandBody(id: SlashCommandId, spoolDir: string = '.spool'): string {
  let body = slashCommandBodies[id];
  
  // Replace hardcoded 'spool/' paths with the configured spoolDir
  body = replaceHardcodedSpoolPaths(body, spoolDir);
  
  return body;
}
