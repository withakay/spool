import { SlashCommandConfigurator } from "./base.js";
import { SlashCommandId, CoreSlashCommandId } from "../../templates/index.js";

const FILE_PATHS: Record<CoreSlashCommandId, string> = {
  proposal: ".kilocode/workflows/projector-proposal.md",
  apply: ".kilocode/workflows/projector-apply.md",
  archive: ".kilocode/workflows/projector-archive.md"
};

export class KiloCodeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = "kilocode";
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id as CoreSlashCommandId];
  }

  protected getFrontmatter(_id: SlashCommandId): string | undefined {
    return undefined;
  }
}
