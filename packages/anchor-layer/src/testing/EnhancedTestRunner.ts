import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { WebSocketServer } from 'ws';
import chalk from 'chalk';
import ora from 'ora';
import { performance } from 'perf_hooks';

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

export interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
  coverage?: {
    overall: number;
    files: Record<string, any>;
  };
}

export interface TestRunnerConfig {
  realTimeResults?: boolean;
  parallelExecution?: boolean;
  coverageReporting?: boolean;
  websocketPort?: number;
}

export class EnhancedTestRunner extends EventEmitter {
  private config: TestRunnerConfig;
  private wsServer?: WebSocketServer;
  private currentRun?: ChildProcess;
  private spinner: any;

  constructor(config: TestRunnerConfig = {}) {
    super();
    this.config = {
      realTimeResults: true,
      parallelExecution: true,
      coverageReporting: true,
      websocketPort: 8765,
      ...config
    };
  }

  public async runTests(testPattern?: string): Promise<TestSuiteResult[]> {
    this.emit('test:start', { pattern: testPattern });
    
    const startTime = performance.now();
    this.spinner = ora('Running enhanced Anchor tests...').start();

    try {
      // Run anchor test with enhanced monitoring
      const results = await this.executeAnchorTests(testPattern);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.spinner.succeed(chalk.green('Tests completed successfully'));
      
      const finalResults = {
        ...results,
        totalDuration: duration
      };

      this.emit('test:complete', finalResults);
      return results;
    } catch (error) {
      this.spinner.fail(chalk.red('Test run failed'));
      this.emit('test:error', error);
      throw error;
    }
  }

  private async executeAnchorTests(testPattern?: string): Promise<TestSuiteResult[]> {
    return new Promise((resolve, reject) => {
      const args = ['test'];
      if (testPattern) {
        args.push('--', '--testPathPattern', testPattern);
      }

      // Add parallel execution flag if enabled
      if (this.config.parallelExecution) {
        args.push('--parallel');
      }

      // Add coverage flag if enabled
      if (this.config.coverageReporting) {
        args.push('--coverage');
      }

      this.currentRun = spawn('anchor', args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      let outputBuffer = '';
      let errorBuffer = '';
      const testResults: TestSuiteResult[] = [];

      this.currentRun.stdout?.on('data', (data) => {
        const output = data.toString();
        outputBuffer += output;
        
        // Parse real-time test output
        this.parseTestOutput(output, testResults);
        
        // Emit real-time updates if enabled
        if (this.config.realTimeResults) {
          this.emit('test:output', output);
          this.broadcastTestUpdate(output);
        }
      });

      this.currentRun.stderr?.on('data', (data) => {
        const error = data.toString();
        errorBuffer += error;
        this.emit('test:error:output', error);
      });

      this.currentRun.on('close', (code) => {
        if (code === 0) {
          const finalResults = this.parseFinalResults(outputBuffer);
          resolve(finalResults);
        } else {
          reject(new Error(`Test process exited with code ${code}: ${errorBuffer}`));
        }
      });

      this.currentRun.on('error', (error) => {
        reject(error);
      });
    });
  }

  private parseTestOutput(output: string, results: TestSuiteResult[]): void {
    // Parse Jest/Mocha style output for real-time updates
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Match test completion patterns
      const testMatch = line.match(/^\s* \s+(.+?)\s+\((\d+)ms\)/);
      if (testMatch) {
        this.emit('test:individual:complete', {
          name: testMatch[1],
          status: 'passed',
          duration: parseInt(testMatch[2])
        });
      }

      const failedMatch = line.match(/^\s* \s+(.+)/);
      if (failedMatch) {
        this.emit('test:individual:failed', {
          name: failedMatch[1],
          status: 'failed'
        });
      }

      // Update spinner with current test name
      const runningMatch = line.match(/Running test: (.+)/);
      if (runningMatch && this.spinner) {
        this.spinner.text = `Running: ${runningMatch[1]}`;
      }
    }
  }

  private parseFinalResults(output: string): TestSuiteResult[] {
    // Parse the complete test output for final results
    const suites: TestSuiteResult[] = [];
    
    // This is a simplified parser - in reality, you'd parse the actual test framework output
    const suiteMatch = output.match(/Test Suites:\s+(\d+)\s+passed/);
    const testMatch = output.match(/Tests:\s+(\d+)\s+passed/);
    
    if (suiteMatch && testMatch) {
      suites.push({
        suiteName: 'Anchor Test Suite',
        totalTests: parseInt(testMatch[1]),
        passed: parseInt(testMatch[1]),
        failed: 0,
        skipped: 0,
        duration: 0,
        tests: []
      });
    }

    return suites;
  }

  private broadcastTestUpdate(output: string): void {
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'test:update',
            data: output,
            timestamp: Date.now()
          }));
        }
      });
    }
  }

  public async enableRealTimeReporting(): Promise<void> {
    if (this.wsServer) return;

    this.wsServer = new WebSocketServer({ port: this.config.websocketPort });
    
    this.wsServer.on('connection', (ws) => {
      console.log(chalk.blue('Client connected for real-time test updates'));
      
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Real-time test reporting enabled'
      }));

      ws.on('close', () => {
        console.log(chalk.yellow('Client disconnected from test updates'));
      });
    });

    console.log(chalk.green(`Real-time test reporting started on port ${this.config.websocketPort}`));
  }

  public async disableRealTimeReporting(): Promise<void> {
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = undefined;
      console.log(chalk.yellow('Real-time test reporting stopped'));
    }
  }

  public stopCurrentRun(): void {
    if (this.currentRun) {
      this.currentRun.kill('SIGTERM');
      this.currentRun = undefined;
      if (this.spinner) {
        this.spinner.stop();
      }
    }
  }

  // Integration with anchor test command
  public createTestWatcher(): void {
    const chokidar = require('chokidar');
    
    // Watch for file changes in tests/ and programs/
    const watcher = chokidar.watch(['tests/**/*.ts', 'programs/**/*.rs'], {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath: string) => {
      console.log(chalk.cyan(`File changed: ${filePath}`));
      console.log(chalk.yellow('Auto-running tests...'));
      
      try {
        await this.runTests();
      } catch (error) {
        console.error(chalk.red('Auto-test failed:', error));
      }
    });

    console.log(chalk.green('Test watcher started - tests will run automatically on file changes'));
  }
}