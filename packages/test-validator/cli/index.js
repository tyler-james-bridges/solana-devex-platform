#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const ValidatorManager = require('../lib/validator-manager');
const EnvironmentManager = require('../lib/environment-manager');
const MonitoringServer = require('../lib/monitoring-server');
const PerformanceCollector = require('../lib/performance-collector');
const { loadConfig } = require('../lib/config-loader');

const program = new Command();

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════╗
║           SOLANA TEST VALIDATOR               ║
║              EXTENSION LAYER                  ║
║                                               ║
║    Enhanced Developer Productivity Tools     ║
╚═══════════════════════════════════════════════╝
`;

console.log(chalk.cyan(banner));

program
  .name('solana-test-ext')
  .description('Enhanced Solana test validator with performance metrics and automation')
  .version('1.0.0');

// Environment management commands
const envCmd = program.command('env')
  .description('Manage test validator environments');

envCmd.command('create <name>')
  .description('Create a new test environment')
  .option('-p, --port <port>', 'RPC port', '8899')
  .option('-r, --reset', 'Reset ledger on start')
  .option('--accounts-dir <dir>', 'Custom accounts directory')
  .option('--clone-account <pubkey>', 'Clone account from mainnet')
  .action(async (name, options) => {
    const envManager = new EnvironmentManager();
    try {
      await envManager.createEnvironment(name, options);
      console.log(chalk.green(`✅ Environment '${name}' created successfully`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create environment: ${error.message}`));
      process.exit(1);
    }
  });

envCmd.command('list')
  .description('List all environments')
  .action(async () => {
    const envManager = new EnvironmentManager();
    const environments = await envManager.listEnvironments();
    
    if (environments.length === 0) {
      console.log(chalk.yellow('No environments found'));
      return;
    }

    console.log(chalk.blue('\n📋 Available Environments:'));
    environments.forEach(env => {
      const status = env.running ? chalk.green('🟢 Running') : chalk.red('🔴 Stopped');
      console.log(`  ${env.name} - ${status} - Port: ${env.port}`);
    });
  });

envCmd.command('switch <name>')
  .description('Switch to a different environment')
  .action(async (name) => {
    const envManager = new EnvironmentManager();
    try {
      await envManager.switchEnvironment(name);
      console.log(chalk.green(`✅ Switched to environment '${name}'`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to switch environment: ${error.message}`));
      process.exit(1);
    }
  });

// Validator lifecycle commands
const validatorCmd = program.command('validator')
  .description('Manage test validator lifecycle');

validatorCmd.command('start [environment]')
  .description('Start the test validator')
  .option('-m, --monitor', 'Start with monitoring dashboard')
  .option('-r, --reset', 'Reset ledger before start')
  .option('--metrics-port <port>', 'Metrics server port', '3001')
  .action(async (environment, options) => {
    const config = await loadConfig();
    const validatorManager = new ValidatorManager(config);
    
    try {
      console.log(chalk.blue('🚀 Starting Solana test validator...'));
      
      const result = await validatorManager.start({
        environment: environment || config.default_environment,
        reset: options.reset,
        monitoring: options.monitor
      });

      if (options.monitor) {
        const monitoringServer = new MonitoringServer();
        await monitoringServer.start(options.metricsPort);
        console.log(chalk.green(`📊 Monitoring dashboard available at: http://localhost:${options.metricsPort}`));
      }

      console.log(chalk.green('✅ Test validator started successfully'));
      console.log(chalk.blue(`📍 RPC URL: ${result.rpcUrl}`));
      console.log(chalk.blue(`🔗 WebSocket URL: ${result.wsUrl}`));
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to start validator: ${error.message}`));
      process.exit(1);
    }
  });

validatorCmd.command('stop')
  .description('Stop the test validator')
  .action(async () => {
    const config = await loadConfig();
    const validatorManager = new ValidatorManager(config);
    
    try {
      await validatorManager.stop();
      console.log(chalk.green('✅ Test validator stopped successfully'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to stop validator: ${error.message}`));
      process.exit(1);
    }
  });

validatorCmd.command('restart [environment]')
  .description('Restart the test validator')
  .option('-r, --reset', 'Reset ledger on restart')
  .action(async (environment, options) => {
    const config = await loadConfig();
    const validatorManager = new ValidatorManager(config);
    
    try {
      console.log(chalk.blue('🔄 Restarting test validator...'));
      await validatorManager.restart({
        environment: environment || config.default_environment,
        reset: options.reset
      });
      console.log(chalk.green('✅ Test validator restarted successfully'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to restart validator: ${error.message}`));
      process.exit(1);
    }
  });

validatorCmd.command('status')
  .description('Show validator status and metrics')
  .action(async () => {
    const config = await loadConfig();
    const validatorManager = new ValidatorManager(config);
    const performanceCollector = new PerformanceCollector();
    
    try {
      const status = await validatorManager.getStatus();
      const metrics = await performanceCollector.collect();
      
      console.log(boxen(
        chalk.blue('🔍 Validator Status\n\n') +
        `Status: ${status.running ? chalk.green('🟢 Running') : chalk.red('🔴 Stopped')}\n` +
        `Environment: ${chalk.yellow(status.environment || 'default')}\n` +
        `PID: ${status.pid || 'N/A'}\n` +
        `RPC Port: ${status.rpcPort || 'N/A'}\n` +
        `Uptime: ${status.uptime || 'N/A'}\n\n` +
        chalk.blue('📊 Performance Metrics\n\n') +
        `CPU Usage: ${chalk.yellow(metrics.cpu?.toFixed(2) || 'N/A')}%\n` +
        `Memory Usage: ${chalk.yellow(metrics.memory?.toFixed(2) || 'N/A')} MB\n` +
        `Disk Usage: ${chalk.yellow(metrics.disk?.toFixed(2) || 'N/A')} GB\n` +
        `Transactions/sec: ${chalk.yellow(metrics.tps?.toFixed(2) || 'N/A')}`,
        {
          title: 'Solana Test Validator',
          titleAlignment: 'center',
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'blue'
        }
      ));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to get status: ${error.message}`));
      process.exit(1);
    }
  });

// Reset and cleanup commands
validatorCmd.command('reset')
  .description('Reset validator ledger and accounts')
  .option('--hard', 'Complete reset including configuration')
  .action(async (options) => {
    const config = await loadConfig();
    const validatorManager = new ValidatorManager(config);
    
    try {
      console.log(chalk.blue('🧹 Resetting validator state...'));
      await validatorManager.reset(options.hard);
      console.log(chalk.green('✅ Validator reset completed'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to reset validator: ${error.message}`));
      process.exit(1);
    }
  });

// Monitoring and dashboard commands
const monitorCmd = program.command('monitor')
  .description('Monitoring and dashboard commands');

monitorCmd.command('start')
  .description('Start monitoring dashboard')
  .option('-p, --port <port>', 'Dashboard port', '3001')
  .action(async (options) => {
    const monitoringServer = new MonitoringServer();
    try {
      await monitoringServer.start(options.port);
      console.log(chalk.green(`📊 Monitoring dashboard started at: http://localhost:${options.port}`));
      console.log(chalk.blue('Press Ctrl+C to stop'));
      
      // Keep the process alive
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down monitoring server...'));
        await monitoringServer.stop();
        process.exit(0);
      });
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to start monitoring: ${error.message}`));
      process.exit(1);
    }
  });

monitorCmd.command('metrics')
  .description('Show current performance metrics')
  .option('-w, --watch', 'Watch metrics in real-time')
  .action(async (options) => {
    const performanceCollector = new PerformanceCollector();
    
    if (options.watch) {
      console.log(chalk.blue('📊 Watching metrics (Press Ctrl+C to exit)...\n'));
      
      const interval = setInterval(async () => {
        try {
          const metrics = await performanceCollector.collect();
          console.clear();
          console.log(chalk.green(`⏰ ${new Date().toLocaleTimeString()}`));
          console.log(`CPU: ${chalk.yellow(metrics.cpu?.toFixed(2) || 'N/A')}%`);
          console.log(`Memory: ${chalk.yellow(metrics.memory?.toFixed(2) || 'N/A')} MB`);
          console.log(`TPS: ${chalk.yellow(metrics.tps?.toFixed(2) || 'N/A')}`);
        } catch (error) {
          console.error(chalk.red(`Error collecting metrics: ${error.message}`));
        }
      }, 1000);
      
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(chalk.yellow('\nMetrics monitoring stopped'));
        process.exit(0);
      });
      
    } else {
      try {
        const metrics = await performanceCollector.collect();
        console.log(chalk.blue('📊 Current Metrics:'));
        console.log(`CPU Usage: ${chalk.yellow(metrics.cpu?.toFixed(2) || 'N/A')}%`);
        console.log(`Memory Usage: ${chalk.yellow(metrics.memory?.toFixed(2) || 'N/A')} MB`);
        console.log(`Disk Usage: ${chalk.yellow(metrics.disk?.toFixed(2) || 'N/A')} GB`);
        console.log(`Transactions/sec: ${chalk.yellow(metrics.tps?.toFixed(2) || 'N/A')}`);
      } catch (error) {
        console.error(chalk.red(`❌ Failed to collect metrics: ${error.message}`));
        process.exit(1);
      }
    }
  });

// Configuration management
const configCmd = program.command('config')
  .description('Configuration management');

configCmd.command('init')
  .description('Initialize configuration')
  .action(async () => {
    const { createDefaultConfig } = require('../lib/config-loader');
    try {
      await createDefaultConfig();
      console.log(chalk.green('✅ Configuration initialized'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to initialize config: ${error.message}`));
      process.exit(1);
    }
  });

configCmd.command('show')
  .description('Show current configuration')
  .action(async () => {
    try {
      const config = await loadConfig();
      console.log(chalk.blue('⚙️  Current Configuration:'));
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load config: ${error.message}`));
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', function () {
  console.error(chalk.red(`Unknown command: ${program.args.join(' ')}`));
  console.log(chalk.blue('Use --help to see available commands'));
  process.exit(1);
});

program.parse();