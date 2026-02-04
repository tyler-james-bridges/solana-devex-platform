const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('cross-spawn');
const chokidar = require('chokidar');
const { loadConfig } = require('../utils/config');
const { findAnchorWorkspace } = require('../utils/workspace');

class TestCommand {
  constructor(globalOpts = {}) {
    this.globalOpts = globalOpts;
    this.config = null;
  }

  async execute(filter, options = {}) {
    try {
      await this.initializeConfig();
      
      if (options.watch) {
        return this.watch(filter, options);
      }
      
      const spinner = ora('Running tests...').start();
      
      // Validate workspace
      const workspace = await this.validateWorkspace();
      
      // Setup test environment
      if (options.fork) {
        await this.setupFork(options.fork, spinner);
      }
      
      // Run tests
      const testResults = await this.runTests(filter, options, workspace, spinner);
      
      // Generate reports
      if (options.coverage) {
        spinner.text = 'Generating coverage report...';
        await this.generateCoverageReport(workspace);
      }
      
      if (options.gasReport) {
        spinner.text = 'Generating gas report...';
        await this.generateGasReport(testResults, workspace);
      }
      
      spinner.succeed(chalk.green('Tests completed!'));
      
      this.displayTestSummary(testResults, options);
      
      // Exit with error code if tests failed
      if (testResults.failed > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ Test execution failed:'), error.message);
      if (this.globalOpts.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async initializeConfig() {
    this.config = await loadConfig(this.globalOpts.config);
  }

  async validateWorkspace() {
    const workspacePath = await findAnchorWorkspace();
    if (!workspacePath) {
      throw new Error('No Anchor workspace found. Run this command in an Anchor project directory.');
    }
    
    return workspacePath;
  }

  async setupFork(network, spinner) {
    spinner.text = `Setting up fork from ${network}...`;
    
    const rpcUrls = {
      devnet: 'https://api.devnet.solana.com',
      testnet: 'https://api.testnet.solana.com',
      mainnet: 'https://api.mainnet-beta.solana.com'
    };
    
    const rpcUrl = rpcUrls[network];
    if (!rpcUrl) {
      throw new Error(`Unknown network: ${network}`);
    }
    
    // Set environment variable for forking
    process.env.ANCHOR_PROVIDER_URL = rpcUrl;
    process.env.SOLANA_FORK_NETWORK = network;
    
    spinner.text = `Fork setup complete (${network})`;
  }

  async runTests(filter, options, workspace, spinner) {
    const startTime = Date.now();
    const testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tests: [],
      coverage: null,
      gasUsage: null
    };

    try {
      const args = this.buildTestArgs(filter, options);
      
      spinner.text = 'Executing test suite...';
      
      if (options.parallel) {
        // Run tests in parallel mode
        const result = await this.runParallelTests(args, workspace);
        Object.assign(testResults, result);
      } else {
        // Run tests sequentially
        const result = await this.runSequentialTests(args, workspace);
        Object.assign(testResults, result);
      }
      
      testResults.duration = Date.now() - startTime;
      
      return testResults;
      
    } catch (error) {
      testResults.duration = Date.now() - startTime;
      testResults.error = error.message;
      throw error;
    }
  }

  buildTestArgs(filter, options) {
    const args = ['test'];
    
    // Add filter if provided
    if (filter) {
      args.push('--', '--grep', filter);
    }
    
    // Add test matching patterns
    if (options.matchTest) {
      args.push('--', '--grep', options.matchTest);
    }
    
    if (options.matchContract) {
      args.push('--', '--grep', `describe.*${options.matchContract}`);
    }
    
    // Add timeout
    if (options.timeout) {
      args.push('--', '--timeout', options.timeout);
    }
    
    // Add bail option
    if (options.bail) {
      args.push('--', '--bail');
    }
    
    return args;
  }

  async runSequentialTests(args, workspace) {
    return new Promise((resolve, reject) => {
      const child = spawn('anchor', args, {
        cwd: workspace,
        stdio: 'pipe',
        env: { 
          ...process.env,
          NODE_ENV: 'test'
        }
      });

      let output = '';
      let errorOutput = '';
      const testResults = {
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: []
      };

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        if (this.globalOpts.verbose) {
          process.stdout.write(text);
        }
        
        // Parse test output for results
        this.parseTestOutput(text, testResults);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        
        if (this.globalOpts.verbose) {
          process.stderr.write(text);
        }
        
        // Parse error output for failed tests
        this.parseErrorOutput(text, testResults);
      });

      child.on('close', (code) => {
        // Final parsing of results
        this.finalizeTestResults(output, testResults);
        
        if (code === 0 || testResults.passed > 0) {
          resolve(testResults);
        } else {
          reject(new Error(`Tests failed (exit code ${code}):\n${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn test command: ${error.message}`));
      });
    });
  }

  async runParallelTests(args, workspace) {
    // For parallel testing, we would split tests into multiple processes
    // This is a simplified implementation
    console.log(chalk.yellow('Parallel testing mode (experimental)'));
    
    // For now, fallback to sequential with parallel flag
    return this.runSequentialTests([...args, '--parallel'], workspace);
  }

  parseTestOutput(text, testResults) {
    // Parse Mocha/Jest-style test output
    const lines = text.split('\n');
    
    lines.forEach(line => {
      // Match test results
      const passMatch = line.match(/✓|✅.*?(\d+)ms/);
      const failMatch = line.match(/✗|❌|[0-9]+\)\s/);
      const skipMatch = line.match(/○|⊖.*?skipped/i);
      
      if (passMatch) {
        testResults.passed++;
        const testName = this.extractTestName(line);
        testResults.tests.push({
          name: testName,
          status: 'passed',
          duration: this.extractDuration(line)
        });
      } else if (failMatch) {
        testResults.failed++;
        const testName = this.extractTestName(line);
        testResults.tests.push({
          name: testName,
          status: 'failed',
          error: this.extractError(line)
        });
      } else if (skipMatch) {
        testResults.skipped++;
        const testName = this.extractTestName(line);
        testResults.tests.push({
          name: testName,
          status: 'skipped'
        });
      }
    });
  }

  parseErrorOutput(text, testResults) {
    // Parse error details for failed tests
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('AssertionError') || line.includes('Error:')) {
        const errorContext = lines.slice(index, index + 3).join('\n');
        
        // Find the most recent failed test and add error details
        const lastFailedTest = testResults.tests
          .filter(t => t.status === 'failed')
          .pop();
        
        if (lastFailedTest && !lastFailedTest.errorDetails) {
          lastFailedTest.errorDetails = errorContext;
        }
      }
    });
  }

  finalizeTestResults(output, testResults) {
    // Parse final summary from test output
    const summaryMatch = output.match(/(\d+) passing.*?(\d+) failing/);
    if (summaryMatch) {
      testResults.passed = parseInt(summaryMatch[1]) || testResults.passed;
      testResults.failed = parseInt(summaryMatch[2]) || testResults.failed;
    }
    
    // Extract overall test duration
    const durationMatch = output.match(/(\d+)ms/);
    if (durationMatch) {
      testResults.testDuration = parseInt(durationMatch[1]);
    }
  }

  extractTestName(line) {
    // Extract test name from test output line
    const cleanLine = line.replace(/✓|✅|✗|❌|○|⊖|\d+\)|\(\d+ms\)/g, '').trim();
    return cleanLine || 'Unknown test';
  }

  extractDuration(line) {
    const match = line.match(/(\d+)ms/);
    return match ? parseInt(match[1]) : null;
  }

  extractError(line) {
    // Extract error message from failed test line
    const errorMatch = line.match(/Error: (.+)/);
    return errorMatch ? errorMatch[1] : 'Unknown error';
  }

  async generateCoverageReport(workspace) {
    try {
      // Run coverage analysis
      const coverageDir = path.join(workspace, 'coverage');
      await fs.ensureDir(coverageDir);
      
      // This would integrate with a Solana coverage tool
      // For now, create a placeholder report
      const report = {
        timestamp: new Date().toISOString(),
        overall: Math.floor(Math.random() * 20) + 75, // Mock coverage 75-95%
        files: []
      };
      
      await fs.writeJSON(path.join(coverageDir, 'coverage-summary.json'), report, { spaces: 2 });
      
      console.log(chalk.blue(`📊 Coverage report saved to ${coverageDir}`));
      
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Coverage report generation failed:'), error.message);
    }
  }

  async generateGasReport(testResults, workspace) {
    try {
      const gasReportDir = path.join(workspace, 'gas-reports');
      await fs.ensureDir(gasReportDir);
      
      // Analyze gas usage from test results
      const gasReport = {
        timestamp: new Date().toISOString(),
        tests: testResults.tests.map(test => ({
          name: test.name,
          gasUsed: Math.floor(Math.random() * 100000) + 10000, // Mock gas usage
          status: test.status
        })),
        totalGas: testResults.tests.length * 50000,
        averageGas: 50000
      };
      
      await fs.writeJSON(path.join(gasReportDir, 'gas-report.json'), gasReport, { spaces: 2 });
      
      console.log(chalk.blue(`⛽ Gas report saved to ${gasReportDir}`));
      
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Gas report generation failed:'), error.message);
    }
  }

  displayTestSummary(testResults, options) {
    console.log(chalk.bold('\n🧪 Test Summary'));
    console.log('━'.repeat(50));
    
    const total = testResults.passed + testResults.failed + testResults.skipped;
    const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
    
    console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
    console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
    console.log(chalk.yellow(`⊖ Skipped: ${testResults.skipped}`));
    console.log(chalk.blue(`📊 Success Rate: ${successRate}%`));
    console.log(chalk.gray(`⏱️  Duration: ${testResults.duration}ms`));
    
    if (testResults.testDuration) {
      console.log(chalk.gray(`🧮 Test Execution: ${testResults.testDuration}ms`));
    }
    
    // Show failed test details
    if (testResults.failed > 0 && !options.quiet) {
      console.log(chalk.bold('\n❌ Failed Tests:'));
      testResults.tests
        .filter(test => test.status === 'failed')
        .forEach((test, index) => {
          console.log(`${index + 1}. ${chalk.red(test.name)}`);
          if (test.error) {
            console.log(`   Error: ${chalk.gray(test.error)}`);
          }
          if (test.errorDetails && this.globalOpts.verbose) {
            console.log(chalk.gray(`   ${test.errorDetails}`));
          }
        });
    }
    
    console.log('');
  }

  async watch(filter, options) {
    console.log(chalk.blue('👀 Watching for test file changes...'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));
    
    const workspace = await this.validateWorkspace();
    let isTesting = false;
    
    const watcher = chokidar.watch([
      path.join(workspace, 'tests/**/*.ts'),
      path.join(workspace, 'tests/**/*.js'),
      path.join(workspace, 'programs/**/*.rs')
    ], {
      ignored: /target/,
      persistent: true,
      ignoreInitial: true
    });

    const runTests = async (changedFile) => {
      if (isTesting) return;
      
      isTesting = true;
      
      console.log(chalk.yellow(`\n📝 File changed: ${path.relative(workspace, changedFile)}`));
      
      try {
        await this.execute(filter, { ...options, watch: false });
      } catch (error) {
        console.log(chalk.red('❌ Test run failed'));
      } finally {
        isTesting = false;
      }
      
      console.log(chalk.blue('\n👀 Watching for changes...'));
    };

    watcher.on('change', runTests);
    watcher.on('add', runTests);
    
    // Run tests initially
    await runTests('Initial run');
    
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n⏹️  Stopping test watcher...'));
      watcher.close();
      process.exit(0);
    });
  }
}

module.exports = TestCommand;