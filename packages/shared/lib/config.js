/**
 * Shared Configuration System
 * Manages unified configuration across all platform components
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const DEFAULT_CONFIG = {
  platform: {
    version: '1.0.0',
    environment: 'development',
    logLevel: 'info'
  },
  solana: {
    network: 'localnet',
    rpcUrl: 'http://localhost:8899',
    commitment: 'confirmed'
  },
  anchor: {
    provider: 'local',
    cluster: 'localnet',
    wallet: '~/.config/solana/id.json'
  },
  testing: {
    framework: 'jest',
    parallel: true,
    coverage: true,
    timeout: 60000,
    validators: {
      autoStart: true,
      port: 8899,
      resetState: true
    }
  },
  validator: {
    port: 8899,
    resetState: true,
    monitoring: {
      enabled: true,
      port: 8890,
      metricsInterval: 5000
    },
    logging: {
      enabled: true,
      level: 'info',
      file: './validator.log'
    }
  },
  cicd: {
    platform: 'github',
    autoSetup: true,
    deployOnMerge: false,
    testingRequired: true
  },
  monitoring: {
    dashboard: {
      enabled: true,
      port: 3000
    },
    api: {
      enabled: true,
      port: 3001
    },
    metrics: {
      enabled: true,
      interval: 5000,
      retention: '7d'
    }
  },
  githubActions: {
    templates: ['test', 'build', 'deploy'],
    nodeVersion: '18',
    solanaVersion: 'latest'
  }
};

class Config {
  constructor() {
    this.configPath = this.findConfigFile();
    this.config = this.loadConfig();
  }

  findConfigFile() {
    const possiblePaths = [
      'solana-devex.config.js',
      'solana-devex.config.json',
      '.solana-devex.json',
      path.join(process.cwd(), 'solana-devex.config.js'),
      path.join(process.cwd(), 'solana-devex.config.json'),
      path.join(process.cwd(), '.solana-devex.json')
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return path.join(process.cwd(), 'solana-devex.config.js');
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      return DEFAULT_CONFIG;
    }

    try {
      if (this.configPath.endsWith('.js')) {
        delete require.cache[require.resolve(path.resolve(this.configPath))];
        return { ...DEFAULT_CONFIG, ...require(path.resolve(this.configPath)) };
      } else {
        const configData = fs.readJsonSync(this.configPath);
        return { ...DEFAULT_CONFIG, ...configData };
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not load config from ${this.configPath}`));
      console.warn(chalk.dim(error.message));
      return DEFAULT_CONFIG;
    }
  }

  saveConfig() {
    try {
      if (this.configPath.endsWith('.js')) {
        const configContent = `module.exports = ${JSON.stringify(this.config, null, 2)};`;
        fs.writeFileSync(this.configPath, configContent, 'utf8');
      } else {
        fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
      }
      console.log(chalk.green(`  Configuration saved to ${this.configPath}`));
    } catch (error) {
      console.error(chalk.red(`  Failed to save configuration: ${error.message}`));
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  merge(newConfig) {
    this.config = this.deepMerge(this.config, newConfig);
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

// Global config instance
let globalConfig;

function getConfig() {
  if (!globalConfig) {
    globalConfig = new Config();
  }
  return globalConfig;
}

async function initConfig() {
  console.log(chalk.blue('  Initializing Solana DevEx Platform configuration...'));
  
  const config = getConfig();
  
  if (fs.existsSync(config.configPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Configuration file already exists. Overwrite?',
        default: false
      }
    ]);
    
    if (!overwrite) {
      console.log(chalk.yellow('Configuration initialization cancelled.'));
      return;
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'Select your development environment:',
      choices: ['development', 'staging', 'production'],
      default: 'development'
    },
    {
      type: 'list',
      name: 'network',
      message: 'Select default Solana network:',
      choices: ['localnet', 'devnet', 'testnet', 'mainnet-beta'],
      default: 'localnet'
    },
    {
      type: 'confirm',
      name: 'enableTesting',
      message: 'Enable advanced testing features?',
      default: true
    },
    {
      type: 'confirm',
      name: 'enableMonitoring',
      message: 'Enable monitoring dashboard?',
      default: true
    },
    {
      type: 'confirm',
      name: 'enableValidator',
      message: 'Enable enhanced test validator?',
      default: true
    },
    {
      type: 'input',
      name: 'validatorPort',
      message: 'Test validator port:',
      default: '8899',
      when: (answers) => answers.enableValidator
    },
    {
      type: 'input',
      name: 'dashboardPort',
      message: 'Dashboard port:',
      default: '3000',
      when: (answers) => answers.enableMonitoring
    }
  ]);

  // Update configuration based on answers
  config.set('platform.environment', answers.environment);
  config.set('solana.network', answers.network);
  config.set('testing.enabled', answers.enableTesting);
  config.set('monitoring.dashboard.enabled', answers.enableMonitoring);
  config.set('validator.enabled', answers.enableValidator);
  
  if (answers.validatorPort) {
    config.set('validator.port', parseInt(answers.validatorPort));
    config.set('testing.validators.port', parseInt(answers.validatorPort));
  }
  
  if (answers.dashboardPort) {
    config.set('monitoring.dashboard.port', parseInt(answers.dashboardPort));
  }

  // Set network-specific RPC URLs
  const networkUrls = {
    localnet: 'http://localhost:8899',
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com'
  };
  
  config.set('solana.rpcUrl', networkUrls[answers.network]);

  config.saveConfig();
  
  console.log(chalk.green('  Configuration initialized successfully!'));
  console.log(chalk.dim(`Configuration saved to: ${config.configPath}`));
}

function showConfig() {
  const config = getConfig();
  
  console.log(chalk.blue('\n  Current Solana DevEx Platform Configuration:\n'));
  
  console.log(chalk.yellow('Platform:'));
  console.log(`  Environment: ${chalk.cyan(config.get('platform.environment'))}`);
  console.log(`  Version: ${chalk.cyan(config.get('platform.version'))}`);
  console.log(`  Log Level: ${chalk.cyan(config.get('platform.logLevel'))}`);
  
  console.log(chalk.yellow('\nSolana:'));
  console.log(`  Network: ${chalk.cyan(config.get('solana.network'))}`);
  console.log(`  RPC URL: ${chalk.cyan(config.get('solana.rpcUrl'))}`);
  console.log(`  Commitment: ${chalk.cyan(config.get('solana.commitment'))}`);
  
  console.log(chalk.yellow('\nTesting:'));
  console.log(`  Framework: ${chalk.cyan(config.get('testing.framework'))}`);
  console.log(`  Parallel: ${chalk.cyan(config.get('testing.parallel'))}`);
  console.log(`  Coverage: ${chalk.cyan(config.get('testing.coverage'))}`);
  console.log(`  Auto-start Validator: ${chalk.cyan(config.get('testing.validators.autoStart'))}`);
  
  console.log(chalk.yellow('\nValidator:'));
  console.log(`  Port: ${chalk.cyan(config.get('validator.port'))}`);
  console.log(`  Monitoring: ${chalk.cyan(config.get('validator.monitoring.enabled'))}`);
  console.log(`  Reset State: ${chalk.cyan(config.get('validator.resetState'))}`);
  
  console.log(chalk.yellow('\nMonitoring:'));
  console.log(`  Dashboard: ${chalk.cyan(config.get('monitoring.dashboard.enabled'))}`);
  console.log(`  Dashboard Port: ${chalk.cyan(config.get('monitoring.dashboard.port'))}`);
  console.log(`  API Port: ${chalk.cyan(config.get('monitoring.api.port'))}`);
  
  console.log(chalk.yellow('\nCI/CD:'));
  console.log(`  Platform: ${chalk.cyan(config.get('cicd.platform'))}`);
  console.log(`  Auto Setup: ${chalk.cyan(config.get('cicd.autoSetup'))}`);
  console.log(`  Deploy on Merge: ${chalk.cyan(config.get('cicd.deployOnMerge'))}`);
  
  console.log(chalk.dim(`\nConfiguration file: ${config.configPath}\n`));
}

module.exports = {
  getConfig,
  initConfig,
  showConfig,
  Config,
  DEFAULT_CONFIG
};