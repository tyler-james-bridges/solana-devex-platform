#!/usr/bin/env node

/**
 * Solana DevEx CLI Tool
 * Functional developer tools for Solana builders
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');

// Import our functional modules
const SolanaProtocolTester = require('../lib/solana-tester');
const LiteSVMProtocolTester = require('../lib/litesvm-protocol-tester');
const CICDManager = require('../lib/cicd-manager');
const LiveMonitor = require('../lib/live-monitor');

const program = new Command();

program
  .name('solana-devex')
  .description('Complete development tools for Solana builders')
  .version('1.0.0');

/**
 * Testing Commands
 */
const testCommand = program
  .command('test')
  .description('Run protocol integration tests');

testCommand
  .command('protocols')
  .description('Test major Solana protocols')
  .option('-p, --protocols <protocols>', 'Comma-separated list of protocols (jupiter,kamino,drift,raydium)', 'jupiter,kamino,drift,raydium')
  .option('-n, --network <network>', 'Solana network (devnet,testnet,mainnet)', 'devnet')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const spinner = ora('Initializing protocol tests...').start();
    
    try {
      const protocols = options.protocols.split(',').map(p => p.trim());
      const rpcEndpoint = getRpcEndpoint(options.network);
      
      const tester = new SolanaProtocolTester(rpcEndpoint);
      
      spinner.text = 'Running protocol tests...';
      
      const results = await tester.runTestSuite(protocols);
      
      spinner.stop();
      
      // Display results
      console.log(chalk.bold.blue('\n🧪 Protocol Test Results\n'));
      
      results.forEach((result, index) => {
        const status = result.success ? 
          chalk.green('✅ PASSED') : 
          chalk.red('❌ FAILED');
        
        const latency = result.latency ? 
          chalk.gray(`(${result.latency}ms)`) : 
          '';
        
        console.log(`${index + 1}. ${chalk.bold(result.protocol.toUpperCase())} ${status} ${latency}`);
        console.log(`   ${result.message}`);
        
        if (options.verbose && result.data) {
          console.log(chalk.gray(`   Data: ${JSON.stringify(result.data, null, 2)}`));
        }
        
        if (result.error) {
          console.log(chalk.red(`   Error: ${result.error}`));
        }
        
        console.log('');
      });
      
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      const successRate = (passed / total * 100).toFixed(1);
      
      console.log(chalk.bold(`Summary: ${passed}/${total} tests passed (${successRate}% success rate)`));
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Test execution failed:'), error.message);
      process.exit(1);
    }
  });

testCommand
  .command('jupiter')
  .description('Test Jupiter swap integration')
  .option('-i, --input <mint>', 'Input token mint', 'So11111111111111111111111111111111111111112')
  .option('-o, --output <mint>', 'Output token mint', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  .option('-a, --amount <amount>', 'Amount to swap', '1')
  .action(async (options) => {
    const spinner = ora('Testing Jupiter swap...').start();
    
    try {
      const tester = new SolanaProtocolTester();
      const result = await tester.testJupiterSwap(options.input, options.output, parseFloat(options.amount));
      
      spinner.stop();
      
      if (result.success) {
        console.log(chalk.green('✅ Jupiter swap test PASSED'));
        console.log(`Input: ${options.amount} tokens`);
        console.log(`Output: ${result.data.outputAmount} tokens`);
        console.log(`Price Impact: ${result.data.priceImpact}%`);
        console.log(`Latency: ${result.latency}ms`);
      } else {
        console.log(chalk.red('❌ Jupiter swap test FAILED'));
        console.log(`Error: ${result.error || result.message}`);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Jupiter test failed:'), error.message);
    }
  });

/**
 * LiteSVM Protocol Testing Commands
 */
const liteTestCommand = program
  .command('litetest')
  .description('Ultra-fast protocol testing with LiteSVM + Anchor');

liteTestCommand
  .command('all')
  .description('Run comprehensive protocol test suite with LiteSVM')
  .option('-p, --protocols <protocols>', 'Comma-separated list of protocols (jupiter,kamino,drift,raydium)', 'jupiter,kamino,drift,raydium')
  .option('-c, --concurrent', 'Run tests concurrently for speed')
  .option('-v, --verbose', 'Verbose test output')
  .option('-o, --output <path>', 'Save test report to file')
  .option('--timeout <ms>', 'Test timeout in milliseconds', '60000')
  .action(async (options) => {
    console.log(chalk.bold.blue('🚀 LiteSVM Protocol Test Suite'));
    console.log(chalk.gray('Ultra-fast on-chain program testing with Anchor integration\n'));
    
    const spinner = ora('Initializing LiteSVM test environment...').start();
    
    try {
      const protocols = options.protocols.split(',').map(p => p.trim());
      const tester = new LiteSVMProtocolTester({
        verbose: options.verbose,
        testTimeout: parseInt(options.timeout),
        concurrent: options.concurrent
      });
      
      spinner.text = 'Running protocol tests...';
      const results = await tester.runProtocolTests(protocols);
      
      spinner.stop();
      
      // Display results
      console.log(chalk.bold.blue('\n📊 Test Results Summary\n'));
      
      // Protocol results
      Object.entries(results.protocols).forEach(([protocol, result]) => {
        const status = result.success ? 
          chalk.green('✅ PASSED') : 
          chalk.red('❌ FAILED');
        
        const duration = result.duration ? 
          chalk.gray(`(${result.duration}ms)`) : '';
        
        console.log(`${protocol.toUpperCase()}: ${status} ${duration}`);
        
        if (result.tests && result.tests.length > 0) {
          const passed = result.tests.filter(t => t.passed).length;
          console.log(chalk.gray(`  └─ ${passed}/${result.tests.length} tests passed`));
        }
        
        if (result.error) {
          console.log(chalk.red(`     Error: ${result.error}`));
        }
        console.log('');
      });
      
      // Performance metrics
      if (results.performance) {
        console.log(chalk.bold.blue('⚡ Performance Metrics'));
        console.log(`Total Duration: ${results.performance.totalDuration}ms`);
        console.log(`Average Duration: ${Math.round(results.performance.averageDuration)}ms`);
        console.log(`Test Velocity: ${results.performance.testVelocity.toFixed(2)} tests/sec`);
        if (results.performance.fastestProtocol) {
          console.log(`Fastest: ${results.performance.fastestProtocol.protocol} (${results.performance.fastestProtocol.duration}ms)`);
        }
        console.log('');
      }
      
      // Coverage report
      if (results.coverage && results.coverage.overall) {
        console.log(chalk.bold.blue('📈 Code Coverage'));
        console.log(`Overall: ${results.coverage.overall}%`);
        if (results.coverage.protocols) {
          Object.entries(results.coverage.protocols).forEach(([protocol, coverage]) => {
            console.log(`${protocol}: ${coverage}%`);
          });
        }
        console.log('');
      }
      
      // Summary
      const successRate = (results.summary.passed / results.summary.total * 100).toFixed(1);
      const summaryColor = results.summary.passed === results.summary.total ? chalk.green : chalk.yellow;
      
      console.log(summaryColor.bold(`🎯 Final Result: ${results.summary.passed}/${results.summary.total} protocols passed (${successRate}%)`));
      
      // Save report if requested
      if (options.output) {
        await tester.saveResults(results, options.output);
      }
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('❌ LiteSVM test execution failed:'), error.message);
      process.exit(1);
    }
  });

liteTestCommand
  .command('protocol <name>')
  .description('Test a specific protocol with LiteSVM')
  .option('-v, --verbose', 'Verbose output')
  .option('--timeout <ms>', 'Test timeout in milliseconds', '30000')
  .action(async (name, options) => {
    const validProtocols = ['jupiter', 'kamino', 'drift', 'raydium'];
    
    if (!validProtocols.includes(name)) {
      console.error(chalk.red(`❌ Invalid protocol: ${name}`));
      console.log(`Valid protocols: ${validProtocols.join(', ')}`);
      process.exit(1);
    }
    
    console.log(chalk.bold.blue(`🧪 Testing ${name.toUpperCase()} Protocol`));
    const spinner = ora(`Running ${name} tests...`).start();
    
    try {
      const tester = new LiteSVMProtocolTester({
        verbose: options.verbose,
        testTimeout: parseInt(options.timeout)
      });
      
      const result = await tester.runProtocolTest(name);
      
      spinner.stop();
      
      if (result.success) {
        console.log(chalk.green(`\n✅ ${name.toUpperCase()} tests PASSED`));
        console.log(`Duration: ${result.duration}ms`);
        
        if (result.tests && result.tests.length > 0) {
          const passed = result.tests.filter(t => t.passed).length;
          console.log(`Tests: ${passed}/${result.tests.length} passed`);
          
          if (options.verbose) {
            console.log(chalk.bold('\nTest Details:'));
            result.tests.forEach(test => {
              const icon = test.passed ? '✅' : '❌';
              console.log(`  ${icon} ${test.name} (${test.duration}ms)`);
            });
          }
        }
        
        if (result.coverage) {
          console.log(`Coverage: ${JSON.stringify(result.coverage)}%`);
        }
        
      } else {
        console.log(chalk.red(`\n❌ ${name.toUpperCase()} tests FAILED`));
        if (result.error) {
          console.log(chalk.red(`Error: ${result.error}`));
        }
      }
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red(`${name} test failed:`), error.message);
      process.exit(1);
    }
  });

liteTestCommand
  .command('setup')
  .description('Initialize LiteSVM testing environment')
  .option('--workspace <path>', 'Anchor workspace path', './anchor-workspace')
  .action(async (options) => {
    console.log(chalk.bold.blue('🔧 Setting up LiteSVM Testing Environment'));
    const spinner = ora('Creating workspace structure...').start();
    
    try {
      const tester = new LiteSVMProtocolTester({
        anchorWorkspace: options.workspace
      });
      
      await tester.validateWorkspace();
      
      spinner.stop();
      console.log(chalk.green('✅ LiteSVM environment setup complete!'));
      console.log(chalk.bold('\nNext steps:'));
      console.log('1. Install Rust and Anchor CLI if not already installed');
      console.log('2. Run: solana-devex litetest all');
      console.log('3. Customize tests in anchor-workspace/tests/');
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Setup failed:'), error.message);
      console.log(chalk.yellow('\nTroubleshooting:'));
      console.log('- Ensure Rust is installed: https://rustup.rs/');
      console.log('- Install Anchor CLI: cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked');
      console.log('- Check workspace path exists');
    }
  });

/**
 * Project Management Commands
 */
const projectCommand = program
  .command('project')
  .description('Project scaffolding and management');

projectCommand
  .command('create')
  .description('Create a new Solana project with best practices')
  .argument('<name>', 'Project name')
  .option('-p, --path <path>', 'Project path', '.')
  .option('--template <template>', 'Project template (basic,defi,nft,game)', 'basic')
  .action(async (name, options) => {
    const spinner = ora('Creating project...').start();
    
    try {
      const cicd = new CICDManager();
      
      spinner.text = 'Generating project structure...';
      const result = await cicd.generateProjectScaffolding(name, options.path);
      
      if (result.success) {
        spinner.stop();
        console.log(chalk.green('✅ Project created successfully!'));
        console.log(chalk.bold(`Project path: ${result.projectPath}`));
        console.log('\nGenerated files:');
        result.files.forEach(file => {
          console.log(chalk.gray(`  📄 ${file}`));
        });
        
        console.log(chalk.blue('\nNext steps:'));
        console.log(`1. cd ${path.relative(process.cwd(), result.projectPath)}`);
        console.log('2. npm install');
        console.log('3. anchor build');
        console.log('4. anchor test');
        
      } else {
        spinner.stop();
        console.error(chalk.red('❌ Project creation failed:'), result.error);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Project creation failed:'), error.message);
    }
  });

/**
 * Deployment Commands
 */
const deployCommand = program
  .command('deploy')
  .description('Deploy projects to Solana networks');

deployCommand
  .command('run')
  .description('Deploy current project')
  .option('-e, --environment <env>', 'Target environment (devnet,testnet,mainnet)', 'devnet')
  .option('-w, --wallet <path>', 'Wallet keypair path')
  .option('--dry-run', 'Simulate deployment without executing')
  .action(async (options) => {
    if (options.dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - no actual deployment will occur'));
    }
    
    const spinner = ora(`Deploying to ${options.environment}...`).start();
    
    try {
      const cicd = new CICDManager();
      const projectPath = process.cwd();
      
      // Check if this is an Anchor project
      const anchorTomlExists = await fs.access(path.join(projectPath, 'Anchor.toml'))
        .then(() => true)
        .catch(() => false);
      
      if (!anchorTomlExists) {
        spinner.stop();
        console.error(chalk.red('❌ No Anchor.toml found. Run this command in an Anchor project directory.'));
        return;
      }
      
      if (options.dryRun) {
        spinner.stop();
        console.log(chalk.blue('✅ Dry run completed. Project structure looks good!'));
        return;
      }
      
      const envOptions = options.wallet ? { env: { ANCHOR_WALLET: options.wallet } } : {};
      const deployment = await cicd.deployProject(projectPath, options.environment, envOptions);
      
      spinner.stop();
      
      if (deployment.status === 'success') {
        console.log(chalk.green('✅ Deployment successful!'));
        console.log(`Program ID: ${deployment.programId}`);
        console.log(`Environment: ${deployment.environment}`);
        console.log(`Duration: ${((new Date(deployment.completedAt) - new Date(deployment.startedAt)) / 1000).toFixed(2)}s`);
      } else {
        console.log(chalk.red('❌ Deployment failed'));
        console.log('Recent logs:');
        deployment.logs.slice(-5).forEach(log => {
          const color = log.level === 'error' ? chalk.red : log.level === 'success' ? chalk.green : chalk.gray;
          console.log(color(`  [${log.level.toUpperCase()}] ${log.message}`));
        });
      }
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Deployment failed:'), error.message);
    }
  });

/**
 * Monitoring Commands
 */
const monitorCommand = program
  .command('monitor')
  .description('Real-time monitoring of Solana network and protocols');

monitorCommand
  .command('start')
  .description('Start live monitoring')
  .option('-n, --network <network>', 'Solana network to monitor', 'devnet')
  .option('-i, --interval <seconds>', 'Health check interval in seconds', '30')
  .action(async (options) => {
    console.log(chalk.blue('🔍 Starting live monitoring...'));
    
    const rpcEndpoint = getRpcEndpoint(options.network);
    const monitor = new LiveMonitor({
      rpcEndpoint,
      monitoringInterval: parseInt(options.interval) * 1000
    });
    
    // Event handlers
    monitor.on('monitoring_started', () => {
      console.log(chalk.green('✅ Monitoring started successfully'));
    });
    
    monitor.on('health_update', (data) => {
      console.clear();
      displayHealthDashboard(data);
    });
    
    monitor.on('slot_change', (data) => {
      console.log(chalk.gray(`📦 New slot: ${data.slot}`));
    });
    
    monitor.on('health_check_error', (error) => {
      console.log(chalk.red(`❌ Health check error: ${error.message}`));
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Stopping monitoring...'));
      monitor.stopMonitoring();
      process.exit(0);
    });
    
    await monitor.startMonitoring();
  });

monitorCommand
  .command('health')
  .description('Check current health status')
  .option('-n, --network <network>', 'Solana network to check', 'devnet')
  .action(async (options) => {
    const spinner = ora('Checking health status...').start();
    
    try {
      const rpcEndpoint = getRpcEndpoint(options.network);
      const monitor = new LiveMonitor({ rpcEndpoint });
      
      await monitor.performHealthChecks();
      
      setTimeout(() => {
        spinner.stop();
        const summary = monitor.getHealthSummary();
        displayHealthSummary(summary);
      }, 2000);
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Health check failed:'), error.message);
    }
  });

/**
 * Utility Functions
 */
function getRpcEndpoint(network) {
  const endpoints = {
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com', 
    'mainnet': 'https://api.mainnet-beta.solana.com'
  };
  
  return endpoints[network] || endpoints.devnet;
}

function displayHealthDashboard(data) {
  console.log(chalk.bold.blue('📊 Solana DevEx Health Dashboard\n'));
  console.log(chalk.gray(`Last updated: ${data.timestamp}\n`));
  
  // Network health
  if (data.network) {
    const statusColor = data.network.status === 'healthy' ? chalk.green : 
                       data.network.status === 'degraded' ? chalk.yellow : chalk.red;
    
    console.log(chalk.bold('🌐 Network Status'));
    console.log(`Status: ${statusColor(data.network.status.toUpperCase())}`);
    console.log(`Latency: ${data.network.latency}ms`);
    console.log(`Current Slot: ${data.network.slot}`);
    console.log(`Block Height: ${data.network.blockHeight}`);
    if (data.network.blockAge) {
      console.log(`Block Age: ${data.network.blockAge}s`);
    }
    console.log('');
  }
  
  // Protocol health
  if (data.protocols && Object.keys(data.protocols).length > 0) {
    console.log(chalk.bold('⚡ Protocol Health'));
    Object.entries(data.protocols).forEach(([protocol, health]) => {
      const statusColor = health.status === 'healthy' ? chalk.green : 
                         health.status === 'degraded' ? chalk.yellow : chalk.red;
      
      console.log(`${protocol.toUpperCase()}: ${statusColor(health.status)} (${health.latency}ms)`);
    });
    console.log('');
  }
  
  console.log(chalk.gray('Press Ctrl+C to stop monitoring'));
}

function displayHealthSummary(summary) {
  console.log(chalk.bold.blue('📋 Health Summary\n'));
  
  if (summary.networks.solana) {
    const network = summary.networks.solana;
    const statusColor = network.status === 'healthy' ? chalk.green : 
                       network.status === 'degraded' ? chalk.yellow : chalk.red;
    
    console.log(chalk.bold('🌐 Network'));
    console.log(`  Status: ${statusColor(network.status.toUpperCase())}`);
    console.log(`  Latency: ${network.latency}ms`);
    console.log('');
  }
  
  if (Object.keys(summary.protocols).length > 0) {
    console.log(chalk.bold('⚡ Protocols'));
    Object.entries(summary.protocols).forEach(([protocol, health]) => {
      const statusColor = health.status === 'healthy' ? chalk.green : 
                         health.status === 'degraded' ? chalk.yellow : chalk.red;
      
      console.log(`  ${protocol.toUpperCase()}: ${statusColor(health.status)} (${health.latency}ms)`);
    });
    console.log('');
  }
  
  if (summary.metrics.avgNetworkLatency) {
    console.log(chalk.bold('📈 Metrics'));
    console.log(`  Avg Network Latency: ${summary.metrics.avgNetworkLatency}ms`);
  }
}

// Add help examples
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ solana-devex test protocols --network mainnet');
  console.log('  $ solana-devex project create my-defi-app');
  console.log('  $ solana-devex deploy run --environment devnet');
  console.log('  $ solana-devex monitor start --network mainnet');
});

// Parse command line arguments
program.parse();