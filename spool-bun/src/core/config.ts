export const SPOOL_DIR_NAME = '.spool';

export const SPOOL_MARKERS = {
  start: '<!-- SPOOL:START -->',
  end: '<!-- SPOOL:END -->',
};

export interface SpoolConfig {
  aiTools: string[];
}

export interface AIToolOption {
  name: string;
  value: string;
  available: boolean;
  successLabel?: string;
}

export const AI_TOOLS: AIToolOption[] = [
  { name: 'Claude Code', value: 'claude', available: true, successLabel: 'Claude Code' },
  { name: 'Codex', value: 'codex', available: true, successLabel: 'Codex' },
  {
    name: 'GitHub Copilot',
    value: 'github-copilot',
    available: true,
    successLabel: 'GitHub Copilot',
  },
  { name: 'OpenCode', value: 'opencode', available: true, successLabel: 'OpenCode' },
];
