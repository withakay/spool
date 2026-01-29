import { spawn } from 'child_process';
import { closeSync, existsSync, openSync, statSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const cliEntry = path.join(projectRoot, 'dist', 'cli', 'index.js');
const srcCliEntry = path.join(projectRoot, 'spool-bun', 'src', 'cli', 'index.ts');
const buildLockPath = path.join(projectRoot, '.spool-test-build.lock');

let buildPromise: Promise<void> | undefined;

function sleepSync(ms: number) {
  // Node doesn't have a synchronous sleep; Atomics.wait is a portable option.
  const shared = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(shared, 0, 0, ms);
}

function acquireBuildLock(timeoutMs = 60_000) {
  const start = Date.now();

  while (true) {
    try {
      const fd = openSync(buildLockPath, 'wx');
      closeSync(fd);
      return;
    } catch {
      // If the lock is stale (e.g., previous test crashed), clear it.
      try {
        const ageMs = Date.now() - statSync(buildLockPath).mtimeMs;
        if (ageMs > 2 * 60_000) {
          unlinkSync(buildLockPath);
          continue;
        }
      } catch {
        // ignore
      }

      if (Date.now() - start > timeoutMs) {
        throw new Error('Timed out waiting for build lock');
      }

      sleepSync(50);
    }
  }
}

function releaseBuildLock() {
  try {
    unlinkSync(buildLockPath);
  } catch {
    // ignore
  }
}

interface RunCommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

interface RunCLIOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  timeoutMs?: number;
}

export interface RunCLIResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  command: string;
}

function runCommand(command: string, args: string[], options: RunCommandOptions = {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? projectRoot,
      env: { ...process.env, ...options.env },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        reject(new Error(`Command failed (${reason}): ${command} ${args.join(' ')}`));
      }
    });
  });
}

export async function ensureCliBuilt() {
  const isStale =
    existsSync(cliEntry) &&
    existsSync(srcCliEntry) &&
    statSync(cliEntry).mtimeMs < statSync(srcCliEntry).mtimeMs;

  // Avoid rebuilding during test runs once the CLI exists and is up-to-date;
  // rebuilding can race with parallel Vitest workers.
  if (existsSync(cliEntry) && !isStale) return;

  if (!buildPromise) {
    buildPromise = (async () => {
      acquireBuildLock();
      try {
        // Another worker may have built while we waited.
        const innerIsStale =
          existsSync(cliEntry) &&
          existsSync(srcCliEntry) &&
          statSync(cliEntry).mtimeMs < statSync(srcCliEntry).mtimeMs;

        if (!existsSync(cliEntry) || innerIsStale) {
          await runCommand('bun', ['run', 'build']);
        }
      } finally {
        releaseBuildLock();
      }
    })().catch((error) => {
      buildPromise = undefined;
      throw error;
    });
  }

  await buildPromise;

  if (!existsSync(cliEntry)) {
    throw new Error('CLI entry point missing after build. Expected dist/cli/index.js');
  }
}

export async function runCLI(
  args: string[] = [],
  options: RunCLIOptions = {}
): Promise<RunCLIResult> {
  await ensureCliBuilt();

  const finalArgs = Array.isArray(args) ? args : [args];
  const invocation = [cliEntry, ...finalArgs].join(' ');

  if (options.env?.SPOOL_RUN_CLI_IN_PROCESS === '1') {
    return await runCLIInProcess(finalArgs, options, invocation);
  }

  return new Promise<RunCLIResult>((resolve, reject) => {
    const child = spawn(process.execPath, [cliEntry, ...finalArgs], {
      cwd: options.cwd ?? projectRoot,
      env: {
        ...process.env,
        SPOOL_INTERACTIVE: '0',
        ...options.env,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    // Prevent child process from keeping the event loop alive
    child.unref();

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = options.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill('SIGKILL');
        }, options.timeoutMs)
      : undefined;

    child.stdout?.setEncoding('utf-8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr?.setEncoding('utf-8');
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      if (timeout) clearTimeout(timeout);
      // Explicitly destroy streams to prevent hanging handles
      child.stdout?.destroy();
      child.stderr?.destroy();
      child.stdin?.destroy();
      reject(error);
    });

    child.on('close', (code, signal) => {
      if (timeout) clearTimeout(timeout);
      // Explicitly destroy streams to prevent hanging handles
      child.stdout?.destroy();
      child.stderr?.destroy();
      child.stdin?.destroy();
      resolve({
        exitCode: code,
        signal,
        stdout,
        stderr,
        timedOut,
        command: `node ${invocation}`,
      });
    });

    if (options.input && child.stdin) {
      child.stdin.end(options.input);
    } else if (child.stdin) {
      child.stdin.end();
    }
  });
}

async function runCLIInProcess(
  finalArgs: string[],
  options: RunCLIOptions,
  invocation: string
): Promise<RunCLIResult> {
  const originalArgv = process.argv;
  const originalCwd = process.cwd();
  const originalExit = process.exit;
  const originalExitCode = process.exitCode;
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const envKeys = new Set<string>(['SPOOL_INTERACTIVE', ...Object.keys(options.env ?? {})]);
  const previousEnv = new Map<string, string | undefined>();
  for (const key of envKeys) {
    previousEnv.set(key, process.env[key]);
  }

  let stdout = '';
  let stderr = '';
  let timedOut = false;

  const restore = () => {
    process.argv = originalArgv;
    process.exit = originalExit;
    process.exitCode = originalExitCode;
    process.stdout.write = originalStdoutWrite as any;
    process.stderr.write = originalStderrWrite as any;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.chdir(originalCwd);

    for (const [key, value] of previousEnv.entries()) {
      if (typeof value === 'undefined') {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };

  const run = async (): Promise<number> => {
    process.chdir(options.cwd ?? projectRoot);
    process.argv = [process.execPath, cliEntry, ...finalArgs];
    process.exitCode = 0;

    process.env.SPOOL_INTERACTIVE = '0';
    if (options.env) {
      for (const [key, value] of Object.entries(options.env)) {
        if (typeof value === 'undefined') continue;
        process.env[key] = value;
      }
    }

    // Capture output without printing to the test runner.
    process.stdout.write = ((chunk: any) => {
      stdout += typeof chunk === 'string' ? chunk : (chunk?.toString?.() ?? '');
      return true;
    }) as any;
    process.stderr.write = ((chunk: any) => {
      stderr += typeof chunk === 'string' ? chunk : (chunk?.toString?.() ?? '');
      return true;
    }) as any;

    console.log = (...args: any[]) => {
      stdout += `${args.map(String).join(' ')}\n`;
    };
    console.error = (...args: any[]) => {
      stderr += `${args.map(String).join(' ')}\n`;
    };

    // Intercept process.exit so we can return a result instead of terminating Vitest.
    process.exit = ((code?: number) => {
      const err: any = new Error('__SPOOL_TEST_PROCESS_EXIT__');
      err.__spoolExitCode = typeof code === 'number' ? code : (process.exitCode ?? 0);
      throw err;
    }) as any;

    try {
      // Import source CLI so Vitest mocks apply.
      const srcCli = path.join(projectRoot, 'spool-bun', 'src', 'cli', 'index.ts');
      const href = `${pathToFileURL(srcCli).href}?run=${Date.now()}`;
      await import(href);
      return typeof process.exitCode === 'number' ? process.exitCode : 0;
    } catch (error: any) {
      if (error?.message === '__SPOOL_TEST_PROCESS_EXIT__') {
        return error.__spoolExitCode ?? 1;
      }
      return 1;
    }
  };

  const timeoutMs = options.timeoutMs;
  try {
    const exitCode = timeoutMs
      ? await Promise.race([
          run(),
          new Promise<number>((resolve) =>
            setTimeout(() => {
              timedOut = true;
              resolve(1);
            }, timeoutMs)
          ),
        ])
      : await run();

    return {
      exitCode,
      signal: null,
      stdout,
      stderr,
      timedOut,
      command: `node ${invocation}`,
    };
  } finally {
    restore();
  }
}

export const cliProjectRoot = projectRoot;
