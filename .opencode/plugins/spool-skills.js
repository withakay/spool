/**
 * Spool OpenCode Plugin
 *
 * Injects Spool bootstrap context via system prompt transform.
 * Skills are resolved from ${OPENCODE_CONFIG_DIR}/skills/spool-skills/
 * (never via relative paths to the plugin file).
 */

import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

export const SpoolPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const envConfigDir = process.env.OPENCODE_CONFIG_DIR?.trim();
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');
  const skillsDir = path.join(configDir, 'skills', 'spool-skills');

  // Get bootstrap content from Spool CLI
  const getBootstrapContent = () => {
    try {
      const bootstrap = execSync('spool agent instruction bootstrap --tool opencode', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();

      const fallback = `You have access to Spool workflows.

To load a Spool workflow, use OpenCode's native \`skill\` tool:
\`\`\`
use skill tool to load spool-skills/<workflow-name>
\`\`\`

Spool skills are available at: \`${skillsDir}\`

**Tool Mapping for OpenCode:**
When Spool workflows reference Claude Code tools, use these OpenCode equivalents:
- \`TodoWrite\` → \`update_plan\`
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention)
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

**Getting Started:**
List available Spool skills:
\`\`\`
use skill tool to list skills
\`\`\`

Load a specific workflow:
\`\`\`
use skill tool to load spool-skills/using-spool-skills
\`\`\``;

      const content = bootstrap.length > 0 ? bootstrap : fallback;
      return `<EXTREMELY_IMPORTANT>
 ${content}
 </EXTREMELY_IMPORTANT>`;
    } catch (error) {
      // Graceful degradation if CLI is not available
      return `<EXTREMELY_IMPORTANT>
Spool integration is configured, but the Spool CLI is not available.

Spool skills should be installed to: \`${skillsDir}\`

Use OpenCode's native \`skill\` tool to load Spool workflows.
</EXTREMELY_IMPORTANT>`;
    }
  };

  return {
    // Use system prompt transform to inject bootstrap
    'experimental.chat.system.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (bootstrap) {
        (output.system ||= []).push(bootstrap);
      }
    }
  };
};
