import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { AgentHarness, RalphRunConfig } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class OpenCodeHarness extends EventEmitter implements AgentHarness {
  name = 'opencode';
  private process: ChildProcess | null = null;
  private stdoutBuffer = '';
  private stderrBuffer = '';
  private configPath: string | null = null;

  async run(config: RalphRunConfig): Promise<void> {
    const args = ['run'];
    
    if (config.model) {
      args.push('-m', config.model);
    }
    
    args.push(config.prompt);

    const env = { ...process.env, ...config.env };

    // Generate temporary config for non-interactive mode
    if (config.interactive === false) {
      this.configPath = await this.ensureOpenCodeConfig(config.cwd);
      env.OPENCODE_CONFIG = this.configPath;
    }

    return new Promise((resolve, reject) => {
      this.process = spawn('opencode', args, {
        cwd: config.cwd,
        env,
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      if (!this.process.stdout || !this.process.stderr) {
        reject(new Error('Failed to spawn opencode process'));
        return;
      }

      this.process.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        this.stdoutBuffer += text;
        this.emit('stdout', text);
        process.stdout.write(text);
      });

      this.process.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        this.stderrBuffer += text;
        this.emit('stderr', text);
        process.stderr.write(text);
      });

      this.process.on('close', async (code) => {
        this.process = null;
        
        // Cleanup temporary config
        if (this.configPath) {
          try {
            await fs.unlink(this.configPath);
          } catch {
            // Ignore cleanup errors
          }
        }

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`opencode exited with code ${code}`));
        }
      });

      this.process.on('error', async (error) => {
        this.process = null;
        
        // Cleanup temporary config on error
        if (this.configPath) {
          try {
            await fs.unlink(this.configPath);
          } catch {
            // Ignore cleanup errors
          }
        }
        
        reject(error);
      });
    });
  }

  stop(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  getStdout(): string {
    return this.stdoutBuffer;
  }

  getStderr(): string {
    return this.stderrBuffer;
  }

  private async ensureOpenCodeConfig(cwd: string): Promise<string> {
    const configDir = path.join(cwd, '.opencode');
    const configPath = path.join(configDir, 'ralph-spool.config.json');
    
    // Ensure config directory exists
    await fs.mkdir(configDir, { recursive: true });
    
    // Build config with auto-approve permissions
    const config = {
      $schema: 'https://opencode.ai/config.json',
      permission: {
        question: 'deny',
        read: 'allow',
        edit: 'allow',
        glob: 'allow',
        grep: 'allow',
        list: 'allow',
        bash: 'allow',
        task: 'allow',
        webfetch: 'allow',
        websearch: 'allow',
        codesearch: 'allow',
        todowrite: 'allow',
        todoread: 'allow',
        lsp: 'allow',
        external_directory: 'allow',
      },
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return configPath;
  }
}
