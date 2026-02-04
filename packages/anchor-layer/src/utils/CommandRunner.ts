import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { EventEmitter } from 'events';

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface CommandOptions extends SpawnOptions {
  timeout?: number;
  silent?: boolean;
  captureOutput?: boolean;
}

export class CommandRunner extends EventEmitter {
  private activeCommands = new Map<string, ChildProcess>();

  public async run(command: string, args: string[] = [], options: CommandOptions = {}): Promise<CommandResult> {
    const startTime = Date.now();
    const commandId = `${command}-${Date.now()}`;
    
    const {
      timeout = 0,
      silent = false,
      captureOutput = true,
      ...spawnOptions
    } = options;

    const defaultOptions: SpawnOptions = {
      stdio: captureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit',
      env: { ...process.env, ...spawnOptions.env },
      cwd: spawnOptions.cwd || process.cwd(),
      ...spawnOptions
    };

    return new Promise((resolve, reject) => {
      if (!silent) {
        this.emit('command:start', { command, args, commandId });
      }

      const process = spawn(command, args, defaultOptions);
      this.activeCommands.set(commandId, process);

      let stdout = '';
      let stderr = '';

      if (captureOutput) {
        process.stdout?.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          if (!silent) {
            this.emit('command:stdout', { commandId, data: output });
          }
        });

        process.stderr?.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          if (!silent) {
            this.emit('command:stderr', { commandId, data: output });
          }
        });
      }

      // Set timeout if specified
      let timeoutHandle: NodeJS.Timeout | undefined;
      if (timeout > 0) {
        timeoutHandle = setTimeout(() => {
          process.kill('SIGTERM');
          reject(new Error(`Command timed out after ${timeout}ms: ${command} ${args.join(' ')}`));
        }, timeout);
      }

      process.on('close', (exitCode) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        this.activeCommands.delete(commandId);
        const duration = Date.now() - startTime;

        const result: CommandResult = {
          exitCode: exitCode || 0,
          stdout,
          stderr,
          duration
        };

        if (!silent) {
          this.emit('command:complete', { commandId, result });
        }

        if (exitCode === 0) {
          resolve(result);
        } else {
          const error = new Error(`Command failed with exit code ${exitCode}: ${command} ${args.join(' ')}\n${stderr}`);
          (error as any).result = result;
          reject(error);
        }
      });

      process.on('error', (error) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        
        this.activeCommands.delete(commandId);
        
        if (!silent) {
          this.emit('command:error', { commandId, error });
        }
        
        reject(error);
      });
    });
  }

  public async runAnchor(subcommand: string, args: string[] = [], options: CommandOptions = {}): Promise<CommandResult> {
    return this.run('anchor', [subcommand, ...args], options);
  }

  public async runNpm(subcommand: string, args: string[] = [], options: CommandOptions = {}): Promise<CommandResult> {
    return this.run('npm', [subcommand, ...args], options);
  }

  public async runYarn(args: string[] = [], options: CommandOptions = {}): Promise<CommandResult> {
    return this.run('yarn', args, options);
  }

  public async runCargo(subcommand: string, args: string[] = [], options: CommandOptions = {}): Promise<CommandResult> {
    return this.run('cargo', [subcommand, ...args], options);
  }

  public async runSolana(subcommand: string, args: string[] = [], options: CommandOptions = {}): Promise<CommandResult> {
    return this.run('solana', [subcommand, ...args], options);
  }

  public killCommand(commandId: string): boolean {
    const process = this.activeCommands.get(commandId);
    if (process) {
      process.kill('SIGTERM');
      this.activeCommands.delete(commandId);
      return true;
    }
    return false;
  }

  public killAllCommands(): void {
    for (const [commandId, process] of this.activeCommands) {
      process.kill('SIGTERM');
    }
    this.activeCommands.clear();
  }

  public getActiveCommands(): string[] {
    return Array.from(this.activeCommands.keys());
  }

  // Convenience methods for common Anchor operations
  public async anchorBuild(options: CommandOptions = {}): Promise<CommandResult> {
    return this.runAnchor('build', [], { 
      timeout: 60000, // 1 minute default timeout
      ...options 
    });
  }

  public async anchorTest(testFile?: string, options: CommandOptions = {}): Promise<CommandResult> {
    const args = testFile ? ['--', '--testNamePattern', testFile] : [];
    return this.runAnchor('test', args, {
      timeout: 120000, // 2 minutes default timeout
      ...options
    });
  }

  public async anchorDeploy(network?: string, options: CommandOptions = {}): Promise<CommandResult> {
    const args = network ? ['--provider.cluster', network] : [];
    return this.runAnchor('deploy', args, {
      timeout: 180000, // 3 minutes default timeout
      ...options
    });
  }

  public async anchorClean(options: CommandOptions = {}): Promise<CommandResult> {
    return this.runAnchor('clean', [], options);
  }

  public async anchorInit(projectName: string, options: CommandOptions = {}): Promise<CommandResult> {
    return this.runAnchor('init', [projectName], options);
  }

  // Utility for running commands with real-time output streaming
  public streamCommand(
    command: string, 
    args: string[] = [], 
    options: CommandOptions = {}
  ): ChildProcess {
    const commandId = `${command}-stream-${Date.now()}`;
    
    const defaultOptions: SpawnOptions = {
      stdio: 'inherit',
      env: { ...process.env, ...options.env },
      cwd: options.cwd || process.cwd(),
      ...options
    };

    const process = spawn(command, args, defaultOptions);
    this.activeCommands.set(commandId, process);

    this.emit('command:start', { command, args, commandId, streaming: true });

    process.on('close', (exitCode) => {
      this.activeCommands.delete(commandId);
      this.emit('command:complete', { commandId, exitCode, streaming: true });
    });

    process.on('error', (error) => {
      this.activeCommands.delete(commandId);
      this.emit('command:error', { commandId, error, streaming: true });
    });

    return process;
  }

  // Execute multiple commands in parallel
  public async runParallel(commands: Array<{
    command: string;
    args?: string[];
    options?: CommandOptions;
  }>): Promise<CommandResult[]> {
    const promises = commands.map(({ command, args = [], options = {} }) =>
      this.run(command, args, options)
    );

    return Promise.all(promises);
  }

  // Execute multiple commands in sequence
  public async runSequence(commands: Array<{
    command: string;
    args?: string[];
    options?: CommandOptions;
  }>): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const { command, args = [], options = {} } of commands) {
      const result = await this.run(command, args, options);
      results.push(result);
    }

    return results;
  }
}