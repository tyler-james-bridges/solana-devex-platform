const fs = require('fs-extra');
const path = require('path');
const toml = require('toml');

/**
 * Load configuration from TOML file
 */
async function loadConfig(configPath = 'solana-devex.toml') {
  try {
    const resolvedPath = path.resolve(configPath);
    
    if (!(await fs.pathExists(resolvedPath))) {
      // Return default config if file doesn't exist
      return getDefaultConfig();
    }
    
    const configContent = await fs.readFile(resolvedPath, 'utf8');
    const config = toml.parse(configContent);
    
    // Merge with defaults
    return mergeWithDefaults(config);
    
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
  }
}

/**
 * Save configuration to TOML file
 */
async function saveConfig(config, configPath = 'solana-devex.toml') {
  try {
    const resolvedPath = path.resolve(configPath);
    const configContent = stringifyToml(config);
    
    await fs.writeFile(resolvedPath, configContent, 'utf8');
    
  } catch (error) {
    throw new Error(`Failed to save config to ${configPath}: ${error.message}`);
  }
}

/**
 * Get default configuration
 */
function getDefaultConfig() {
  return {
    project: {
      name: 'my-solana-project',
      version: '0.1.0',
      description: 'A Solana project built with DevEx CLI'
    },
    networks: {
      devnet: {
        rpc_url: 'https://api.devnet.solana.com',
        ws_url: 'wss://api.devnet.solana.com'
      },
      testnet: {
        rpc_url: 'https://api.testnet.solana.com',
        ws_url: 'wss://api.testnet.solana.com'
      },
      mainnet: {
        rpc_url: 'https://api.mainnet-beta.solana.com',
        ws_url: 'wss://api.mainnet-beta.solana.com'
      },
      localhost: {
        rpc_url: 'http://localhost:8899',
        ws_url: 'ws://localhost:8900'
      }
    },
    build: {
      optimize: true,
      verify: false,
      parallel: true,
      output_dir: 'target'
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
      default_chains: ['solana']
    },
    tools: {
      auto_format: true,
      auto_lint: true,
      watch_mode: true
    }
  };
}

/**
 * Merge user config with defaults
 */
function mergeWithDefaults(userConfig) {
  const defaults = getDefaultConfig();
  return deepMerge(defaults, userConfig);
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Convert object to TOML string
 * Simple implementation - for production use a proper TOML library
 */
function stringifyToml(obj) {
  let tomlString = '';
  
  // Handle top-level simple values
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'object' || Array.isArray(value)) {
      tomlString += `${key} = ${formatTomlValue(value)}\n`;
    }
  }
  
  if (tomlString) {
    tomlString += '\n';
  }
  
  // Handle sections
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      tomlString += stringifyTomlSection(key, value);
    }
  }
  
  return tomlString;
}

/**
 * Stringify a TOML section
 */
function stringifyTomlSection(sectionName, sectionObj, parentPath = '') {
  let sectionString = '';
  const fullPath = parentPath ? `${parentPath}.${sectionName}` : sectionName;
  
  // Check if this section has nested objects
  const hasNestedObjects = Object.values(sectionObj).some(
    value => value && typeof value === 'object' && !Array.isArray(value)
  );
  
  // If section has simple values, write the section header and values
  const simpleValues = Object.entries(sectionObj).filter(
    ([key, value]) => typeof value !== 'object' || Array.isArray(value)
  );
  
  if (simpleValues.length > 0) {
    sectionString += `[${fullPath}]\n`;
    for (const [key, value] of simpleValues) {
      sectionString += `${key} = ${formatTomlValue(value)}\n`;
    }
    sectionString += '\n';
  }
  
  // Handle nested sections
  for (const [key, value] of Object.entries(sectionObj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sectionString += stringifyTomlSection(key, value, fullPath);
    }
  }
  
  return sectionString;
}

/**
 * Format a value for TOML output
 */
function formatTomlValue(value) {
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`;
  } else if (typeof value === 'boolean') {
    return value.toString();
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (Array.isArray(value)) {
    const formattedItems = value.map(item => formatTomlValue(item));
    return `[${formattedItems.join(', ')}]`;
  } else {
    return `"${String(value)}"`;
  }
}

/**
 * Validate configuration
 */
function validateConfig(config) {
  const errors = [];
  
  // Validate required fields
  if (!config.project?.name) {
    errors.push('project.name is required');
  }
  
  // Validate network configurations
  if (config.networks) {
    for (const [networkName, network] of Object.entries(config.networks)) {
      if (network.rpc_url && !isValidUrl(network.rpc_url)) {
        errors.push(`networks.${networkName}.rpc_url must be a valid URL`);
      }
      if (network.ws_url && !isValidUrl(network.ws_url)) {
        errors.push(`networks.${networkName}.ws_url must be a valid URL`);
      }
    }
  }
  
  // Validate numeric values
  if (config.test?.timeout && typeof config.test.timeout !== 'number') {
    errors.push('test.timeout must be a number');
  }
  
  if (config.deploy?.gas_limit && typeof config.deploy.gas_limit !== 'number') {
    errors.push('deploy.gas_limit must be a number');
  }
  
  return errors;
}

/**
 * Check if string is a valid URL
 */
function isValidUrl(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get config value by dot notation path
 */
function getConfigValue(config, path) {
  const keys = path.split('.');
  let current = config;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Set config value by dot notation path
 */
function setConfigValue(config, path, value) {
  const keys = path.split('.');
  let current = config;
  
  // Navigate to parent of target key
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    
    current = current[key];
  }
  
  // Set the final value
  current[keys[keys.length - 1]] = value;
  
  return config;
}

/**
 * Find config file in current or parent directories
 */
async function findConfigFile(filename = 'solana-devex.toml', startDir = process.cwd()) {
  let currentDir = startDir;
  
  while (currentDir !== path.dirname(currentDir)) {
    const configPath = path.join(currentDir, filename);
    
    if (await fs.pathExists(configPath)) {
      return configPath;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

module.exports = {
  loadConfig,
  saveConfig,
  getDefaultConfig,
  mergeWithDefaults,
  validateConfig,
  getConfigValue,
  setConfigValue,
  findConfigFile,
  stringifyToml
};