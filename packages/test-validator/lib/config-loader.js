const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const yaml = require('yaml');

const CONFIG_DIR = path.join(os.homedir(), '.solana-test-validator-ext');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yaml');
const ENVIRONMENTS_DIR = path.join(CONFIG_DIR, 'environments');

const DEFAULT_CONFIG = {
  default_environment: 'development',
  validator: {
    ledger_dir: path.join(CONFIG_DIR, 'ledger'),
    accounts_dir: path.join(CONFIG_DIR, 'accounts'),
    log_file: path.join(CONFIG_DIR, 'validator.log'),
    rpc_port: 8899,
    rpc_bind_address: '127.0.0.1',
    faucet_port: 9900,
    gossip_port: 8001,
    dynamic_port_range: '8002-8020',
    enable_rpc_transaction_history: true,
    enable_extended_tx_metadata_storage: true,
    limit_ledger_size: 50000000,
    slots_per_epoch: 432000
  },
  monitoring: {
    enabled: true,
    metrics_port: 3001,
    dashboard_port: 3002,
    collect_interval_ms: 1000,
    retention_hours: 24
  },
  automation: {
    auto_reset_on_start: false,
    auto_clone_accounts: [],
    setup_scripts: [],
    teardown_scripts: []
  },
  performance: {
    enable_profiling: true,
    max_cpu_usage_percent: 90,
    max_memory_usage_mb: 4096,
    alert_thresholds: {
      cpu_percent: 85,
      memory_mb: 3072,
      disk_gb: 90
    }
  }
};

async function ensureConfigDir() {
  await fs.ensureDir(CONFIG_DIR);
  await fs.ensureDir(ENVIRONMENTS_DIR);
  await fs.ensureDir(DEFAULT_CONFIG.validator.ledger_dir);
  await fs.ensureDir(DEFAULT_CONFIG.validator.accounts_dir);
}

async function createDefaultConfig() {
  await ensureConfigDir();
  
  if (!(await fs.pathExists(CONFIG_FILE))) {
    const configYaml = yaml.stringify(DEFAULT_CONFIG);
    await fs.writeFile(CONFIG_FILE, configYaml);
    console.log(`Default configuration created at: ${CONFIG_FILE}`);
  }
  
  return DEFAULT_CONFIG;
}

async function loadConfig() {
  await ensureConfigDir();
  
  if (!(await fs.pathExists(CONFIG_FILE))) {
    return await createDefaultConfig();
  }
  
  try {
    const configContent = await fs.readFile(CONFIG_FILE, 'utf8');
    const config = yaml.parse(configContent);
    
    // Merge with defaults to ensure all required properties exist
    return mergeWithDefaults(config, DEFAULT_CONFIG);
  } catch (error) {
    console.error(`Failed to load config: ${error.message}`);
    console.log('Using default configuration...');
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config) {
  await ensureConfigDir();
  const configYaml = yaml.stringify(config);
  await fs.writeFile(CONFIG_FILE, configYaml);
}

function mergeWithDefaults(config, defaults) {
  const merged = { ...defaults };
  
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      merged[key] = mergeWithDefaults(value, defaults[key] || {});
    } else {
      merged[key] = value;
    }
  }
  
  return merged;
}

function getConfigDir() {
  return CONFIG_DIR;
}

function getEnvironmentsDir() {
  return ENVIRONMENTS_DIR;
}

module.exports = {
  loadConfig,
  saveConfig,
  createDefaultConfig,
  getConfigDir,
  getEnvironmentsDir,
  DEFAULT_CONFIG
};