const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const pidusage = require('pidusage');
const { nanoid } = require('nanoid');
const EnvironmentManager = require('./environment-manager');

class ValidatorManager {
  constructor(config) {
    this.config = config;
    this.process = null;
    this.pid = null;
    this.startTime = null;
    this.currentEnvironment = null;
    this.environmentManager = new EnvironmentManager();
  }

  async start(options = {}) {
    const { environment = 'development', reset = false, monitoring = false } = options;
    
    // Stop existing validator if running
    if (this.isRunning()) {
      console.log('Stopping existing validator...');
      await this.stop();
    }

    // Reset ledger if requested
    if (reset) {
      await this.reset();
    }

    // Load environment configuration
    const envConfig = await this.environmentManager.getEnvironment(environment);
    if (!envConfig) {
      throw new Error(`Environment '${environment}' not found`);
    }

    // Prepare validator arguments
    const args = this.buildValidatorArgs(envConfig);
    
    console.log(`Starting validator with environment: ${environment}`);
    console.log(`RPC URL will be: http://${this.config.validator.rpc_bind_address}:${envConfig.port || this.config.validator.rpc_port}`);

    try {
      // Start the validator process
      this.process = spawn('solana-test-validator', args, {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.pid = this.process.pid;
      this.startTime = new Date();
      this.currentEnvironment = environment;

      // Setup logging
      await this.setupLogging();

      // Wait for validator to be ready
      await this.waitForReady();

      // Save process info
      await this.saveProcessInfo();

      return {
        pid: this.pid,
        rpcUrl: `http://${this.config.validator.rpc_bind_address}:${envConfig.port || this.config.validator.rpc_port}`,
        wsUrl: `ws://${this.config.validator.rpc_bind_address}:${envConfig.port || this.config.validator.rpc_port}`,
        environment: environment
      };

    } catch (error) {
      throw new Error(`Failed to start validator: ${error.message}`);
    }
  }

  async stop() {
    if (!this.isRunning()) {
      console.log('Validator is not running');
      return;
    }

    console.log('Stopping validator...');
    
    try {
      // Graceful shutdown
      this.process.kill('SIGTERM');
      
      // Wait for process to exit
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for validator to stop'));
        }, 10000);

        this.process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

    } catch (error) {
      console.log('Graceful shutdown failed, forcing kill...');
      this.process.kill('SIGKILL');
    }

    this.cleanup();
    await this.removeProcessInfo();
  }

  async restart(options = {}) {
    console.log('Restarting validator...');
    await this.stop();
    await this.start(options);
  }

  async reset(hard = false) {
    const wasRunning = this.isRunning();
    
    if (wasRunning) {
      await this.stop();
    }

    console.log('Resetting validator state...');

    try {
      // Remove ledger data
      const ledgerDir = this.config.validator.ledger_dir;
      if (await fs.pathExists(ledgerDir)) {
        await fs.remove(ledgerDir);
        await fs.ensureDir(ledgerDir);
      }

      // Reset accounts if hard reset
      if (hard) {
        const accountsDir = this.config.validator.accounts_dir;
        if (await fs.pathExists(accountsDir)) {
          await fs.remove(accountsDir);
          await fs.ensureDir(accountsDir);
        }
      }

      console.log('Validator state reset successfully');

    } catch (error) {
      throw new Error(`Failed to reset validator: ${error.message}`);
    }
  }

  async getStatus() {
    const processInfo = await this.loadProcessInfo();
    const running = this.isRunning() || (processInfo && await this.checkProcessExists(processInfo.pid));
    
    let metrics = {};
    if (running && (this.pid || processInfo?.pid)) {
      try {
        metrics = await pidusage(this.pid || processInfo.pid);
      } catch (error) {
        console.log('Failed to get process metrics:', error.message);
      }
    }

    return {
      running,
      pid: this.pid || processInfo?.pid,
      environment: this.currentEnvironment || processInfo?.environment,
      rpcPort: this.config.validator.rpc_port,
      uptime: this.getUptime(),
      cpu: metrics.cpu || 0,
      memory: metrics.memory ? Math.round(metrics.memory / 1024 / 1024) : 0
    };
  }

  buildValidatorArgs(envConfig) {
    const args = [
      '--ledger', this.config.validator.ledger_dir,
      '--rpc-port', (envConfig.port || this.config.validator.rpc_port).toString(),
      '--rpc-bind-address', this.config.validator.rpc_bind_address,
      '--faucet-port', this.config.validator.faucet_port.toString(),
      '--gossip-port', this.config.validator.gossip_port.toString(),
      '--dynamic-port-range', this.config.validator.dynamic_port_range
    ];

    // Add RPC configuration
    if (this.config.validator.enable_rpc_transaction_history) {
      args.push('--enable-rpc-transaction-history');
    }

    if (this.config.validator.enable_extended_tx_metadata_storage) {
      args.push('--enable-extended-tx-metadata-storage');
    }

    // Add ledger limits
    if (this.config.validator.limit_ledger_size) {
      args.push('--limit-ledger-size', this.config.validator.limit_ledger_size.toString());
    }

    // Add slots per epoch
    if (this.config.validator.slots_per_epoch) {
      args.push('--slots-per-epoch', this.config.validator.slots_per_epoch.toString());
    }

    // Add environment-specific accounts to clone
    if (envConfig.cloneAccounts && envConfig.cloneAccounts.length > 0) {
      envConfig.cloneAccounts.forEach(account => {
        args.push('--clone', account);
      });
    }

    // Add reset flag if specified in environment
    if (envConfig.reset) {
      args.push('--reset');
    }

    // Add custom accounts directory if specified
    if (envConfig.accountsDir) {
      args.push('--account-dir', envConfig.accountsDir);
    }

    return args;
  }

  async setupLogging() {
    if (!this.process) return;

    const logFile = this.config.validator.log_file;
    await fs.ensureFile(logFile);
    
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    
    this.process.stdout.on('data', (data) => {
      const timestamp = new Date().toISOString();
      logStream.write(`[${timestamp}] [STDOUT] ${data}`);
    });

    this.process.stderr.on('data', (data) => {
      const timestamp = new Date().toISOString();
      logStream.write(`[${timestamp}] [STDERR] ${data}`);
    });

    this.process.on('exit', (code) => {
      const timestamp = new Date().toISOString();
      logStream.write(`[${timestamp}] [EXIT] Process exited with code: ${code}\n`);
      logStream.end();
    });
  }

  async waitForReady() {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    let elapsed = 0;

    return new Promise((resolve, reject) => {
      const checkReady = async () => {
        try {
          // Try to connect to RPC endpoint
          const { execa } = require('execa');
          await execa('solana', ['cluster-version', '--url', `http://localhost:${this.config.validator.rpc_port}`], {
            timeout: 5000
          });
          resolve();
        } catch (error) {
          elapsed += checkInterval;
          if (elapsed >= maxWaitTime) {
            reject(new Error('Timeout waiting for validator to be ready'));
          } else {
            setTimeout(checkReady, checkInterval);
          }
        }
      };

      setTimeout(checkReady, checkInterval);
    });
  }

  async saveProcessInfo() {
    const processFile = path.join(require('./config-loader').getConfigDir(), '.process');
    const info = {
      pid: this.pid,
      environment: this.currentEnvironment,
      startTime: this.startTime.toISOString(),
      rpcPort: this.config.validator.rpc_port
    };
    await fs.writeFile(processFile, JSON.stringify(info, null, 2));
  }

  async loadProcessInfo() {
    const processFile = path.join(require('./config-loader').getConfigDir(), '.process');
    try {
      if (await fs.pathExists(processFile)) {
        const content = await fs.readFile(processFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.log('Failed to load process info:', error.message);
    }
    return null;
  }

  async removeProcessInfo() {
    const processFile = path.join(require('./config-loader').getConfigDir(), '.process');
    try {
      if (await fs.pathExists(processFile)) {
        await fs.remove(processFile);
      }
    } catch (error) {
      console.log('Failed to remove process info:', error.message);
    }
  }

  async checkProcessExists(pid) {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  isRunning() {
    return this.process && !this.process.killed;
  }

  getUptime() {
    if (!this.startTime) return null;
    const uptime = Date.now() - this.startTime.getTime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  cleanup() {
    this.process = null;
    this.pid = null;
    this.startTime = null;
    this.currentEnvironment = null;
  }
}

module.exports = ValidatorManager;