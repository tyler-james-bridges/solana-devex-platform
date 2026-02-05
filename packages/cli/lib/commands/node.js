const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('cross-spawn');
const { Connection } = require('@solana/web3.js');
const { loadConfig } = require('../utils/config');

class NodeCommand {
  constructor(globalOpts = {}) {
    this.globalOpts = globalOpts;
    this.config = null;
    this.validatorProcess = null;
  }

  async execute(options = {}) {
    try {
      await this.initializeConfig();
      
      console.log(chalk.bold.blue('  Starting Solana Test Validator'));
      console.log(chalk.gray('Enhanced local development environment\n'));
      
      // Validate requirements
      await this.validateRequirements();
      
      // Setup validator configuration
      const validatorConfig = await this.buildValidatorConfig(options);
      
      // Start the validator
      await this.startValidator(validatorConfig);
      
    } catch (error) {
      console.error(chalk.red('\n  Failed to start test validator:'), error.message);
      if (this.globalOpts.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async initializeConfig() {
    this.config = await loadConfig(this.globalOpts.config);
  }

  async validateRequirements() {
    try {
      // Check if solana-test-validator is available
      await this.runCommand('solana-test-validator', ['--version'], { stdio: 'pipe' });
    } catch (error) {
      throw new Error(
        'solana-test-validator not found. Please install Solana CLI tools:\n' +
        'https://docs.solana.com/cli/install-solana-cli-tools'
      );
    }
  }

  async buildValidatorConfig(options) {
    const config = {
      port: options.port || 8899,
      reset: options.reset || false,
      quiet: options.quiet || false,
      slotsPerEpoch: options.slotsPerEpoch || 432000,
      cloneAccounts: [],
      programs: [],
      forkNetwork: null
    };

    // Handle fork configuration
    if (options.fork) {
      config.forkNetwork = this.resolveForkNetwork(options.fork);
    }

    // Handle account cloning
    if (options.clone) {
      const accounts = options.clone.split(',').map(a => a.trim());
      config.cloneAccounts = accounts;
    }

    // Handle program preloading
    if (options.programs) {
      const programs = options.programs.split(',').map(p => p.trim());
      config.programs = await this.resolvePrograms(programs);
    }

    // Handle accounts snapshot
    if (options.accounts) {
      config.accountsPath = path.resolve(options.accounts);
      if (!(await fs.pathExists(config.accountsPath))) {
        throw new Error(`Accounts file not found: ${config.accountsPath}`);
      }
    }

    return config;
  }

  resolveForkNetwork(network) {
    const networks = {
      devnet: 'https://api.devnet.solana.com',
      testnet: 'https://api.testnet.solana.com',
      mainnet: 'https://api.mainnet-beta.solana.com'
    };

    const rpcUrl = networks[network];
    if (!rpcUrl) {
      throw new Error(`Unknown network for forking: ${network}`);
    }

    return {
      name: network,
      rpcUrl
    };
  }

  async resolvePrograms(programNames) {
    const programs = [];
    
    for (const programName of programNames) {
      // Check if it's a file path
      if (await fs.pathExists(programName)) {
        programs.push({
          type: 'file',
          path: path.resolve(programName),
          name: path.basename(programName, '.so')
        });
      } else {
        // Assume it's a well-known program
        const knownPrograms = this.getKnownPrograms();
        const program = knownPrograms[programName.toLowerCase()];
        
        if (program) {
          programs.push({
            type: 'known',
            ...program
          });
        } else {
          console.warn(chalk.yellow(`   Unknown program: ${programName}`));
        }
      }
    }
    
    return programs;
  }

  getKnownPrograms() {
    return {
      'spl-token': {
        name: 'SPL Token Program',
        address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      },
      'spl-associated-token': {
        name: 'SPL Associated Token Program',
        address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
      },
      'metaplex': {
        name: 'Metaplex Token Metadata Program',
        address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
      },
      'pyth': {
        name: 'Pyth Oracle Program',
        address: 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH'
      }
    };
  }

  async startValidator(config) {
    const args = this.buildValidatorArgs(config);
    
    console.log(chalk.blue('  Starting validator with configuration:'));
    console.log(chalk.gray(`   Port: ${config.port}`));
    console.log(chalk.gray(`   Reset: ${config.reset}`));
    console.log(chalk.gray(`   Slots per epoch: ${config.slotsPerEpoch}`));
    
    if (config.forkNetwork) {
      console.log(chalk.gray(`   Fork: ${config.forkNetwork.name}`));
    }
    
    if (config.cloneAccounts.length > 0) {
      console.log(chalk.gray(`   Clone accounts: ${config.cloneAccounts.length}`));
    }
    
    if (config.programs.length > 0) {
      console.log(chalk.gray(`   Preload programs: ${config.programs.length}`));
    }
    
    console.log('');
    
    const spinner = ora('Starting Solana test validator...').start();
    
    try {
      this.validatorProcess = spawn('solana-test-validator', args, {
        stdio: config.quiet ? 'pipe' : 'inherit',
        env: { ...process.env }
      });

      // Wait for validator to start
      await this.waitForValidator(config.port, spinner);
      
      spinner.succeed(chalk.green('  Solana test validator started successfully!'));
      
      // Display connection info
      this.displayConnectionInfo(config);
      
      // Display useful commands
      this.displayUsefulCommands(config);
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      // Monitor validator health
      await this.monitorValidator(config);
      
    } catch (error) {
      spinner.fail(chalk.red('  Failed to start validator'));
      throw error;
    }
  }

  buildValidatorArgs(config) {
    const args = [];
    
    // Basic configuration
    args.push('--rpc-port', config.port.toString());
    args.push('--slots-per-epoch', config.slotsPerEpoch.toString());
    
    if (config.reset) {
      args.push('--reset');
    }
    
    if (config.quiet) {
      args.push('--quiet');
    }
    
    // Fork configuration
    if (config.forkNetwork) {
      args.push('--url', config.forkNetwork.rpcUrl);
    }
    
    // Clone accounts
    config.cloneAccounts.forEach(account => {
      args.push('--clone', account);
    });
    
    // Load programs
    config.programs.forEach(program => {
      if (program.type === 'file') {
        args.push('--bpf-program', program.address || 'new', program.path);
      } else if (program.type === 'known') {
        args.push('--clone', program.address);
      }
    });
    
    // Accounts snapshot
    if (config.accountsPath) {
      args.push('--account-dir', config.accountsPath);
    }
    
    return args;
  }

  async waitForValidator(port, spinner) {
    const maxAttempts = 30;
    const delayMs = 1000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const connection = new Connection(`http://localhost:${port}`, 'confirmed');
        await connection.getVersion();
        
        // Validator is ready
        return;
        
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Validator failed to start after ${maxAttempts} attempts`);
        }
        
        spinner.text = `Waiting for validator... (${attempt}/${maxAttempts})`;
        await this.sleep(delayMs);
      }
    }
  }

  displayConnectionInfo(config) {
    console.log(chalk.bold.green('\n  Connection Information'));
    console.log('━'.repeat(40));
    console.log(chalk.cyan(`RPC URL:     http://localhost:${config.port}`));
    console.log(chalk.cyan(`WebSocket:   ws://localhost:${config.port + 1}`));
    console.log(chalk.cyan(`Cluster:     localnet`));
    console.log('');
  }

  displayUsefulCommands(config) {
    console.log(chalk.bold.blue('  Useful Commands'));
    console.log('━'.repeat(40));
    console.log(chalk.gray('Create a new keypair:'));
    console.log(chalk.cyan('  solana-keygen new'));
    console.log('');
    console.log(chalk.gray('Airdrop SOL:'));
    console.log(chalk.cyan(`  solana airdrop 1 --url http://localhost:${config.port}`));
    console.log('');
    console.log(chalk.gray('Check balance:'));
    console.log(chalk.cyan(`  solana balance --url http://localhost:${config.port}`));
    console.log('');
    console.log(chalk.gray('Deploy program:'));
    console.log(chalk.cyan(`  solana-devex deploy --network localhost`));
    console.log('');
    console.log(chalk.gray('Run tests:'));
    console.log(chalk.cyan('  solana-devex test --fork localhost'));
    console.log('');
    console.log(chalk.bold('Press Ctrl+C to stop the validator'));
    console.log('');
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      console.log(chalk.yellow('\n   Shutting down validator...'));
      
      if (this.validatorProcess) {
        this.validatorProcess.kill('SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
          if (!this.validatorProcess.killed) {
            this.validatorProcess.kill('SIGKILL');
          }
        }, 5000);
      }
      
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  async monitorValidator(config) {
    const connection = new Connection(`http://localhost:${config.port}`, 'confirmed');
    
    // Monitor validator status every 30 seconds
    const monitorInterval = setInterval(async () => {
      try {
        const slot = await connection.getSlot();
        const blockHeight = await connection.getBlockHeight();
        
        if (this.globalOpts.verbose) {
          console.log(chalk.gray(`  Slot: ${slot}, Block: ${blockHeight}`));
        }
        
      } catch (error) {
        console.error(chalk.red('  Validator monitoring error:'), error.message);
        clearInterval(monitorInterval);
      }
    }, 30000);
    
    // Handle validator process exit
    if (this.validatorProcess) {
      this.validatorProcess.on('exit', (code, signal) => {
        clearInterval(monitorInterval);
        
        if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
          console.error(chalk.red(`\n  Validator exited unexpectedly (code: ${code}, signal: ${signal})`));
          process.exit(1);
        }
      });
    }
    
    // Keep the process alive
    return new Promise(() => {}); // Never resolves, keeps the process running
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, options);
      
      let output = '';
      let errorOutput = '';
      
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
      }
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ output, code });
        } else {
          reject(new Error(`Command failed (exit code ${code}): ${errorOutput}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NodeCommand;