import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { AgentHarness, RalphRunConfig } from '../types.js';

export class OpenCodeHarness extends EventEmitter implements AgentHarness {
  name = 'opencode';
  private process: ChildProcess | null = null;
  private stdoutBuffer = '';
  private stderrBuffer = '';

  async run(config: RalphRunConfig): Promise<void> {
    const args = ['run'];
    
    if (config.model) {
      args.push('-m', config.model);
    }
    
    if (config.interactive === false) {
      args.push('-y');
    }
    
    args.push(config.prompt);

    return new Promise((resolve, reject) => {
      this.process = spawn('opencode', args, {
        cwd: config.cwd,
        env: { ...process.env, ...config.env },
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

      this.process.on('close', (code) => {
        this.process = null;
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`opencode exited with code ${code}`));
        }
      });

      this.process.on('error', (error) => {
        this.process = null;
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
}
