#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { performance } = require('perf_hooks');
const chalk = require('chalk');
const ora = require('ora');
const ValidatorManager = require('../lib/validator-manager');
const PerformanceCollector = require('../lib/performance-collector');
const { loadConfig } = require('../lib/config-loader');

class ValidatorBenchmark {
  constructor() {
    this.results = {};
    this.config = null;
    this.validatorManager = null;
    this.performanceCollector = null;
  }

  async initialize() {
    this.config = await loadConfig();
    this.validatorManager = new ValidatorManager(this.config);
    this.performanceCollector = new PerformanceCollector();
  }

  async run() {
    console.log(chalk.blue('  Starting Solana Test Validator Benchmark\n'));

    try {
      await this.initialize();
      
      const tests = [
        { name: 'Startup Time', fn: this.benchmarkStartup.bind(this) },
        { name: 'RPC Response Time', fn: this.benchmarkRpcResponse.bind(this) },
        { name: 'Transaction Throughput', fn: this.benchmarkTransactionThroughput.bind(this) },
        { name: 'Memory Usage', fn: this.benchmarkMemoryUsage.bind(this) },
        { name: 'Restart Performance', fn: this.benchmarkRestart.bind(this) },
      ];

      for (const test of tests) {
        console.log(chalk.yellow(`\n  Running ${test.name} test...`));
        try {
          await test.fn();
          console.log(chalk.green(`  ${test.name} completed`));
        } catch (error) {
          console.log(chalk.red(`  ${test.name} failed: ${error.message}`));
          this.results[test.name] = { error: error.message };
        }
      }

      await this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('Benchmark failed:'), error.message);
    } finally {
      // Ensure validator is stopped
      try {
        await this.validatorManager.stop();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async benchmarkStartup() {
    const spinner = ora('Starting validator...').start();
    
    const startTime = performance.now();
    await this.validatorManager.start({ environment: 'development' });
    const endTime = performance.now();
    
    const startupTime = endTime - startTime;
    spinner.succeed(`Startup completed in ${(startupTime / 1000).toFixed(2)}s`);
    
    this.results['Startup Time'] = {
      duration: startupTime,
      durationSeconds: (startupTime / 1000).toFixed(2),
      status: startupTime < 30000 ? 'Good' : startupTime < 60000 ? 'Fair' : 'Slow'
    };
  }

  async benchmarkRpcResponse() {
    const { execa } = require('execa');
    const spinner = ora('Testing RPC response time...').start();
    
    const tests = [];
    const numTests = 10;

    for (let i = 0; i < numTests; i++) {
      const startTime = performance.now();
      try {
        await execa('solana', ['cluster-version', '--url', 'http://localhost:8899'], {
          timeout: 10000
        });
        const endTime = performance.now();
        tests.push(endTime - startTime);
      } catch (error) {
        console.log(`RPC test ${i + 1} failed:`, error.message);
      }
    }

    if (tests.length === 0) {
      throw new Error('All RPC tests failed');
    }

    const avgResponseTime = tests.reduce((a, b) => a + b, 0) / tests.length;
    const minResponseTime = Math.min(...tests);
    const maxResponseTime = Math.max(...tests);

    spinner.succeed(`RPC response time: ${avgResponseTime.toFixed(2)}ms avg`);

    this.results['RPC Response Time'] = {
      average: avgResponseTime.toFixed(2),
      min: minResponseTime.toFixed(2),
      max: maxResponseTime.toFixed(2),
      tests: tests.length,
      status: avgResponseTime < 100 ? 'Excellent' : avgResponseTime < 500 ? 'Good' : 'Slow'
    };
  }

  async benchmarkTransactionThroughput() {
    const { execa } = require('execa');
    const spinner = ora('Testing transaction throughput...').start();

    try {
      // Create a test keypair
      const testKeypair = await execa('solana-keygen', ['new', '--no-bip39-passphrase', '--silent', '--outfile', '/tmp/test-benchmark.json']);
      
      // Request airdrop
      await execa('solana', ['airdrop', '10', '/tmp/test-benchmark.json', '--url', 'http://localhost:8899']);
      
      // Measure transaction rate
      const startTime = performance.now();
      const numTransactions = 5;
      
      const promises = [];
      for (let i = 0; i < numTransactions; i++) {
        promises.push(
          execa('solana', ['transfer', '/tmp/test-benchmark.json', '0.1', '--url', 'http://localhost:8899', '--allow-unfunded-recipient'])
        );
      }

      await Promise.all(promises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const tps = (numTransactions / duration) * 1000;

      // Cleanup
      await fs.remove('/tmp/test-benchmark.json').catch(() => {});

      spinner.succeed(`Transaction throughput: ${tps.toFixed(2)} TPS`);

      this.results['Transaction Throughput'] = {
        tps: tps.toFixed(2),
        transactions: numTransactions,
        duration: (duration / 1000).toFixed(2),
        status: tps > 100 ? 'Excellent' : tps > 50 ? 'Good' : 'Fair'
      };

    } catch (error) {
      spinner.fail('Transaction throughput test failed');
      throw error;
    }
  }

  async benchmarkMemoryUsage() {
    const spinner = ora('Monitoring memory usage...').start();
    
    const measurements = [];
    const duration = 10000; // 10 seconds
    const interval = 1000; // 1 second

    for (let i = 0; i < duration / interval; i++) {
      try {
        const metrics = await this.performanceCollector.collect();
        if (metrics && metrics.validator) {
          measurements.push(metrics.validator.memory);
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.log('Memory measurement failed:', error.message);
      }
    }

    if (measurements.length === 0) {
      throw new Error('No memory measurements collected');
    }

    const avgMemory = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const maxMemory = Math.max(...measurements);
    const minMemory = Math.min(...measurements);

    spinner.succeed(`Memory usage: ${avgMemory.toFixed(0)}MB avg`);

    this.results['Memory Usage'] = {
      average: Math.round(avgMemory),
      max: maxMemory,
      min: minMemory,
      samples: measurements.length,
      status: avgMemory < 1000 ? 'Good' : avgMemory < 2000 ? 'Fair' : 'High'
    };
  }

  async benchmarkRestart() {
    const spinner = ora('Testing restart performance...').start();
    
    const startTime = performance.now();
    await this.validatorManager.restart({ environment: 'development' });
    const endTime = performance.now();
    
    const restartTime = endTime - startTime;
    spinner.succeed(`Restart completed in ${(restartTime / 1000).toFixed(2)}s`);
    
    this.results['Restart Performance'] = {
      duration: restartTime,
      durationSeconds: (restartTime / 1000).toFixed(2),
      status: restartTime < 45000 ? 'Good' : restartTime < 90000 ? 'Fair' : 'Slow'
    };
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const reportDir = path.join(this.config.validator.ledger_dir, '..', 'benchmark-reports');
    await fs.ensureDir(reportDir);
    
    const reportFile = path.join(reportDir, `benchmark-${Date.now()}.json`);
    
    const report = {
      timestamp,
      environment: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        solanaVersion: await this.getSolanaVersion()
      },
      results: this.results,
      summary: this.generateSummary()
    };

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    console.log(chalk.blue('\n  Benchmark Report\n'));
    
    // Display results in a table format
    Object.entries(this.results).forEach(([testName, result]) => {
      if (result.error) {
        console.log(chalk.red(`  ${testName}: ${result.error}`));
      } else {
        const status = this.getStatusIcon(result.status);
        console.log(`${status} ${chalk.bold(testName)}: ${this.formatResult(testName, result)}`);
      }
    });

    console.log(chalk.blue(`\n  Detailed report saved to: ${reportFile}`));
    
    // Display summary
    const summary = this.generateSummary();
    console.log(chalk.blue('\n  Summary:'));
    console.log(`Overall Performance: ${this.getStatusIcon(summary.overall)} ${summary.overall}`);
    console.log(`Recommendation: ${summary.recommendation}`);
  }

  formatResult(testName, result) {
    switch (testName) {
      case 'Startup Time':
      case 'Restart Performance':
        return `${result.durationSeconds}s (${result.status})`;
      case 'RPC Response Time':
        return `${result.average}ms avg, ${result.min}ms min, ${result.max}ms max (${result.status})`;
      case 'Transaction Throughput':
        return `${result.tps} TPS over ${result.transactions} transactions (${result.status})`;
      case 'Memory Usage':
        return `${result.average}MB avg, ${result.max}MB max (${result.status})`;
      default:
        return JSON.stringify(result);
    }
  }

  getStatusIcon(status) {
    const icons = {
      'Excellent': ' ',
      'Good': ' ',
      'Fair': ' ',
      'Slow': ' ',
      'High': ' '
    };
    return icons[status] || ' ';
  }

  generateSummary() {
    const statuses = Object.values(this.results)
      .filter(r => r.status)
      .map(r => r.status);
    
    const excellentCount = statuses.filter(s => s === 'Excellent').length;
    const goodCount = statuses.filter(s => s === 'Good').length;
    const fairCount = statuses.filter(s => s === 'Fair').length;
    const problemCount = statuses.filter(s => ['Slow', 'High'].includes(s)).length;

    let overall = 'Good';
    let recommendation = 'Performance is within acceptable ranges.';

    if (excellentCount > statuses.length * 0.7) {
      overall = 'Excellent';
      recommendation = 'Outstanding performance! Your setup is optimal for development.';
    } else if (problemCount > 0) {
      overall = 'Needs Improvement';
      recommendation = 'Consider optimizing your system or validator configuration.';
    } else if (fairCount > statuses.length * 0.5) {
      overall = 'Fair';
      recommendation = 'Performance is acceptable but could be improved.';
    }

    return {
      overall,
      recommendation,
      testsPassed: statuses.length - Object.values(this.results).filter(r => r.error).length,
      totalTests: Object.keys(this.results).length
    };
  }

  async getSolanaVersion() {
    try {
      const { execa } = require('execa');
      const result = await execa('solana', ['--version']);
      return result.stdout.trim();
    } catch (error) {
      return 'Unknown';
    }
  }
}

// Main execution
if (require.main === module) {
  const benchmark = new ValidatorBenchmark();
  benchmark.run().catch(error => {
    console.error(chalk.red('Benchmark failed:'), error.message);
    process.exit(1);
  });
}

module.exports = ValidatorBenchmark;