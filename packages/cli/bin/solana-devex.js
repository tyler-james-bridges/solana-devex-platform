#!/usr/bin/env node

/**
 * Solana DevEx CLI - Foundry-style developer experience for Solana
 * 
 * Commands follow the Foundry pattern:
 * - solana-devex build    (like forge build)
 * - solana-devex test     (like forge test)  
 * - solana-devex deploy   (like forge create)
 * - solana-devex node     (like anvil)
 * - solana-devex cast     (like cast)
 */

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

// Import command modules
const BuildCommand = require('../lib/commands/build');
const TestCommand = require('../lib/commands/test');
const DeployCommand = require('../lib/commands/deploy');
const NodeCommand = require('../lib/commands/node');
const CastCommand = require('../lib/commands/cast');
const InitCommand = require('../lib/commands/init');
const ConfigCommand = require('../lib/commands/config');
const ChainCommand = require('../lib/commands/chain');

const program = new Command();

program
  .name('solana-devex')
  .description('Foundry-style CLI for Solana development')
  .version('1.0.0')
  .option('-v, --verbose', 'enable verbose output')
  .option('--config <path>', 'path to config file', 'solana-devex.toml');

/**
 * Build Command (like forge build)
 */
program
  .command('build')
  .description('Build Anchor programs and TypeScript clients')
  .option('--release', 'build optimized release version')
  .option('--verify', 'verify programs after build')
  .option('--programs <programs>', 'comma-separated list of programs to build')
  .option('--parallel', 'build programs in parallel')
  .option('--watch', 'watch for changes and rebuild')
  .option('--output-dir <dir>', 'output directory for artifacts', 'target')
  .action(async (options) => {
    const buildCmd = new BuildCommand(program.opts());
    await buildCmd.execute(options);
  });

/**
 * Test Command (like forge test)
 */
program
  .command('test')
  .description('Run Anchor tests with enhanced features')
  .argument('[filter]', 'test filter pattern')
  .option('--coverage', 'generate code coverage report')
  .option('--gas-report', 'generate gas usage report')
  .option('--fork <network>', 'fork network for testing (devnet, testnet, mainnet)')
  .option('--match-test <pattern>', 'only run tests matching pattern')
  .option('--match-contract <pattern>', 'only run tests from matching contracts')
  .option('--parallel', 'run tests in parallel')
  .option('--watch', 'watch for changes and re-run tests')
  .option('--verbose', 'verbose test output')
  .option('--bail', 'stop on first test failure')
  .option('--timeout <ms>', 'test timeout in milliseconds', '60000')
  .action(async (filter, options) => {
    const testCmd = new TestCommand(program.opts());
    await testCmd.execute(filter, options);
  });

/**
 * Deploy Command (like forge create)
 */
program
  .command('deploy')
  .description('Deploy programs to Solana networks')
  .option('--network <network>', 'target network (devnet, testnet, mainnet)', 'devnet')
  .option('--keypair <path>', 'deployer keypair path')
  .option('--program <name>', 'specific program to deploy')
  .option('--upgrade', 'upgrade existing program')
  .option('--verify', 'verify program on-chain')
  .option('--dry-run', 'simulate deployment without executing')
  .option('--broadcast', 'broadcast to multiple networks')
  .option('--skip-confirm', 'skip confirmation prompts')
  .option('--gas-limit <limit>', 'set compute unit limit')
  .action(async (options) => {
    const deployCmd = new DeployCommand(program.opts());
    await deployCmd.execute(options);
  });

/**
 * Node Command (like anvil)
 */
program
  .command('node')
  .description('Start local Solana test validator with enhanced features')
  .option('--port <port>', 'RPC port', '8899')
  .option('--reset', 'reset ledger on startup')
  .option('--clone <address>', 'clone account from network')
  .option('--fork <network>', 'fork from network (devnet, testnet, mainnet)')
  .option('--slots-per-epoch <slots>', 'slots per epoch', '432000')
  .option('--quiet', 'suppress validator logs')
  .option('--accounts <path>', 'load accounts from snapshot')
  .option('--programs <programs>', 'preload programs (comma-separated)')
  .action(async (options) => {
    const nodeCmd = new NodeCommand(program.opts());
    await nodeCmd.execute(options);
  });

/**
 * Cast Command (like cast)
 */
program
  .command('cast')
  .description('Interact with Solana programs and accounts')
  .option('--rpc-url <url>', 'RPC URL')
  .option('--keypair <path>', 'keypair for transactions')
  .addCommand(createCastSubcommands());

function createCastSubcommands() {
  const cast = new Command('cast');
  
  // Account operations
  cast.command('balance <address>')
    .description('get account balance')
    .action(async (address, options, command) => {
      const castCmd = new CastCommand(command.parent.parent.opts());
      await castCmd.getBalance(address, command.parent.opts());
    });
    
  cast.command('account <address>')
    .description('get account info')
    .option('--json', 'output as JSON')
    .action(async (address, options, command) => {
      const castCmd = new CastCommand(command.parent.parent.opts());
      await castCmd.getAccount(address, { ...command.parent.opts(), ...options });
    });
    
  cast.command('call <program> <instruction>')
    .description('call program instruction')
    .option('--args <args>', 'instruction arguments (JSON)')
    .option('--accounts <accounts>', 'accounts for instruction (JSON)')
    .action(async (program, instruction, options, command) => {
      const castCmd = new CastCommand(command.parent.parent.opts());
      await castCmd.callInstruction(program, instruction, { 
        ...command.parent.opts(), 
        ...options 
      });
    });
    
  cast.command('send <to> <amount>')
    .description('send SOL to address')
    .action(async (to, amount, options, command) => {
      const castCmd = new CastCommand(command.parent.parent.opts());
      await castCmd.sendSol(to, amount, command.parent.opts());
    });
    
  cast.command('deploy <program>')
    .description('deploy program')
    .option('--keypair <path>', 'program keypair')
    .action(async (program, options, command) => {
      const castCmd = new CastCommand(command.parent.parent.opts());
      await castCmd.deployProgram(program, { 
        ...command.parent.opts(), 
        ...options 
      });
    });
  
  return cast;
}

/**
 * Init Command (like forge init)
 */
program
  .command('init')
  .description('Initialize new Solana project')
  .argument('[name]', 'project name')
  .option('--template <template>', 'project template (basic, defi, nft, game)', 'basic')
  .option('--force', 'overwrite existing files')
  .option('--git', 'initialize git repository')
  .option('--vscode', 'add VS Code settings')
  .action(async (name, options) => {
    const initCmd = new InitCommand(program.opts());
    await initCmd.execute(name, options);
  });

/**
 * Config Command
 */
program
  .command('config')
  .description('Manage configuration')
  .addCommand(createConfigSubcommands());

function createConfigSubcommands() {
  const config = new Command('config');
  
  config.command('init')
    .description('create default config file')
    .action(async (options, command) => {
      const configCmd = new ConfigCommand(command.parent.parent.opts());
      await configCmd.init();
    });
    
  config.command('get <key>')
    .description('get config value')
    .action(async (key, options, command) => {
      const configCmd = new ConfigCommand(command.parent.parent.opts());
      await configCmd.get(key);
    });
    
  config.command('set <key> <value>')
    .description('set config value')
    .action(async (key, value, options, command) => {
      const configCmd = new ConfigCommand(command.parent.parent.opts());
      await configCmd.set(key, value);
    });
    
  config.command('list')
    .description('list all config values')
    .action(async (options, command) => {
      const configCmd = new ConfigCommand(command.parent.parent.opts());
      await configCmd.list();
    });
    
  return config;
}

/**
 * Chain Command (cross-chain operations)
 */
program
  .command('chain')
  .description('Cross-chain deployment and operations')
  .addCommand(createChainSubcommands());

function createChainSubcommands() {
  const chain = new Command('chain');
  
  chain.command('deploy')
    .description('deploy to multiple chains')
    .option('--chains <chains>', 'target chains (solana,ethereum,polygon)', 'solana')
    .option('--config <path>', 'cross-chain config file')
    .action(async (options, command) => {
      const chainCmd = new ChainCommand(command.parent.parent.opts());
      await chainCmd.deploy(options);
    });
    
  chain.command('bridge')
    .description('setup cross-chain bridge')
    .option('--from <chain>', 'source chain')
    .option('--to <chain>', 'destination chain')
    .action(async (options, command) => {
      const chainCmd = new ChainCommand(command.parent.parent.opts());
      await chainCmd.setupBridge(options);
    });
    
  chain.command('status')
    .description('check cross-chain deployment status')
    .action(async (options, command) => {
      const chainCmd = new ChainCommand(command.parent.parent.opts());
      await chainCmd.status();
    });
    
  return chain;
}

/**
 * Additional utility commands
 */
program
  .command('clean')
  .description('Clean build artifacts')
  .option('--cache', 'clean cache only')
  .option('--all', 'clean everything')
  .action(async (options) => {
    const buildCmd = new BuildCommand(program.opts());
    await buildCmd.clean(options);
  });

program
  .command('verify')
  .description('Verify deployed programs')
  .option('--network <network>', 'target network', 'devnet')
  .option('--program <address>', 'program address to verify')
  .action(async (options) => {
    const deployCmd = new DeployCommand(program.opts());
    await deployCmd.verify(options);
  });

program
  .command('watch')
  .description('Watch for changes and rebuild/test')
  .option('--build', 'watch and build')
  .option('--test', 'watch and test')
  .action(async (options) => {
    if (options.build) {
      const buildCmd = new BuildCommand(program.opts());
      await buildCmd.watch();
    } else if (options.test) {
      const testCmd = new TestCommand(program.opts());
      await testCmd.watch();
    } else {
      console.log(chalk.yellow('Please specify --build or --test'));
    }
  });

// Global error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Unexpected error:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ Unhandled promise rejection:'), reason);
  if (program.opts().verbose) {
    console.error('Promise:', promise);
  }
  process.exit(1);
});

// Help customization
program.on('--help', () => {
  console.log('');
  console.log(chalk.bold('Examples:'));
  console.log('');
  console.log('  Initialize new project:');
  console.log(chalk.cyan('    $ solana-devex init my-dapp --template defi'));
  console.log('');
  console.log('  Build and test:');
  console.log(chalk.cyan('    $ solana-devex build --release'));
  console.log(chalk.cyan('    $ solana-devex test --coverage'));
  console.log('');
  console.log('  Deploy:');
  console.log(chalk.cyan('    $ solana-devex deploy --network mainnet --verify'));
  console.log('');
  console.log('  Start local node:');
  console.log(chalk.cyan('    $ solana-devex node --reset'));
  console.log('');
  console.log('  Cast operations:');
  console.log(chalk.cyan('    $ solana-devex cast balance <address>'));
  console.log(chalk.cyan('    $ solana-devex cast send <to> <amount>'));
  console.log('');
  console.log('  Cross-chain deployment:');
  console.log(chalk.cyan('    $ solana-devex chain deploy --chains solana,ethereum'));
  console.log('');
  console.log(chalk.bold('For more help on specific commands:'));
  console.log(chalk.cyan('    $ solana-devex <command> --help'));
});

// Parse CLI arguments
program.parse();