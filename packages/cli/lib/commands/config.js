const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const toml = require('toml');
const { loadConfig, saveConfig } = require('../utils/config');

class ConfigCommand {
  constructor(globalOpts = {}) {
    this.globalOpts = globalOpts;
    this.configPath = globalOpts.config || 'solana-devex.toml';
  }

  async init() {
    try {
      const configPath = path.resolve(this.configPath);
      
      if (await fs.pathExists(configPath)) {
        console.log(chalk.yellow(`   Config file already exists: ${configPath}`));
        console.log(chalk.gray('Use --force to overwrite'));
        return;
      }
      
      const defaultConfig = this.createDefaultConfig();
      await fs.writeFile(configPath, defaultConfig);
      
      console.log(chalk.green('  Created default configuration file'));
      console.log(chalk.cyan(`Location: ${configPath}`));
      console.log(chalk.gray('\nEdit this file to customize your project settings.'));
      
    } catch (error) {
      console.error(chalk.red('  Failed to create config:'), error.message);
    }
  }

  async get(key) {
    try {
      const config = await loadConfig(this.configPath);
      
      const value = this.getNestedValue(config, key);
      
      if (value === undefined) {
        console.log(chalk.yellow(`   Config key not found: ${key}`));
        return;
      }
      
      console.log(chalk.cyan(`${key}:`), this.formatValue(value));
      
    } catch (error) {
      console.error(chalk.red('  Failed to get config:'), error.message);
    }
  }

  async set(key, value) {
    try {
      let config;
      
      try {
        config = await loadConfig(this.configPath);
      } catch {
        // Create new config if file doesn't exist
        config = this.parseDefaultConfig();
      }
      
      // Parse value
      const parsedValue = this.parseValue(value);
      
      // Set nested value
      this.setNestedValue(config, key, parsedValue);
      
      // Save config
      await saveConfig(config, this.configPath);
      
      console.log(chalk.green('  Config updated'));
      console.log(chalk.cyan(`${key}:`), this.formatValue(parsedValue));
      
    } catch (error) {
      console.error(chalk.red('  Failed to set config:'), error.message);
    }
  }

  async list() {
    try {
      const config = await loadConfig(this.configPath);
      
      console.log(chalk.bold('  Configuration'));
      console.log('━'.repeat(40));
      
      this.printConfig(config);
      
    } catch (error) {
      console.error(chalk.red('  Failed to list config:'), error.message);
    }
  }

  createDefaultConfig() {
    return `# Solana DevEx Configuration
# https://github.com/solana-devex/cli

[project]
name = "my-solana-project"
version = "0.1.0"
description = "A Solana project built with DevEx CLI"

# Network configurations
[networks.devnet]
rpc_url = "https://api.devnet.solana.com"
ws_url = "wss://api.devnet.solana.com"

[networks.testnet]
rpc_url = "https://api.testnet.solana.com"
ws_url = "wss://api.testnet.solana.com"

[networks.mainnet]
rpc_url = "https://api.mainnet-beta.solana.com"
ws_url = "wss://api.mainnet-beta.solana.com"

[networks.localhost]
rpc_url = "http://localhost:8899"
ws_url = "ws://localhost:8900"

# Build configuration
[build]
optimize = true
verify = false
parallel = true
output_dir = "target"

# Test configuration
[test]
coverage = true
parallel = false
timeout = 60000
bail = false

# Deployment configuration
[deploy]
verify = true
upgrade = false
skip_confirm = false
gas_limit = 200000

# Cross-chain configuration
[chain]
enabled = false
default_chains = ["solana"]

# Development tools
[tools]
auto_format = true
auto_lint = true
watch_mode = true
`;
  }

  parseDefaultConfig() {
    return {
      project: {
        name: "my-solana-project",
        version: "0.1.0",
        description: "A Solana project built with DevEx CLI"
      },
      networks: {
        devnet: {
          rpc_url: "https://api.devnet.solana.com",
          ws_url: "wss://api.devnet.solana.com"
        },
        testnet: {
          rpc_url: "https://api.testnet.solana.com",
          ws_url: "wss://api.testnet.solana.com"
        },
        mainnet: {
          rpc_url: "https://api.mainnet-beta.solana.com",
          ws_url: "wss://api.mainnet-beta.solana.com"
        },
        localhost: {
          rpc_url: "http://localhost:8899",
          ws_url: "ws://localhost:8900"
        }
      },
      build: {
        optimize: true,
        verify: false,
        parallel: true,
        output_dir: "target"
      },
      test: {
        coverage: true,
        parallel: false,
        timeout: 60000,
        bail: false
      },
      deploy: {
        verify: true,
        upgrade: false,
        skip_confirm: false,
        gas_limit: 200000
      },
      chain: {
        enabled: false,
        default_chains: ["solana"]
      },
      tools: {
        auto_format: true,
        auto_lint: true,
        watch_mode: true
      }
    };
  }

  getNestedValue(obj, key) {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  setNestedValue(obj, key, value) {
    const keys = key.split('.');
    let current = obj;
    
    // Navigate to the parent of the target key
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      
      current = current[k];
    }
    
    // Set the final value
    current[keys[keys.length - 1]] = value;
  }

  parseValue(value) {
    // Try to parse as JSON first (for arrays, objects, booleans, numbers)
    try {
      return JSON.parse(value);
    } catch {
      // Return as string if JSON parsing fails
      return value;
    }
  }

  formatValue(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    } else if (typeof value === 'string') {
      return `"${value}"`;
    } else {
      return String(value);
    }
  }

  printConfig(obj, prefix = '', indent = 0) {
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        console.log(`${spaces}${chalk.bold.blue(`[${fullKey}]`)}`);
        this.printConfig(value, fullKey, indent + 1);
      } else {
        const formattedValue = this.formatConfigValue(value);
        console.log(`${spaces}${chalk.cyan(key)} = ${formattedValue}`);
      }
    }
    
    if (indent === 0) {
      console.log('');
    }
  }

  formatConfigValue(value) {
    if (Array.isArray(value)) {
      return chalk.yellow(`[${value.map(v => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'string') {
      return chalk.green(`"${value}"`);
    } else if (typeof value === 'boolean') {
      return chalk.magenta(String(value));
    } else if (typeof value === 'number') {
      return chalk.yellow(String(value));
    } else {
      return chalk.gray(String(value));
    }
  }

  // Additional utility methods
  async validate() {
    try {
      const config = await loadConfig(this.configPath);
      const errors = [];
      
      // Validate required fields
      if (!config.project?.name) {
        errors.push('project.name is required');
      }
      
      // Validate network URLs
      if (config.networks) {
        for (const [networkName, network] of Object.entries(config.networks)) {
          if (network.rpc_url && !this.isValidUrl(network.rpc_url)) {
            errors.push(`networks.${networkName}.rpc_url is not a valid URL`);
          }
          if (network.ws_url && !this.isValidUrl(network.ws_url)) {
            errors.push(`networks.${networkName}.ws_url is not a valid URL`);
          }
        }
      }
      
      // Validate numeric values
      if (config.test?.timeout && config.test.timeout < 1000) {
        errors.push('test.timeout should be at least 1000ms');
      }
      
      if (config.deploy?.gas_limit && config.deploy.gas_limit < 1000) {
        errors.push('deploy.gas_limit should be at least 1000');
      }
      
      if (errors.length > 0) {
        console.log(chalk.red('  Configuration validation failed:'));
        errors.forEach(error => {
          console.log(chalk.red(`   • ${error}`));
        });
        return false;
      } else {
        console.log(chalk.green('  Configuration is valid'));
        return true;
      }
      
    } catch (error) {
      console.error(chalk.red('  Failed to validate config:'), error.message);
      return false;
    }
  }

  isValidUrl(urlString) {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }

  async export(format = 'json') {
    try {
      const config = await loadConfig(this.configPath);
      
      if (format === 'json') {
        console.log(JSON.stringify(config, null, 2));
      } else if (format === 'yaml') {
        // Would require yaml library
        console.log(chalk.yellow('   YAML export not implemented yet'));
      } else {
        console.error(chalk.red(`  Unknown format: ${format}`));
      }
      
    } catch (error) {
      console.error(chalk.red('  Failed to export config:'), error.message);
    }
  }

  async reset() {
    try {
      const configPath = path.resolve(this.configPath);
      
      if (await fs.pathExists(configPath)) {
        await fs.remove(configPath);
      }
      
      await this.init();
      
      console.log(chalk.green('  Configuration reset to defaults'));
      
    } catch (error) {
      console.error(chalk.red('  Failed to reset config:'), error.message);
    }
  }
}

module.exports = ConfigCommand;