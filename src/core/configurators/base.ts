export interface ToolConfigurator {
  name: string;
  configFileName: string;
  isAvailable: boolean;
  configure(projectPath: string, projectorDir: string): Promise<void>;
}