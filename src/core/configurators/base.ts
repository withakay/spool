export interface ToolConfigurator {
  name: string;
  configFileName: string;
  isAvailable: boolean;
  configure(projectPath: string, spoolDir: string): Promise<void>;
}
